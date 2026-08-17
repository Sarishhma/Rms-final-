import { Prisma, TableStatus } from "@prisma/client";
import { prisma } from "../../prisma/client.js";

import { tableResponseSelect } from "./response.js";

const activeWhere = { isDeleted: false };

// Reusable include shape for group queries
const groupInclude = {
  members: {
    include: {
      table: { select: { id: true, name: true, capacity: true, floor: true, status: true } },
    },
  },
  combinedBy: { select: { id: true, name: true, email: true } },
  order: { select: { id: true, orderNumber: true, status: true, tableId: true } },
} satisfies Prisma.TableGroupInclude;

export const tableRepository = {
  // ─── Core CRUD ──────────────────────────────────────────────────────────────

  list: (input: { status?: TableStatus; floor?: string }) => {
    const where: Prisma.DiningTableWhereInput = {
      ...activeWhere,
      ...(input.status ? { status: input.status } : {}),
      ...(input.floor  ? { floor: { equals: input.floor, mode: "insensitive" } } : {}),
    };
    return prisma.diningTable.findMany({
      where,
      select: tableResponseSelect,
      orderBy: [{ floor: "asc" }, { name: "asc" }],
    });
  },

  /** All distinct floor/section labels across active tables (for the filter UI). */
  distinctFloors: async (): Promise<string[]> => {
    const rows = await prisma.diningTable.findMany({
      where: { isDeleted: false, floor: { not: null } },
      select: { floor: true },
      distinct: ["floor"],
      orderBy: { floor: "asc" },
    });
    return rows.map((r) => r.floor as string);
  },

  findById: (id: string, tx: Prisma.TransactionClient = prisma) =>
    tx.diningTable.findFirst({ where: { id, isDeleted: false }, select: tableResponseSelect }),

  findByIdInternal: (id: string, tx: Prisma.TransactionClient = prisma) =>
    tx.diningTable.findFirst({ where: { id, isDeleted: false } }),

  create: (data: Prisma.DiningTableCreateInput, tx: Prisma.TransactionClient = prisma) => tx.diningTable.create({ data, select: tableResponseSelect }),

  update: (id: string, data: Prisma.DiningTableUpdateInput, tx: Prisma.TransactionClient = prisma) =>
    tx.diningTable.update({ where: { id }, data, select: tableResponseSelect }),

  softDelete: (id: string) =>
    prisma.diningTable.update({ where: { id }, data: { isDeleted: true, status: "MAINTENANCE", name:{set:`_deleted_${Date.now()}_${id}`} }, select: { id: true } }),

  hardDelete: (id: string) => prisma.diningTable.delete({ where: { id }, select: { id: true } }),

  hasRelatedRecords: async (id: string) => {
    const table = await prisma.diningTable.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
            tableGroupMembers: true,
            splitFromTables: true,
            splitToTables: true,
          },
        },
      },
    });
    if (!table) return false;
    return (
      table._count.orders > 0 ||
      table._count.tableGroupMembers > 0 ||
      table._count.splitFromTables > 0 ||
      table._count.splitToTables > 0
    );
  },

  occupiedTables: () =>
    prisma.diningTable.findMany({
      where: { isDeleted: false, status: "OCCUPIED" },
      select: {
        ...tableResponseSelect,
        activeOrder: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            grandTotal: true,
            createdAt: true,
          },
        },
      },
      orderBy: { name: "asc" }
    }),

  // ─── Shared helpers ─────────────────────────────────────────────────────────

  validateTargetTableAvailable: async (
    companyId: string,
    tableId: string,
    tx: Prisma.TransactionClient = prisma
  ) => {
    const table = await tx.diningTable.findUnique({
      where: { id: tableId },
      select: { companyId: true, status: true, isDeleted: true, activeOrderId: true },
    });
    if (!table || table.isDeleted) return false;
    if (table.companyId !== companyId) return false;
    if (table.status === "MAINTENANCE") return false;
    if (table.activeOrderId !== null) return false;
    return true;
  },

  getTableWithActiveOrder: (tableId: string, tx: Prisma.TransactionClient = prisma) =>
    tx.diningTable.findFirst({
      where: { id: tableId, isDeleted: false },
      include: {
        activeOrder: { select: { id: true, orderNumber: true, guestCount: true, status: true } },
      },
    }),

  getOrderWithtable: (orderId: string, tx: Prisma.TransactionClient = prisma) =>
    tx.order.findFirst({
      where: { id: orderId },
      select: { id: true, orderNumber: true, tableId: true, status: true, guestCount: true, channel: true },
    }),

  updateOrderTable: (orderId: string, newTableId: string, tx: Prisma.TransactionClient = prisma) =>
    tx.order.update({
      where: { id: orderId },
      data: { tableId: newTableId },
      select: { id: true, orderNumber: true, tableId: true },
    }),

  releaseSourceTable: (tableId: string, tx: Prisma.TransactionClient = prisma) =>
    tx.diningTable.update({
      where: { id: tableId },
      data: { status: "AVAILABLE", activeOrderId: null },
      select: { id: true, name: true, status: true },
    }),

  occupyTargetTable: (tableId: string, orderId: string, tx: Prisma.TransactionClient = prisma) =>
    tx.diningTable.update({
      where: { id: tableId },
      data: { status: "OCCUPIED", activeOrderId: orderId },
      select: { id: true, name: true, status: true },
    }),

  /** Mark a table as OCCUPIED without setting activeOrderId (used for combine
   *  secondary tables — the TableGroup record tracks the relationship instead,
   *  avoiding the @unique constraint on activeOrderId). */
  markOccupied: (tableId: string, tx: Prisma.TransactionClient = prisma) =>
    tx.diningTable.update({
      where: { id: tableId },
      data: { status: "OCCUPIED" },
      select: { id: true, name: true, status: true },
    }),

  // ─── Combine ─────────────────────────────────────────────────────────────────

  createGroup: (
    data: {
      orderId: string;
      combinedById: string;
      reason?: string;
      tableIds: string[];
    },
    tx: Prisma.TransactionClient = prisma
  ) =>
    tx.tableGroup.create({
      data: {
        orderId: data.orderId,
        combinedById: data.combinedById,
        reason: data.reason,
        members: {
          create: data.tableIds.map((tableId) => ({ tableId })),
        },
      },
      include: groupInclude,
    }),

  findActiveGroupForTable: (tableId: string, tx: Prisma.TransactionClient = prisma) =>
    tx.tableGroupMember.findFirst({
      where: {
        tableId,
        releasedAt: null,
        tableGroup: { isActive: true },
      },
      include: { tableGroup: { select: { id: true, orderId: true } } },
    }),

  findGroupById: (groupId: string, tx: Prisma.TransactionClient = prisma) =>
    tx.tableGroup.findFirst({
      where: { id: groupId },
      include: groupInclude,
    }),

  dissolveGroup: async (groupId: string, tx: Prisma.TransactionClient = prisma) => {
    await tx.tableGroupMember.updateMany({
      where: { tableGroupId: groupId, releasedAt: null },
      data: { releasedAt: new Date() },
    });
    return tx.tableGroup.update({
      where: { id: groupId },
      data: { isActive: false },
      include: groupInclude,
    });
  },

  // ─── Split ──────────────────────────────────────────────────────────────────

  getOrderItemsForSplit: (
    orderItemIds: string[],
    orderId: string,
    tx: Prisma.TransactionClient = prisma
  ) =>
    tx.orderItem.findMany({
      where: { id: { in: orderItemIds }, orderId },
      include: {
        addons: { include: { addon: true } },
        menuItem: { select: { id: true, name: true, trackStock: true } },
        variant: { select: { id: true, name: true, trackStock: true } },
      },
    }),

  decrementOrderItemQty: (
    orderItemId: string,
    newQuantity: number,
    newLineSubtotal: Prisma.Decimal,
    tx: Prisma.TransactionClient = prisma
  ) =>
    tx.orderItem.update({
      where: { id: orderItemId },
      data: { quantity: newQuantity, lineSubtotal: newLineSubtotal },
    }),

  deleteOrderItemFull: async (orderItemId: string, tx: Prisma.TransactionClient = prisma) => {
    await tx.orderItemAddon.deleteMany({ where: { orderItemId } });
    await tx.kotItem.deleteMany({ where: { orderItemId } });
    await tx.orderItem.delete({ where: { id: orderItemId } });
  },

  createSplitOrder: (
    data: {
      orderNumber: string;
      channel: string;
      tableId: string;
      createdById: string;
      guestCount?: number;
      items: Prisma.OrderItemCreateWithoutOrderInput[];
      totals: { subtotal: Prisma.Decimal; discountAmount: Prisma.Decimal; discountPercentage: Prisma.Decimal; grandTotal: Prisma.Decimal };
    },
    tx: Prisma.TransactionClient = prisma
  ) =>
    tx.order.create({
      data: {
        orderNumber: data.orderNumber,
        channel: data.channel as any,
        tableId: data.tableId,
        createdById: data.createdById,
        guestCount: data.guestCount,
        status: "CONFIRMED",
        confirmedAt: new Date(),
        subtotal: data.totals.subtotal,
        discountAmount: data.totals.discountAmount,
        discountPercentage: data.totals.discountPercentage,
        grandTotal: data.totals.grandTotal,
        items: { create: data.items },
      },
      select: { id: true, orderNumber: true, tableId: true, status: true, grandTotal: true, subtotal: true },
    }),

  createSplitRecord: (
    data: {
      companyId: string;
      sourceOrderId: string;
      newOrderId: string;
      fromTableId: string;
      toTableId: string;
      splitById: string;
    },
    tx: Prisma.TransactionClient = prisma
  ) =>
    tx.tableSplit.create({
      data: {
        companyId: data.companyId,
        sourceOrderId: data.sourceOrderId,
        newOrderId: data.newOrderId,
        fromTableId: data.fromTableId,
        toTableId: data.toTableId,
        splitById: data.splitById,
      },
      select: {
        id: true,
        sourceOrderId: true,
        newOrderId: true,
        fromTableId: true,
        toTableId: true,
        splitById: true,
        createdAt: true,
      },
    }),

  // ─── Combine / Merge ────────────────────────────────────────────────────────

  /** Fetch an order with full items + addons for cloning into a merged order. */
  getOrderWithItemsForMerge: (orderId: string, tx: Prisma.TransactionClient = prisma) =>
    tx.order.findFirst({
      where: { id: orderId },
      include: {
        items: {
          where: { status: "PENDING" },
          include: {
            addons: true,
            menuItem: { select: { id: true, name: true } },
            variant: { select: { id: true, name: true } },
          },
        },
        bill: { select: { id: true, status: true, paid: true } },
      },
    }),

  /** Create the new merged order with all cloned items. */
  createMergedOrder: (
    data: {
      orderNumber: string;
      tableId: string;
      createdById: string;
      guestCount?: number;
      items: Prisma.OrderItemCreateWithoutOrderInput[];
      totals: { subtotal: Prisma.Decimal; discountAmount: Prisma.Decimal; discountPercentage: Prisma.Decimal; grandTotal: Prisma.Decimal };
      status: "CONFIRMED";
    },
    tx: Prisma.TransactionClient = prisma
  ) =>
    tx.order.create({
      data: {
        orderNumber: data.orderNumber,
        channel: "DINE_IN",
        tableId: data.tableId,
        createdById: data.createdById,
        guestCount: data.guestCount,
        status: data.status,
        ...(data.status === "CONFIRMED" ? { confirmedAt: new Date() } : {}),
        subtotal: data.totals.subtotal,
        discountAmount: data.totals.discountAmount,
        discountPercentage: data.totals.discountPercentage,
        grandTotal: data.totals.grandTotal,
        items: { create: data.items },
      },
      select: {
        id: true,
        orderNumber: true,
        tableId: true,
        status: true,
        grandTotal: true,
        subtotal: true,
        guestCount: true,
        items: { select: { id: true } },
      },
    }),

  /** Batch-update old orders as COMPLETED + link to merged order. */
  markOrdersMerged: (
    orderIds: string[],
    mergedIntoOrderId: string,
    tx: Prisma.TransactionClient = prisma
  ) =>
    tx.order.updateMany({
      where: { id: { in: orderIds } },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        mergedIntoOrderId,
      },
    }),
};
