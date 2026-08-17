import { Prisma } from "@prisma/client";
import { D } from "../../utils/money.js";
import { prisma } from "../../prisma/client.js";
import { publishEvent } from "../../websocket/socket.js";
import { websocketEvents } from "../../websocket/events.js";
import { badRequest, conflict, notFound } from "../../utils/app-error.js";
import { tableRepository } from "./repository.js";
import type { createTableRequestSchema, listTablesSchema, updateTableSchema } from "./schema.js";
import type { z } from "zod";
import { auditRepository } from "../audit/repository.js";
import { sequenceRepository } from "../sequences/repository.js";
import { kotService } from "../kot/service.js";
import { kotRepository } from "../kot/repository.js";
import { calculateTotals, orderService } from "../orders/service.js";
import type { assignOrderSchema } from "./schema.js";

export const tableService = {
  // ─── Core CRUD ──────────────────────────────────────────────────────────────

  list: async (input: z.infer<typeof listTablesSchema>) => {
    const [tables, floors] = await Promise.all([
      tableRepository.list(input),
      tableRepository.distinctFloors(),
    ]);

    // Fetch active combines to group tables
    const activeGroups = await prisma.tableGroup.findMany({
      where: { isActive: true },
      include: {
        members: {
          where: { releasedAt: null },
          include: { table: true },
        },
      },
    });

    const mergedTables = tableService._mergeTablesWithGroups(tables, activeGroups);

    return { data: mergedTables, meta: { floors } };
  },

  occupied: async () => {
    const tables = await tableRepository.occupiedTables();
    const activeGroups = await prisma.tableGroup.findMany({
      where: { isActive: true },
      include: {
        members: {
          where: { releasedAt: null },
          include: { table: true },
        },
      },
    });
    return tableService._mergeTablesWithGroups(tables, activeGroups);
  },

  _mergeTablesWithGroups: (tables: any[], activeGroups: any[]) => {
    const merged: any[] = [];
    const processedTableIds = new Set<string>();

    for (const table of tables) {
      if (processedTableIds.has(table.id)) continue;

      // Check if this table is in an active group
      const group = activeGroups.find(g => g.members.some((m: any) => m.tableId === table.id));

      if (group) {
        // Find all tables in this group that are also in our current fetched list
        const groupTableIds = group.members.map((m: any) => m.tableId);
        const groupTables = tables.filter(t => groupTableIds.includes(t.id));

        // If the table list doesn't include all members (due to pagination/filters), 
        // we might just have a subset. We'll merge whatever is present.
        if (groupTables.length > 0) {
          const mergedTable = {
            ...groupTables[0],
            id: groupTables.map(t => t.id),
            name: groupTables.map(t => t.name).join(" + "),
            capacity: groupTables.reduce((sum, t) => sum + (t.capacity || 0), 0),
          };
          merged.push(mergedTable);
          groupTables.forEach(t => processedTableIds.add(t.id));
        }
      } else {
        // Not combined, just ensure id is an array for consistency as requested
        merged.push({
          ...table,
          id: [table.id]
        });
        processedTableIds.add(table.id);
      }
    }
    return merged;
  },

  create: async (input: z.infer<typeof createTableRequestSchema>) => {
    const isBatchObj = !Array.isArray(input) && 'tables' in input;
    let inputs: any[];
    if (Array.isArray(input)) {
      inputs = input;
    } else if (isBatchObj) {
      inputs = input.tables.map((table: any) => ({ ...table, floor: input.floor }));
    } else {
      inputs = [input];
    }
    
    const tables = await prisma.$transaction(async (tx) => {
      const createdTables = [];
      for (const data of inputs) {
        const table = await tableRepository.create(data as Prisma.DiningTableCreateInput, tx);
        createdTables.push(table);
      }
      return createdTables;
    });

    for (const table of tables) {
      publishEvent(websocketEvents.tableUpdated, table, "floor");
    }

    return (Array.isArray(input) || isBatchObj) ? tables : tables[0];
  },

  update: async (id: string, input: z.infer<typeof updateTableSchema>) => {
    const current = await tableRepository.findById(id);
    if (!current) throw notFound("Table");
    if (current.status === "OCCUPIED" && input.status && input.status !== "OCCUPIED") {
      throw conflict("Occupied tables must be released through the release endpoint");
    }
    const table = await tableRepository.update(id, input);
    publishEvent(websocketEvents.tableUpdated, table, "floor");
    return table;
  },

  remove: async (id: string) => {
    const current = await tableRepository.findById(id);
    if (!current) throw notFound("Table");
    if (current.status === "OCCUPIED") throw conflict("Occupied table cannot be deleted");

    const hasRelations = await tableRepository.hasRelatedRecords(id);
    
    let table;
    if (hasRelations) {
      table = await tableRepository.softDelete(id);
      publishEvent(websocketEvents.tableUpdated, table, "floor");
    } else {
      table = await tableRepository.hardDelete(id);
      publishEvent(websocketEvents.tableUpdated, { ...table, isDeleted: true }, "floor");
    }
    
    return table;
  },

  release: async (id: string, actorId: string, reason?: string, force: boolean = false) =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const table = await tableRepository.findById(id, tx);
      if (!table) throw notFound("Table");

      if (table.activeOrderId && !force) {
        const activeOrder = await tx.order.findUnique({
          where: { id: table.activeOrderId },
          select: { id: true, status: true }
        });
        if (activeOrder && activeOrder.status === "CONFIRMED") {
          const existingBill = await tx.bill.findFirst({
            where: { orderId: activeOrder.id, status: { not: "VOIDED" } },
            select: { id: true }
          });
          if (!existingBill) {
            throw conflict(
              "Cannot release table while its order is active and unbilled. Generate a bill or complete the order first, or use force release."
            );
          }
        }
      }

      // Auto-dissolve combine group if the table is part of one
      const activeGroup = await tableRepository.findActiveGroupForTable(id, tx);
      if (activeGroup) {
        const groupId = activeGroup.tableGroup.id;
        const group = await tableRepository.findGroupById(groupId, tx);

        if (group) {
          // Dissolve group
          await tableRepository.dissolveGroup(groupId, tx);



          const allTableIds = group.members.map((m: any) => m.tableId);

          await auditRepository.create(
            {
              actorId,
              action: "TABLE_UNCOMBINED",
              entity: "TableGroup",
              entityId: groupId,
              before: { tableIds: allTableIds, orderId: group.orderId },
              after: { isActive: false },
              reason: reason ?? "Table group dissolved automatically on release",
            },
            tx
          );

          const updatedTables = await Promise.all(
            allTableIds.map((tId: string) =>
              tx.diningTable.update({ where: { id: tId }, data: { status: "AVAILABLE", activeOrderId: null } })
            )
          );

          for (const updated of updatedTables) {
            await auditRepository.create(
              { actorId, action: "TABLE_RELEASED", entity: "DiningTable", entityId: updated.id, before: table, after: updated, reason },
              tx
            );
            publishEvent(websocketEvents.tableUpdated, updated, "floor");
          }

          return updatedTables.find((t) => t.id === id) || updatedTables[0];
        }
      }

      const updated = await tx.diningTable.update({
        where: { id },
        data: { status: "AVAILABLE", activeOrderId: null },
      });



      await auditRepository.create(
        { actorId, action: "TABLE_RELEASED", entity: "DiningTable", entityId: id, before: table, after: updated, reason },
        tx
      );
      publishEvent(websocketEvents.tableUpdated, updated, "floor");
      return updated;
    }),

  // ─── Assign / seat an order from the table side ───────────────────────────────
  // The order ⇄ table link is bidirectional: this is the table-side entry point.
  // Both modes delegate to orderService, which occupies/releases the table and
  // keeps order.tableId and table.activeOrderId in sync.
  assignOrder: async (
    tableId: string,
    input: z.infer<typeof assignOrderSchema>,
    actorId: string,
  ) => {
    // Attach mode: (re)seat an existing order at this table (moves it if needed).
    if (input.orderId) {
      return orderService.assignTable(input.orderId, tableId, actorId);
    }
    // Create mode: start a fresh dine-in order already seated at this table.
    return orderService.create(
      {
        channel: "DINE_IN",
        tableId,
        items: input.items ?? [],
        guestCount: input.guestCount,
        customerId: input.customerId,
        customerName: input.customerName,
        specialInstructions: input.specialInstructions,
        createDraftBill: false,
      },
      actorId,
    );
  },

  // ─── Swap ────────────────────────────────────────────────────────────────────

  swapTable: async (
    companyId: string,
    // orderId: string,
    fromTableId: string,
    toTableId: string,
    actorId: string,
    reason?: string
  ) =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const sourceTable = await tableRepository.findByIdInternal(fromTableId, tx);
      if (!sourceTable) throw notFound("Source Table");
      if (sourceTable.companyId !== companyId) throw conflict("Source table does not belong to this company");

      const orderId = sourceTable.activeOrderId;
      if (!orderId) throw conflict("Source table has no active order to swap");

      const targetTable = await tableRepository.findByIdInternal(toTableId, tx);
      if (!targetTable) throw notFound("Target table");
      if (targetTable.companyId !== companyId) throw conflict("Target table does not belong to this company");

      if (fromTableId === toTableId) throw badRequest("Cannot swap table with itself");

      const order = await tableRepository.getOrderWithtable(orderId, tx);
      if (!order) throw notFound("Order");
      if (order.status === "CANCELLED" || order.status === "VOIDED")
        throw conflict("Cannot swap table for cancelled or voided orders");
      if (order.tableId !== fromTableId) throw conflict("Order is not currently on the source table");

      const isTargetAvailable = await tableRepository.validateTargetTableAvailable(companyId, toTableId, tx);
      if (!isTargetAvailable) throw conflict("Target table is not available (occupied or in maintenance)");

      // Guest count capacity validation has been disabled as requested by user.
      // if (order.guestCount && order.guestCount > targetTable.capacity)
      //   throw badRequest(`Guest count (${order.guestCount}) exceeds target table capacity (${targetTable.capacity})`);

      const originalSourceStatus = sourceTable.status;
      const originalTargetStatus = targetTable.status;

      const releasedSource = await tableRepository.releaseSourceTable(fromTableId, tx);
      const occupiedTarget = await tableRepository.occupyTargetTable(toTableId, orderId, tx);
      const updatedOrder = await tableRepository.updateOrderTable(orderId, toTableId, tx);

      await auditRepository.create(
        {
          actorId,
          action: "TABLE_SWAPPED",
          entity: "DiningTable",
          entityId: fromTableId,
          before: {
            sourceTable: { id: fromTableId, name: sourceTable.name, status: originalSourceStatus },
            targetTable: { id: toTableId, name: targetTable.name, status: originalTargetStatus },
            orderId,
          },
          after: { sourceTable: releasedSource, targetTable: occupiedTarget, orderId: updatedOrder.id },
          reason: reason ?? `Table swap from ${sourceTable.name} to ${targetTable.name}`,
        },
        tx
      );

      publishEvent(websocketEvents.tableUpdated, releasedSource, "floor");
      publishEvent(websocketEvents.tableUpdated, occupiedTarget, "floor");
      publishEvent(websocketEvents.orderUpdated, updatedOrder, "kitchen");

      return { success: true, sourceTable: releasedSource, targetTable: occupiedTarget, order: updatedOrder };
    }),

  // ─── Combine ─────────────────────────────────────────────────────────────────

  combineTable: async (
    companyId: string,
    tableIds: string[],
    actorId: string,
    reason?: string
  ) =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. No duplicate IDs
      if (new Set(tableIds).size !== tableIds.length)
        throw badRequest("Duplicate table IDs in the combine request");

      // 2. Fetch & validate every table
      const tables = await Promise.all(tableIds.map((id: string) => tableRepository.findByIdInternal(id, tx)));
      for (let i = 0; i < tables.length; i++) {
        if (!tables[i]) throw notFound(`Table ${tableIds[i]}`);
        if (tables[i]!.companyId !== companyId) throw conflict("A table does not belong to this company");
        if (tables[i]!.status === "MAINTENANCE") throw conflict(`Table "${tables[i]!.name}" is under maintenance`);
      }

      // 3. Check none are already in an active group
      for (const id of tableIds) {
        const existing = await tableRepository.findActiveGroupForTable(id, tx);
        if (existing) {
          const t = tables.find((t: any) => t?.id === id)!;
          throw conflict(`Table "${t.name}" is already in an active table group`);
        }
      }

      // 4. Categorize tables: occupied (with orders) vs available
      const occupiedTables = tables.filter(t => t!.status === "OCCUPIED" && t!.activeOrderId) as Array<NonNullable<typeof tables[0]>>;
      const availableTables = tables.filter(t => t!.status === "AVAILABLE") as Array<NonNullable<typeof tables[0]>>;
      // Tables that are OCCUPIED but have no activeOrderId (edge case) — treat as available
      const occupiedNoOrder = tables.filter(t => t!.status === "OCCUPIED" && !t!.activeOrderId) as Array<NonNullable<typeof tables[0]>>;

      // Validate: only OCCUPIED and AVAILABLE tables allowed (RESERVED is excluded)
      if (occupiedTables.length + availableTables.length + occupiedNoOrder.length !== tables.length) {
        throw conflict("All tables must be either AVAILABLE or OCCUPIED to combine");
      }

      // 5. Collect orders from occupied tables & validate them
      const orderIds: string[] = [];
      const ordersWithItems: Array<NonNullable<Awaited<ReturnType<typeof tableRepository.getOrderWithItemsForMerge>>>> = [];

      for (const table of occupiedTables) {
        const order = await tableRepository.getOrderWithItemsForMerge(table.activeOrderId!, tx);
        if (!order) throw notFound(`Order for table "${table.name}"`);
        if (order.status === "CANCELLED" || order.status === "VOIDED")
          throw conflict(`Order #${order.orderNumber} on table "${table.name}" is ${order.status.toLowerCase()}`);
        if (order.channel !== "DINE_IN")
          throw badRequest("Table combine is only available for Dine-In orders");

        // Block if the order has a paid bill — can't merge after money moved
        if (order.bill && (order.bill.status === "PAID" || D(order.bill.paid || 0).gt(0)))
          throw conflict(`Order #${order.orderNumber} has a paid bill — cannot merge`);

        // Void any unpaid bill on this order
        if (order.bill && order.bill.status !== "VOIDED") {
          await tx.bill.update({
            where: { id: order.bill.id },
            data: { status: "VOIDED" },
          });
        }

        orderIds.push(order.id);
        ordersWithItems.push(order);
      }

      // 6. Build merged items from ALL occupied orders
      const allItemCreates: Prisma.OrderItemCreateWithoutOrderInput[] = [];
      let totalGuestCount = 0;

      for (const order of ordersWithItems) {
        if (order.guestCount) totalGuestCount += order.guestCount;

        for (const item of order.items) {
          allItemCreates.push({
            menuItem: { connect: { id: item.menuItemId } },
            ...(item.variantId ? { variant: { connect: { id: item.variantId } } } : {}),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost,
            addonTotal: item.addonTotal,
            lineSubtotal: item.lineSubtotal,
            specialInstructions: item.specialInstructions,
            addons: {
              create: item.addons.map((a) => ({
                addon: { connect: { id: a.addonId } },
                quantity: a.quantity,
                unitPrice: a.unitPrice,
                total: a.total,
              })),
            },
          });
        }
      }

      // 7. Create the new merged order
      const hasItems = allItemCreates.length > 0;
      const newStatus = "CONFIRMED" as const;
      const totals = hasItems
        ? calculateTotals(allItemCreates.map(item => ({ lineSubtotal: item.lineSubtotal as Prisma.Decimal })))
        : { subtotal: D(0), discountAmount: D(0), discountPercentage: D(0), grandTotal: D(0) };
      const orderNumber = await sequenceRepository.next(tx, companyId, "ORDER");
      const primaryTableId = tableIds[0]!; // first table in the list (guaranteed by min(2) schema validation)

      const mergedOrder = await tableRepository.createMergedOrder(
        {
          orderNumber,
          tableId: primaryTableId,
          createdById: actorId,
          guestCount: totalGuestCount > 0 ? totalGuestCount : undefined,
          items: allItemCreates,
          totals,
          status: newStatus,
        },
        tx
      );

      // 8. Mark old orders as COMPLETED + link to merged order
      if (orderIds.length > 0) {
        await tableRepository.markOrdersMerged(orderIds, mergedOrder.id, tx);

        // Retire the source orders' KOTs so the kitchen doesn't see their items
        // twice — once on the old tickets and again on the merged order's fresh
        // ticket generated below.
        const cancelledKots = await kotRepository.cancelForOrders(orderIds, tx);
        for (const ticket of cancelledKots) {
          publishEvent(
            websocketEvents.kotUpdated,
            { id: ticket.id, orderId: ticket.orderId, status: "CANCELLED" },
            "kitchen",
          );
        }
      }

      // 9. Update table states
      // Primary table: set activeOrderId to new merged order
      await tableRepository.occupyTargetTable(primaryTableId, mergedOrder.id, tx);

      // All other tables: mark OCCUPIED without activeOrderId (group tracks the link)
      const secondaryTableIds = tableIds.filter(id => id !== primaryTableId);
      for (const id of secondaryTableIds) {
        const table = tables.find(t => t!.id === id)!;
        if (table.activeOrderId) {
          // Was occupied — clear its activeOrderId
          await tx.diningTable.update({
            where: { id },
            data: { status: "OCCUPIED", activeOrderId: null },
          });
        } else {
          // Was available — just mark occupied
          await tableRepository.markOccupied(id, tx);
        }
      }

      // 10. Create group record (links all tables to the new merged order)
      const group = await tableRepository.createGroup(
        { orderId: mergedOrder.id, combinedById: actorId, reason, tableIds },
        tx
      );

      // 11. Generate KOT for the merged order (only if it has items)
      if (hasItems) {
        await kotService.generateForOrder(mergedOrder.id, tx);
      }

      // 12. Audit — TABLE_COMBINED
      const tableNames = tables.map((t: any) => t!.name).join(", ");
      await auditRepository.create(
        {
          actorId,
          action: "TABLE_COMBINED",
          entity: "TableGroup",
          entityId: group.id,
          before: null,
          after: { tableIds, mergedOrderId: mergedOrder.id, previousOrderIds: orderIds },
          reason: reason ?? `Combined tables: ${tableNames}`,
        },
        tx
      );

      // 13. Audit — ORDER_MERGED (only if orders were merged)
      if (orderIds.length > 0) {
        await auditRepository.create(
          {
            actorId,
            action: "ORDER_MERGED",
            entity: "Order",
            entityId: mergedOrder.id,
            before: { orderIds, orderNumbers: ordersWithItems.map(o => o.orderNumber) },
            after: { mergedOrderId: mergedOrder.id, mergedOrderNumber: mergedOrder.orderNumber },
            reason: reason ?? `Merged ${orderIds.length} orders into ${mergedOrder.orderNumber}`,
          },
          tx
        );
      }

      // 14. Publish websocket events for every table
      for (const id of tableIds) {
        publishEvent(websocketEvents.tableUpdated, { id, status: "OCCUPIED" }, "floor");
      }
      publishEvent(websocketEvents.orderUpdated, mergedOrder, "kitchen");

      // 15. Build response
      return {
        group: {
          id: group.id,
          orderId: mergedOrder.id,
          isActive: true,
          members: group.members.map((m: any) => ({
            tableId: m.tableId,
            tableName: m.table?.name ?? m.tableId,
          })),
        },
        mergedOrder: {
          id: mergedOrder.id,
          orderNumber: mergedOrder.orderNumber,
          grandTotal: mergedOrder.grandTotal,
          itemCount: mergedOrder.items.length,
        },
        previousOrders: ordersWithItems.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: "COMPLETED",
          mergedIntoOrderId: mergedOrder.id,
        })),
      };
    }),

  // ─── Split ──────────────────────────────────────────────────────────────────

  splitTable: async (
    companyId: string,
    sourceOrderId: string,
    fromTableId: string,
    toTableId: string,
    items: Array<{ orderItemId: string; quantity: number }>,
    actorId: string,
    reason?: string
  ) =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Validate source table
      const sourceTable = await tableRepository.findByIdInternal(fromTableId, tx);
      if (!sourceTable) throw notFound("Source Table");
      if (sourceTable.companyId !== companyId) throw conflict("Source table does not belong to this company");
      if (sourceTable.status !== "OCCUPIED") throw conflict("Source table is not occupied");
      if (sourceTable.activeOrderId !== sourceOrderId)
        throw conflict("The specified order is not the active order on the source table");

      // 2. Validate target table
      if (fromTableId === toTableId) throw badRequest("Cannot split to the same table");
      const isTargetAvailable = await tableRepository.validateTargetTableAvailable(companyId, toTableId, tx);
      if (!isTargetAvailable) throw conflict("Target table is not available (occupied or in maintenance)");
      const targetTable = await tableRepository.findByIdInternal(toTableId, tx);
      if (!targetTable) throw notFound("Target Table");

      // 3. Block if source is in a combine group
      const activeCombine = await tableRepository.findActiveGroupForTable(fromTableId, tx);
      if (activeCombine) throw conflict("Cannot split from a table that is part of an active combine group");

      // 4. Validate the source order
      const sourceOrder = await tableRepository.getOrderWithtable(sourceOrderId, tx);
      if (!sourceOrder) throw notFound("Source Order");
      if (sourceOrder.status === "CANCELLED" || sourceOrder.status === "VOIDED")
        throw conflict("Cannot split a cancelled or voided order");
      if (sourceOrder.channel !== "DINE_IN")
        throw badRequest("Table split is only available for Dine-In orders");

      // 5. Fetch the requested order items
      const orderItemIds = items.map((i) => i.orderItemId);
      const orderItems = await tableRepository.getOrderItemsForSplit(orderItemIds, sourceOrderId, tx);
      if (orderItems.length !== items.length)
        throw notFound("One or more order items not found in the source order");

      // 6. Validate quantities and build clone data
      const newItemCreates: Prisma.OrderItemCreateWithoutOrderInput[] = [];

      for (const requested of items) {
        const original = orderItems.find((oi) => oi.id === requested.orderItemId);
        if (!original) throw notFound(`Order item ${requested.orderItemId}`);
        if (requested.quantity > original.quantity)
          throw badRequest(
            `Requested split quantity (${requested.quantity}) exceeds available quantity (${original.quantity}) for item "${original.menuItem.name}"`
          );

        // Build the cloned item for the new order
        const unitPriceWithAddons = original.unitPrice.plus(original.addonTotal);
        const splitLineSubtotal = unitPriceWithAddons.times(requested.quantity);

        newItemCreates.push({
          menuItem: { connect: { id: original.menuItemId } },
          ...(original.variantId ? { variant: { connect: { id: original.variantId } } } : {}),
          quantity: requested.quantity,
          unitPrice: original.unitPrice,
          addonTotal: original.addonTotal,
          lineSubtotal: splitLineSubtotal,
          specialInstructions: original.specialInstructions,
          addons: {
            create: original.addons.map((a) => ({
              addon: { connect: { id: a.addonId } },
              quantity: a.quantity,
              unitPrice: a.unitPrice,
              total: a.total,
            })),
          },
        });
      }

      // 7. Adjust source order items (decrement or delete)
      for (const requested of items) {
        const original = orderItems.find((oi) => oi.id === requested.orderItemId)!;
        if (requested.quantity === original.quantity) {
          // Full quantity move — delete the item from source
          await tableRepository.deleteOrderItemFull(original.id, tx);
        } else {
          // Partial quantity — decrement
          const remainingQty = original.quantity - requested.quantity;
          const unitPriceWithAddons = original.unitPrice.plus(original.addonTotal);
          const newLineSubtotal = unitPriceWithAddons.times(remainingQty);
          await tableRepository.decrementOrderItemQty(original.id, remainingQty, newLineSubtotal, tx);
        }
      }

      // 8. Recalculate source order totals
      const remainingItems = await tx.orderItem.findMany({
        where: { orderId: sourceOrderId },
        select: { lineSubtotal: true },
      });

      const allItemsSplit = remainingItems.length === 0;

      if (!allItemsSplit) {
        const sourceTotals = calculateTotals(remainingItems);
        await tx.order.update({
          where: { id: sourceOrderId },
          data: sourceTotals,
        });
      }

      // 9. Generate new order number & create the split order
      const orderNumber = await sequenceRepository.next(tx, companyId, "ORDER");
      const newOrderTotals = calculateTotals(newItemCreates.map((item) => ({
        lineSubtotal: item.lineSubtotal as Prisma.Decimal,
      })));

      const newOrder = await tableRepository.createSplitOrder(
        {
          orderNumber,
          channel: "DINE_IN",
          tableId: toTableId,
          createdById: actorId,
          items: newItemCreates,
          totals: newOrderTotals,
        },
        tx
      );

      // 10. Occupy target table
      const occupiedTarget = await tableRepository.occupyTargetTable(toTableId, newOrder.id, tx);

      // 11. Generate KOT for the new order
      await kotService.generateForOrder(newOrder.id, tx);

      // 12. Handle all-items-split edge case: auto-cancel source & release table
      let updatedSourceTable = sourceTable;
      if (allItemsSplit) {
        await tx.order.update({
          where: { id: sourceOrderId },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            subtotal: D(0),
            discountAmount: D(0), discountPercentage: D(0),
            grandTotal: D(0),
          },
        });
        updatedSourceTable = await tableRepository.releaseSourceTable(fromTableId, tx) as any;
        publishEvent(websocketEvents.tableUpdated, updatedSourceTable, "floor");
      }

      // 13. Create the split record
      const splitRecord = await tableRepository.createSplitRecord(
        {
          companyId,
          sourceOrderId,
          newOrderId: newOrder.id,
          fromTableId,
          toTableId,
          splitById: actorId,
        },
        tx
      );

      // 14. Audit log
      await auditRepository.create(
        {
          actorId,
          action: "TABLE_SPLIT",
          entity: "TableSplit",
          entityId: splitRecord.id,
          before: {
            sourceOrderId,
            fromTableId,
            fromTableName: sourceTable.name,
            items: items.map((i) => ({
              orderItemId: i.orderItemId,
              quantity: i.quantity,
            })),
          },
          after: {
            newOrderId: newOrder.id,
            newOrderNumber: newOrder.orderNumber,
            toTableId,
            toTableName: targetTable.name,
            allItemsSplit,
          },
          reason: reason ?? `Split items from ${sourceTable.name} to ${targetTable.name}`,
        },
        tx
      );

      // 15. Publish websocket events
      publishEvent(websocketEvents.tableUpdated, occupiedTarget, "floor");
      publishEvent(websocketEvents.orderUpdated, newOrder, "kitchen");

      // Re-fetch source order for response
      const finalSourceOrder = await tableRepository.getOrderWithtable(sourceOrderId, tx);

      return {
        success: true,
        split: splitRecord,
        sourceOrder: finalSourceOrder,
        newOrder,
        sourceTable: allItemsSplit ? updatedSourceTable : { id: sourceTable.id, name: sourceTable.name, status: sourceTable.status },
        targetTable: occupiedTarget,
      };
    }),

  // ─── Helper: resolve tableId from sourceOrderId ─────────────────────────────
  getOrderTable: async (sourceOrderId: string, companyId: string) => {
    const order = await prisma.order.findFirst({
      where: { id: sourceOrderId, companyId },
      select: { tableId: true }
    });
    if (!order) throw notFound("Source Order");
    if (!order.tableId) throw conflict("Source order has no table assignment");
    return { tableId: order.tableId };
  },
};
