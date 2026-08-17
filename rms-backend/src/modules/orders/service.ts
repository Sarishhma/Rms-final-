import { Prisma } from "@prisma/client";
import { D } from "../../utils/money.js";
import { prisma } from "../../prisma/client.js";
import { badRequest, conflict, notFound } from "../../utils/app-error.js";
import { getCompanyId } from "../../utils/context.js";
import { businessDateFor } from "../../utils/dates.js";
import { paginationMeta } from "../../utils/pagination.js";
import { publishEvent } from "../../websocket/socket.js";
import { websocketEvents } from "../../websocket/events.js";
import { auditRepository } from "../audit/repository.js";
import { billingService, billIsLocked, calculateBillTotals } from "../billing/service.js";
import { kotRepository } from "../kot/repository.js";
import { buildKitchenPrinterJobs } from "../kitchen-stations/printer-jobs.js";
import { kotService } from "../kot/service.js";
import { sequenceRepository } from "../sequences/repository.js";
import { stockRepository } from "../stock/repository.js";
import { stockService } from "../stock/service.js";
import type {
  createOrderSchema,
  listOrdersSchema,
  updateOrderSchema,
} from "./schema.js";
import { orderDetailSelect, orderRepository } from "./repository.js";
import type { OrderItemInput } from "./types.js";
import type { z } from "zod";

// ── Batched menu-item validation ────────────────────────────────────────────
// Instead of calling assertSellableItem once per item (N queries), we fetch all
// menu items + their active variants in a single findMany, then validate each
// order item against the in-memory map.

type SellableInfo = {
  id: string;
  basePrice: Prisma.Decimal;
  trackStock: boolean;
  variants: Array<{ id: string; price: Prisma.Decimal; trackStock: boolean }>;
};

const batchAssertSellable = async (
  items: OrderItemInput[],
  tx: Prisma.TransactionClient,
): Promise<Map<string, SellableInfo>> => {
  const menuItemIds = [...new Set(items.map((i) => i.menuItemId))];

  const menuItems = await tx.menuItem.findMany({
    where: { id: { in: menuItemIds }, isDeleted: false, isAvailable: true },
    select: {
      id: true,
      basePrice: true,
      trackStock: true,
      variants: {
        where: { isDeleted: false, isAvailable: true },
        select: { id: true, price: true, trackStock: true },
      },
    },
  });

  const map = new Map<string, SellableInfo>(menuItems.map((m) => [m.id, m]));

  // Validate every requested item exists and is available
  for (const item of items) {
    const menu = map.get(item.menuItemId);
    if (!menu) throw conflict("Menu item is unavailable");
    if (item.variantId) {
      const variant = menu.variants.find((v) => v.id === item.variantId);
      if (!variant) throw conflict("Menu variant is unavailable");
    }
  }

  return map;
};

const getSellablePrice = (
  menu: SellableInfo,
  variantId?: string | null,
): { unitPrice: Prisma.Decimal; trackStock: boolean } => {
  if (variantId) {
    const variant = menu.variants.find((v) => v.id === variantId);
    return {
      unitPrice: variant?.price ?? menu.basePrice,
      trackStock: variant?.trackStock ?? menu.trackStock,
    };
  }
  return { unitPrice: menu.basePrice, trackStock: menu.trackStock };
};

// ── Build order items ───────────────────────────────────────────────────────

const buildOrderItems = async (
  items: OrderItemInput[],
  tx: Prisma.TransactionClient,
) => {
  const creates: Prisma.OrderItemCreateWithoutOrderInput[] = [];
  const menuMap = await batchAssertSellable(items, tx);

  for (const item of items) {
    const menu = menuMap.get(item.menuItemId)!;
    const { unitPrice } = getSellablePrice(menu, item.variantId);

    const addons = item.addonIds?.length
      ? await tx.menuAddon.findMany({
          where: {
            id: { in: item.addonIds },
            isDeleted: false,
            isAvailable: true,
          },
        })
      : [];

    if ((item.addonIds?.length ?? 0) !== addons.length) {
      throw conflict("One or more addons are unavailable");
    }

    const addonTotal = addons.reduce(
      (sum, addon) => sum.plus(addon.price),
      D(0),
    );
    const lineSubtotal =
      unitPrice.plus(addonTotal).times(item.quantity);

    creates.push({
      menuItem: { connect: { id: item.menuItemId } },
      ...(item.variantId ? { variant: { connect: { id: item.variantId } } } : {}),
      quantity: item.quantity,
      unitPrice,
      addonTotal,
      lineSubtotal,
      specialInstructions: normalizeInstructions(item.specialInstructions),
      courseName: item.courseName,
      fireAt: item.fireAt,
      addons: {
        create: addons.map((addon) => ({
          addon: { connect: { id: addon.id } },
          quantity: 1,
          unitPrice: addon.price,
          total: addon.price,
        })),
      },
    });
  }

  return creates;
};

// A blank note ("" or whitespace) means "no instructions" and is equivalent to
// null. The client sends "" for an empty note while existing rows persist null,
// so normalizing both sides keeps an unchanged line's key stable — otherwise a
// blank-vs-null mismatch makes the reconciler treat every line as removed and
// re-added, cancelling and re-firing food that never actually changed.
export const normalizeInstructions = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export const orderItemKeyFromInput = (item: OrderItemInput) =>
  JSON.stringify({
    menuItemId: item.menuItemId,
    variantId: item.variantId ?? null,
    specialInstructions: normalizeInstructions(item.specialInstructions),
    addonIds: [...(item.addonIds ?? [])].sort()
  });

export const orderItemKeyFromExisting = (item: {
  menuItemId: string;
  variantId: string | null;
  specialInstructions: string | null;
  addons: Array<{ addonId: string; quantity: number }>;
}) =>
  JSON.stringify({
    menuItemId: item.menuItemId,
    variantId: item.variantId ?? null,
    specialInstructions: normalizeInstructions(item.specialInstructions),
    addonIds: item.addons.flatMap((addon) => Array.from({ length: addon.quantity }, () => addon.addonId)).sort()
  });

type ReconcileExisting = {
  id: string;
  menuItemId: string;
  variantId: string | null;
  specialInstructions: string | null;
  quantity: number;
  addons: Array<{ addonId: string; quantity: number }>;
};

export type AdditivePlan<E> = {
  // Item already on the order (same dish + variant + note + addons): bump the
  // existing line's quantity by `addQuantity`.
  increments: Array<{ existing: E; addQuantity: number }>;
  // Item not currently on the order: create it as a new add-on line.
  additions: OrderItemInput[];
};

// Pure decision step for an additive PATCH: the requested items are things to
// ADD to the order, never a whole-order replacement. Each requested line either
// matches an existing line (increment its quantity) or is new (add it). Existing
// lines with no requested counterpart are deliberately absent from the plan —
// a PATCH never cancels food already on the order.
export const planAdditive = <E extends ReconcileExisting>(
  existing: E[],
  requested: OrderItemInput[],
): AdditivePlan<E> => {
  const byKey = new Map<string, E[]>();
  for (const item of existing) {
    const key = orderItemKeyFromExisting(item);
    byKey.set(key, [...(byKey.get(key) ?? []), item]);
  }

  const increments: AdditivePlan<E>["increments"] = [];
  const additions: OrderItemInput[] = [];
  for (const req of requested) {
    const key = orderItemKeyFromInput(req);
    const bucket = byKey.get(key);
    const match = bucket?.shift();
    if (bucket && bucket.length === 0) byKey.delete(key);
    if (match) increments.push({ existing: match, addQuantity: req.quantity });
    else additions.push(req);
  }

  return { increments, additions };
};

const updateOrderItemQuantity = async (
  tx: Prisma.TransactionClient,
  item: {
    id: string;
    unitPrice: Prisma.Decimal;
    addonTotal: Prisma.Decimal;
  },
  quantity: number
) =>
  tx.orderItem.update({
    where: { id: item.id },
    data: {
      quantity,
      lineSubtotal: item.unitPrice.plus(item.addonTotal).times(quantity)
    },
    select: { id: true }
  });

const createOrderItemsForInputs = async (
  tx: Prisma.TransactionClient,
  orderId: string,
  inputs: OrderItemInput[]
) => {
  if (inputs.length === 0) return [] as Array<{ id: string; menuItemId: string; variantId: string | null; quantity: number }>;
  const itemCreates = await buildOrderItems(inputs, tx);
  const created = [];
  for (const itemCreate of itemCreates) {
    created.push(
      await tx.orderItem.create({
        data: {
          order: { connect: { id: orderId } },
          ...itemCreate
        },
        select: { id: true, menuItemId: true, variantId: true, quantity: true }
      })
    );
  }
  return created;
};

export const calculateTotals = (
  items: Array<{ lineSubtotal: Prisma.Decimal }>,
  discountAmount: Prisma.Decimal = D(0),
  discountPercentage: Prisma.Decimal = D(0)
) => {
  const subtotal = items.reduce(
    (sum, item) => sum.plus(item.lineSubtotal),
    D(0),
  );

  const calculatedDiscount = discountPercentage.gt(0) 
      ? subtotal.times(discountPercentage).dividedBy(100) 
      : discountAmount;

  if (calculatedDiscount.gt(subtotal))
    throw badRequest("Discount cannot exceed subtotal");

  const grandTotal = subtotal.minus(calculatedDiscount);

  return {
    subtotal,
    discountAmount: calculatedDiscount,
    discountPercentage,
    grandTotal,
  };
};

// Derives paymentStatus from the bill's current state and aggregate
// completed payments, not from the latest payment row — voids of older
// payments would otherwise leave a stale "COMPLETED" status on an unpaid bill.
const formatOrder = (order: any) => {
  const bill = order.bill;
  let paymentStatus: "PENDING" | "PARTIAL" | "PAID" | "REFUNDED" | "VOIDED" = "PENDING";

  if (bill) {
    if (bill.status === "VOIDED") paymentStatus = "VOIDED";
    else if (bill.status === "REFUNDED") paymentStatus = "REFUNDED";
    else if (bill.status === "PAID") paymentStatus = "PAID";
    else if (bill.status === "PARTIALLY_PAID") paymentStatus = "PARTIAL";
    else paymentStatus = "PENDING";
  }

  const { bill: _removedBill, ...rest } = order;
  
  let rcpt = null;
  if (bill) {
    rcpt = {
      ...bill,
      billGeneratedSequence: bill.generationCount
    };
    if (rcpt.billNumber) {
      // Rename billNumber to rcptNumber and ensure the prefix is RCPT-
      rcpt.rcptNumber = rcpt.billNumber.replace(/^(BILL|RECEIPT)-/, 'RCPT-');
      delete rcpt.billNumber;
    }
    delete rcpt.generationCount;
  }

  return {
    ...rest,
    rcpt,
    paymentStatus,
  };
};

// ── Combined table name enrichment ──────────────────────────────────────────
// When an order belongs to an active TableGroup (combined tables), the plain
// `order.table.name` only shows the primary table. This helper replaces the
// name with the merged form (e.g. "Table 1 + Table 2") so list / detail
// responses stay consistent with how the tables module presents groups.

const enrichOrdersWithCombinedTableNames = async (orders: any[]): Promise<any[]> => {
  // Collect order IDs that have a table (only DINE_IN orders are relevant)
  const orderIds = orders.filter(o => o.table).map(o => o.id);
  if (orderIds.length === 0) return orders;

  // Batch-fetch all active groups whose orderId is in our set
  const activeGroups = await prisma.tableGroup.findMany({
    where: { orderId: { in: orderIds }, isActive: true },
    include: {
      members: {
        where: { releasedAt: null },
        include: { table: { select: { id: true, name: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (activeGroups.length === 0) return orders;

  // Build a orderId → combined name map
  const combinedNameByOrderId = new Map<string, string>();
  for (const group of activeGroups) {
    const combinedName = group.members.map(m => m.table.name).join(" + ");
    combinedNameByOrderId.set(group.orderId, combinedName);
  }

  return orders.map(order => {
    const combinedName = combinedNameByOrderId.get(order.id);
    if (combinedName && order.table) {
      return { ...order, table: { ...order.table, name: combinedName } };
    }
    return order;
  });
};


// ── Table ⇄ order seating (bidirectional sync) ──────────────────────────────
// An order and the table it sits at must agree: order.tableId points at the
// table and table.activeOrderId points back at the order. These helpers keep
// both sides in lockstep whenever an order is seated, moved, or unseated — no
// matter whether the change starts from the order side or the table side.

/** Throw unless `tableId` exists, is live, and is free (or already held by `orderId`). */
const assertTableSeatable = async (
  tx: Prisma.TransactionClient,
  tableId: string,
  orderId: string | null,
) => {
  const companyId = getCompanyId();
  // Lock the table row for the rest of the transaction so concurrent seatings of
  // the same table serialize instead of racing to occupy it. ($queryRaw bypasses
  // the tenant extension, so the companyId scope is applied explicitly here.)
  const rows = await tx.$queryRaw<Array<{ status: string; activeOrderId: string | null }>>`
    SELECT status::text AS status, "activeOrderId"
    FROM "DiningTable"
    WHERE id = ${tableId} AND "companyId" = ${companyId} AND "isDeleted" = false
    FOR UPDATE
  `;
  const table = rows[0];
  if (!table) throw notFound("Table");
  if (table.status === "MAINTENANCE") throw conflict("Table is under maintenance");
  if (table.activeOrderId && table.activeOrderId !== orderId)
    throw conflict(
      "Table already has an active order. Release the table before seating a new order.",
    );
};

/**
 * Move an order's seating from `oldTableId` to `newTableId` (either may be null).
 * Releases the old table only if it is actually held by this order, and occupies
 * the new one. The caller must have validated the new table with assertTableSeatable.
 */
const syncTableAssignment = async (
  tx: Prisma.TransactionClient,
  orderId: string,
  oldTableId: string | null,
  newTableId: string | null,
) => {
  if (oldTableId === newTableId) return;

  if (oldTableId) {
    await tx.diningTable.updateMany({
      where: { id: oldTableId, activeOrderId: orderId },
      data: { status: "AVAILABLE", activeOrderId: null },
    });
    publishEvent(
      websocketEvents.tableUpdated,
      { id: oldTableId, status: "AVAILABLE", activeOrderId: null },
      "floor",
    );
  }

  if (newTableId) {
    await tx.diningTable.update({
      where: { id: newTableId },
      data: { status: "OCCUPIED", activeOrderId: orderId },
    });
    publishEvent(
      websocketEvents.tableUpdated,
      { id: newTableId, status: "OCCUPIED", activeOrderId: orderId },
      "floor",
    );
  }
};

// Return daily stock for every stock-tracked line of an order. Used when a
// confirmed order's outgoing items are dropped (edit) or the whole order is
// cancelled/voided. Best-effort: a line whose item has no stock row for the
// business date is silently skipped. Assumes same-business-day reversal — the
// same assumption the edit path already makes.
const restoreOrderStock = async (
  tx: Prisma.TransactionClient,
  items: Array<{
    menuItemId: string;
    variantId: string | null;
    quantity: number;
    menuItem: { trackStock: boolean };
    variant: { trackStock: boolean } | null;
  }>,
  businessDate: Date,
) => {
  for (const item of items) {
    const tracksStock = item.variantId
      ? item.variant?.trackStock ?? item.menuItem.trackStock
      : item.menuItem.trackStock;
    if (tracksStock) {
      await stockService.restoreForOrderItem(
        businessDate,
        item.menuItemId,
        item.variantId,
        item.quantity,
        tx,
      );
    }
  }
};

// When an order is cancelled or voided, settle its bill safely:
//  • PARTIALLY_PAID / PAID → block: money is held, refund it first.
//  • OPEN                  → void it atomically (where status='OPEN') so no
//                            payment can attach afterwards. A 0-row result means
//                            a payment landed concurrently (paymentService.create
//                            locks the same row) — surface it instead of stranding
//                            the money.
//  • REFUNDED / VOIDED     → already terminal & non-payable; leave as-is.
const settleBillForClosedOrder = async (
  tx: Prisma.TransactionClient,
  bill: { id: string; status: string },
  verb: "cancelling" | "voiding",
) => {
  if (bill.status === "PARTIALLY_PAID" || bill.status === "PAID")
    throw conflict(`Order has completed payments — refund them before ${verb}`);
  if (bill.status === "OPEN") {
    const res = await tx.bill.updateMany({
      where: { id: bill.id, status: "OPEN" },
      data: { status: "VOIDED" },
    });
    if (res.count === 0)
      throw conflict(`A payment was just recorded on this order — refund it before ${verb}`);
  }
};

export const orderService = {
  list: async (input: z.infer<typeof listOrdersSchema>) => {
    const [total, rows] = await orderRepository.list(input);
    const formatted = rows.map(formatOrder);
    const data = await enrichOrdersWithCombinedTableNames(formatted);
    return { data, meta: paginationMeta(input, total) };
  },

  get: async (id: string) => {
    const order = await orderRepository.findById(id);
    if (!order) throw notFound("Order");
    const [enriched] = await enrichOrdersWithCombinedTableNames([formatOrder(order)]);
    return enriched;
  },

  create: async (input: z.infer<typeof createOrderSchema>, actorId: string) => {
    const companyId = getCompanyId();
    if (!companyId) throw badRequest("Missing tenant context");
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Seating a dine-in order at a table occupies it immediately
      if (input.tableId) await assertTableSeatable(tx, input.tableId, null);

      if (input.customerId) {
        const customer = await tx.customer.findFirst({
          where: { id: input.customerId, isDeleted: false },
          select: { id: true },
        });
        if (!customer) throw notFound("Customer");
      }

      const itemCreates = await buildOrderItems(input.items, tx);
      const totals = calculateTotals(itemCreates.map(i => ({ lineSubtotal: D(i.lineSubtotal as any ?? 0) })));
      const orderNumber = await sequenceRepository.next(tx, companyId, "ORDER");

      const order = await tx.order.create({
        data: {
          orderNumber,
          channel: input.channel,
          tableId: input.tableId,
          customerId: input.customerId,
          customerName: input.customerName,
          createdById: actorId,
          guestCount: input.guestCount,
          specialInstructions: input.specialInstructions,
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          discountPercentage: totals.discountPercentage,
          grandTotal: totals.grandTotal,
          status: "CONFIRMED",
          confirmedAt: new Date(),
          items: { create: itemCreates },
        },
        select: orderDetailSelect,
      });

      if (input.tableId) await syncTableAssignment(tx, order.id, null, input.tableId);

      // Deduct stock for all items
      const businessDate = businessDateFor();
      await stockRepository.ensureResetRowsForDate(businessDate, tx);
      const menuMap = await batchAssertSellable(input.items, tx);
      for (const item of input.items) {
        const menu = menuMap.get(item.menuItemId);
        if (menu) {
          const { trackStock } = getSellablePrice(menu, item.variantId);
          if (trackStock) {
            await stockService.deductForOrderItem(
              businessDate,
              item.menuItemId,
              item.variantId ?? null,
              item.quantity,
              tx,
            );
          }
        }
      }

      // Split the confirmed order into per-station kitchen tickets, then build
      // the printer routing payload for exactly the lines that were fired.
      const tickets = await kotService.generateForOrder(order.id, tx);
      const kitchenPrinterJobs = await buildKitchenPrinterJobs(
        order.id,
        tx,
        tickets.flatMap((t: { items: Array<{ orderItemId: string }> }) => t.items.map((i) => i.orderItemId)),
      );

      if (input.createDraftBill && input.items.length > 0) {
        await billingService.generate(
          { orderId: order.id },
          actorId,
          tx
        );
      }

      const confirmed = await orderRepository.findById(order.id, tx);
      const formattedOrder = { ...formatOrder(confirmed), kitchenPrinterJobs };
      publishEvent(websocketEvents.orderUpdated, formattedOrder);
      return formattedOrder;
    });
  },

  // Assign or move an order to a table. Releases the old table (if any) and
  // occupies the new one atomically. Used by the table-side assignment flow.
  assignTable: async (
    orderId: string,
    tableId: string,
    actorId: string,
  ) => {
    const companyId = getCompanyId();
    if (!companyId) throw badRequest("Missing tenant context");
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const current = await orderRepository.findByIdInternal(orderId, tx);
      if (!current) throw notFound("Order");
      if (current.status === "CANCELLED" || current.status === "VOIDED")
        throw conflict("Cancelled or voided orders cannot be edited");

      await assertTableSeatable(tx, tableId, orderId);

      await tx.order.update({
        where: { id: orderId },
        data: { channel: "DINE_IN", tableId },
      });

      await syncTableAssignment(tx, orderId, current.tableId, tableId);

      const order = await orderRepository.findById(orderId, tx);
      const formattedOrder = formatOrder(order);
      publishEvent(websocketEvents.orderUpdated, formattedOrder);
      return formattedOrder;
    });
  },

  // Orders stay editable right up until money moves: CONFIRMED orders
  // can be changed, but once their bill carries any payment the order is frozen.
  // Editing a CONFIRMED order re-syncs the kitchen tickets and daily stock that
  // confirmation produced, and refreshes any still-unpaid bill's totals.
  update: async (
    id: string,
    input: z.infer<typeof updateOrderSchema>,
    actorId: string,
  ) => {
    const companyId = getCompanyId();
    if (!companyId) throw badRequest("Missing tenant context");
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const current = await orderRepository.findByIdInternal(id, tx);
      if (!current) throw notFound("Order");
      if (current.status === "CANCELLED" || current.status === "VOIDED")
        throw conflict("Cancelled or voided orders cannot be edited");
      if (current.bill && billIsLocked(current.bill))
        throw conflict("Order cannot be edited after payment");

      const businessDate = businessDateFor();
      // Order-item ids fired to the kitchen during THIS patch (incremented lines
      // and new add-on lines). Drives the printer routing payload in the response.
      const firedOrderItemIds: string[] = [];

      // Items in the PATCH body are ADD-ONS to the existing order, never a
      // whole-order replacement. An item already on the order increments that
      // line's quantity; anything else becomes a new line. Either way the added
      // units are fired to the kitchen as an add-on. Existing lines absent from
      // the body are left exactly as they are — a PATCH never cancels food.
      await stockRepository.ensureResetRowsForDate(businessDate, tx);

      const activeExisting = current.items.filter(
        (row) => row.status !== "CANCELLED" && row.status !== "VOIDED",
      );
      const { increments, additions } = planAdditive(activeExisting, input.items);

      // Increment an already-present line and fire only the added units.
      for (const { existing, addQuantity } of increments) {
        await updateOrderItemQuantity(tx, existing, existing.quantity + addQuantity);
        const tracksStock = existing.variantId
          ? existing.variant?.trackStock ?? existing.menuItem.trackStock
          : existing.menuItem.trackStock;
        if (tracksStock) {
          await stockService.deductForOrderItem(
            businessDate, existing.menuItemId, existing.variantId, addQuantity, tx,
          );
        }
        const bumpTickets = await kotService.generateForOrder(id, tx, {
          orderItemIds: [existing.id],
          isAddon: true,
          allowDuplicates: true,
          quantities: new Map([[existing.id, addQuantity]]),
        });
        firedOrderItemIds.push(
          ...bumpTickets.flatMap((t: { items: Array<{ orderItemId: string }> }) => t.items.map((i) => i.orderItemId))
        );
      }

      // Create brand-new lines and fire them as add-ons.
      const createdItems = await createOrderItemsForInputs(tx, id, additions);
      if (createdItems.length > 0) {
        const menuMap = await batchAssertSellable(additions, tx);
        for (const item of additions) {
          const menu = menuMap.get(item.menuItemId);
          if (menu) {
            const { trackStock } = getSellablePrice(menu, item.variantId);
            if (trackStock) {
              await stockService.deductForOrderItem(
                businessDate,
                item.menuItemId,
                item.variantId ?? null,
                item.quantity,
                tx,
              );
            }
          }
        }
        const addonTickets = await kotService.generateForOrder(id, tx, {
          orderItemIds: createdItems.map((item) => item.id),
          isAddon: true
        });
        firedOrderItemIds.push(
          ...addonTickets.flatMap((t: { items: Array<{ orderItemId: string }> }) => t.items.map((i) => i.orderItemId))
        );
      }

      // Recompute totals from the order's final active item set (the untouched
      // existing lines plus anything added above) and persist them.
      const itemsForTotals = await tx.orderItem.findMany({
        where: { orderId: id, status: { notIn: ["CANCELLED", "VOIDED"] } },
        select: { lineSubtotal: true },
      });
      const totals = calculateTotals(
        itemsForTotals.map((i) => ({ lineSubtotal: D(i.lineSubtotal as any ?? 0) })),
        D(current.discountAmount),
        D(current.discountPercentage),
      );
      await tx.order.update({ where: { id }, data: { ...totals } });

      // Keep an unpaid bill's monetary fields aligned with the edited order so
      // a stale total can't be paid against. Its own discount is preserved
      // (clamped if the order shrank below it).
      if (current.bill) {
        const bd = D(current.bill.discountAmount);
        const billDiscountAmount = bd.lt(totals.subtotal) ? bd : totals.subtotal;
        const billTotals = calculateBillTotals(totals.subtotal, billDiscountAmount, D(current.bill.discountPercentage));
        await tx.bill.update({
          where: { id: current.bill.id },
          data: billTotals,
        });
      }

      const order = await orderRepository.findById(id, tx);

      await auditRepository.create(
        {
          actorId,
          action: "ORDER_EDITED",
          entity: "Order",
          entityId: id,
          before: { id: current.id, status: current.status },
          after: { id: order!.id, status: order!.status },
        },
        tx,
      );

      const kitchenPrinterJobs = await buildKitchenPrinterJobs(id, tx, firedOrderItemIds);
      const formattedOrder = { ...formatOrder(order), kitchenPrinterJobs };
      publishEvent(websocketEvents.orderUpdated, formattedOrder);
      return formattedOrder;
    });
  },



  cancel: async (
    id: string,
    input: { reason?: string },
    actorId: string,
  ) =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const order = await orderRepository.findByIdInternal(id, tx);
      if (!order) throw notFound("Order");
      if (order.status !== "CONFIRMED")
        throw conflict("Order cannot be cancelled");
      // Settle the bill before closing the order so money isn't stranded and no
      // payment can attach to the cancelled order afterwards.
      if (order.bill) await settleBillForClosedOrder(tx, order.bill, "cancelling");

      await tx.order.update({
        where: { id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      await tx.orderItem.updateMany({
        where: { orderId: id, status: { notIn: ["CANCELLED", "VOIDED"] } },
        data: { status: "CANCELLED" },
      });
      const cancelledKots = await kotRepository.cancelForOrders([id], tx);
      for (const ticket of cancelledKots) {
        const fullTicket = await kotRepository.findById(ticket.id, tx);
        if (fullTicket) {
          publishEvent(websocketEvents.kotUpdated, fullTicket, "kitchen");
        }
      }

      // Return the stock this (confirmed) order had deducted at confirmation.
      await restoreOrderStock(tx, order.items, businessDateFor());

      // Auto-release associated tables and dissolve groups
      if (order.tableId) {
        const tablesToRelease = await tx.diningTable.findMany({
          where: { activeOrderId: id }
        });
        if (tablesToRelease.length > 0) {
          await tx.diningTable.updateMany({
            where: { activeOrderId: id },
            data: { status: "AVAILABLE", activeOrderId: null }
          });
          const activeGroup = await tx.tableGroup.findFirst({
            where: { orderId: id, isActive: true }
          });
          if (activeGroup) {
            await tx.tableGroupMember.updateMany({
              where: { tableGroupId: activeGroup.id, releasedAt: null },
              data: { releasedAt: new Date() }
            });
            await tx.tableGroup.update({
              where: { id: activeGroup.id },
              data: { isActive: false }
            });
          }
          for (const t of tablesToRelease) {
            publishEvent(
              websocketEvents.tableUpdated,
              { id: t.id, status: "AVAILABLE", activeOrderId: null },
              "floor"
            );
          }
        }
      }

      const updated = await orderRepository.findById(id, tx);

      await auditRepository.create(
        {
          actorId,
          action: "ORDER_CANCELLED",
          entity: "Order",
          entityId: id,
          before: { id: order.id, status: order.status },
          after: { id: updated!.id, status: updated!.status },
          reason: input.reason,
        },
        tx,
      );

      publishEvent(websocketEvents.orderUpdated, updated);
      return formatOrder(updated);
    }),

  void: async (
    id: string,
    input: { reason?: string },
    actorId: string,
  ) =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const order = await orderRepository.findByIdInternal(id, tx);
      if (!order) throw notFound("Order");
      if (order.status === "CANCELLED" || order.status === "VOIDED")
        throw conflict("Order is already cancelled or voided");
      // Settle the bill before closing the order: refuse if money is held,
      // otherwise void an open bill so no payment can attach post-void.
      if (order.bill) await settleBillForClosedOrder(tx, order.bill, "voiding");

      await tx.order.update({
        where: { id },
        data: { status: "VOIDED", voidedAt: new Date() },
      });
      await tx.orderItem.updateMany({
        where: { orderId: id, status: { notIn: ["CANCELLED", "VOIDED"] } },
        data: { status: "VOIDED" },
      });
      const cancelledKots = await kotRepository.cancelForOrders([id], tx);
      for (const ticket of cancelledKots) {
        const fullTicket = await kotRepository.findById(ticket.id, tx);
        if (fullTicket) {
          publishEvent(websocketEvents.kotUpdated, fullTicket, "kitchen");
        }
      }

      // Return stock only for a still-unserved (CONFIRMED) order. A COMPLETED
      // order's items were served, so their deduction must stand.
      if (order.status === "CONFIRMED") {
        await restoreOrderStock(tx, order.items, businessDateFor());
      }

      // Auto-release associated tables and dissolve groups
      if (order.tableId) {
        const tablesToRelease = await tx.diningTable.findMany({
          where: { activeOrderId: id }
        });
        if (tablesToRelease.length > 0) {
          await tx.diningTable.updateMany({
            where: { activeOrderId: id },
            data: { status: "AVAILABLE", activeOrderId: null }
          });
          const activeGroup = await tx.tableGroup.findFirst({
            where: { orderId: id, isActive: true }
          });
          if (activeGroup) {
            await tx.tableGroupMember.updateMany({
              where: { tableGroupId: activeGroup.id, releasedAt: null },
              data: { releasedAt: new Date() }
            });
            await tx.tableGroup.update({
              where: { id: activeGroup.id },
              data: { isActive: false }
            });
          }
          for (const t of tablesToRelease) {
            publishEvent(
              websocketEvents.tableUpdated,
              { id: t.id, status: "AVAILABLE", activeOrderId: null },
              "floor"
            );
          }
        }
      }

      const updated = await orderRepository.findById(id, tx);

      await auditRepository.create(
        {
          actorId,
          action: "ORDER_VOIDED",
          entity: "Order",
          entityId: id,
          before: { id: order.id, status: order.status },
          after: { id: updated!.id, status: updated!.status },
          reason: input.reason,
        },
        tx,
      );

      publishEvent(websocketEvents.orderUpdated, updated);
      return formatOrder(updated);
    }),
};
