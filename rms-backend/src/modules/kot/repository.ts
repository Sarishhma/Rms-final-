import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { getPagination, type PaginationInput } from "../../utils/pagination.js";

/** Full select – used for single-item detail endpoints. */
export const kotDetailSelect = {
  id: true,
  kotNumber: true,
  orderId: true,
  status: true,
  station: { select: { id: true, name: true } },
  stationId: true,
  isAddon: true,
  firedAt: true,
  targetReadyAt: true,
  createdAt: true,
  updatedAt: true,
  order: {
    select: {
      id: true,
      orderNumber: true,
      channel: true,
      status: true,
      tableId: true,
      table: { select: { id: true, name: true } },
    },
  },
  items: {
    select: {
      id: true,
      quantity: true,
      status: true,
      itemName: true,
      variantName: true,
      courseName: true,
      specialInstructions: true,
      modifiers: true,
      targetPrepMinutes: true,
      targetReadyAt: true,
      orderItem: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          specialInstructions: true,
          status: true,
          menuItem: { select: { id: true, name: true, type: true } },
          variant: { select: { id: true, name: true } },
          addons: {
            select: {
              quantity: true,
              addon: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.KotTicketSelect;

/** Slim select – used for list endpoints to keep payloads small. */
const kotListSelect = {
  id: true,
  kotNumber: true,
  orderId: true,
  status: true,
  station: { select: { id: true, name: true } },
  stationId: true,
  isAddon: true,
  firedAt: true,
  targetReadyAt: true,
  createdAt: true,
  updatedAt: true,
  order: { select: { id: true, orderNumber: true, tableId: true, table: { select: { id: true, name: true } } } },
  _count: { select: { items: true } }
} satisfies Prisma.KotTicketSelect;

const deriveTicketStatus = (statuses: string[]): Prisma.KotTicketUpdateInput["status"] => {
  if (statuses.length === 0) return "CANCELLED";
  if (statuses.every((status) => status === "CANCELLED")) return "CANCELLED";
  if (statuses.every((status) => status === "SERVED")) return "SERVED";
  if (statuses.every((status) => status === "READY" || status === "SERVED" || status === "CANCELLED")) return "READY";
  if (statuses.some((status) => status === "PREPARING" || status === "READY" || status === "SERVED")) return "PREPARING";
  return "PENDING";
};

const syncTicketStatusFromItems = async (ticketId: string, tx: Prisma.TransactionClient = prisma) => {
  const items = await tx.kotItem.findMany({
    where: { kotTicketId: ticketId },
    select: { status: true }
  });
  return tx.kotTicket.update({
    where: { id: ticketId },
    data: { status: deriveTicketStatus(items.map((item) => item.status)) },
    select: kotDetailSelect
  });
};

export const kotRepository = {
  list: (input: PaginationInput & { status?: string; stationId?: string; stationIds?: string[] }) => {
    const where: Prisma.KotTicketWhereInput = {
      ...(input.status ? { status: input.status as Prisma.EnumKotStatusFilter } : {}),
      ...(input.stationId ? { stationId: input.stationId } : {}),
      ...(input.stationIds ? { stationId: { in: input.stationIds } } : {})
    };

    return prisma.$transaction([
      prisma.kotTicket.count({ where }),
      prisma.kotTicket.findMany({
        where,
        ...getPagination(input),
        select: kotListSelect,
        orderBy: { createdAt: "desc" }
      })
    ]);
  },

  findById: (id: string, tx: Prisma.TransactionClient = prisma) => tx.kotTicket.findFirst({ where: { id }, select: kotDetailSelect }),

  findByOrderId: (orderId: string, tx: Prisma.TransactionClient = prisma) =>
    tx.kotTicket.findMany({
      where: { orderId },
      select: kotDetailSelect,
      orderBy: { createdAt: "asc" }
    }),

  findItemById: (id: string, tx: Prisma.TransactionClient = prisma) =>
    tx.kotItem.findFirst({
      where: { id },
      select: {
        id: true,
        kotTicketId: true,
        orderItemId: true,
        status: true,
        kotTicket: { select: { id: true } }
      }
    }),

  updateStatus: (id: string, status: Prisma.KotTicketUpdateInput["status"], tx: Prisma.TransactionClient = prisma) =>
    tx.kotTicket.update({ where: { id }, data: { status, items: { updateMany: { where: {}, data: { status } } } }, select: kotDetailSelect }),

  updateItemStatus: async (id: string, status: Prisma.KotItemUpdateInput["status"], tx: Prisma.TransactionClient = prisma) => {
    const item = await tx.kotItem.update({
      where: { id },
      data: { status },
      select: { id: true, kotTicketId: true }
    });
    return syncTicketStatusFromItems(item.kotTicketId, tx);
  },

  // Removes every KOT (and its items) for an order. Kept for administrative or
  // non-history-preserving workflows; normal confirmed-order edits now use
  // add-on/cancellation KOTs so kitchen progress survives.
  deleteForOrder: async (orderId: string, tx: Prisma.TransactionClient) => {
    await tx.kotItem.deleteMany({ where: { kotTicket: { orderId } } });
    return tx.kotTicket.deleteMany({ where: { orderId } });
  },

  // Cancels every still-active KOT (and its items) for the given orders. Used
  // when those orders are absorbed into a merged order (table combine) so the
  // kitchen sees the items only once — on the merged order's fresh ticket —
  // instead of on both the old tickets and the new one. Tickets are kept (set
  // to CANCELLED) rather than deleted so the kitchen history survives. Returns
  // the cancelled tickets so the caller can push realtime updates.
  cancelForOrders: async (orderIds: string[], tx: Prisma.TransactionClient) => {
    if (orderIds.length === 0) return [] as Array<{ id: string; orderId: string }>;
    const tickets = await tx.kotTicket.findMany({
      where: { orderId: { in: orderIds }, status: { not: "CANCELLED" } },
      select: { id: true, orderId: true },
    });
    if (tickets.length === 0) return tickets;
    const ticketIds = tickets.map((t) => t.id);
    await tx.kotItem.updateMany({ where: { kotTicketId: { in: ticketIds } }, data: { status: "CANCELLED" } });
    await tx.kotTicket.updateMany({ where: { id: { in: ticketIds } }, data: { status: "CANCELLED" } });
    return tickets;
  },

  cancelOrderItems: async (orderItemIds: string[], tx: Prisma.TransactionClient) => {
    if (orderItemIds.length === 0) return [];
    const ticketIds = await tx.kotItem.findMany({
      where: { orderItemId: { in: orderItemIds } },
      distinct: ["kotTicketId"],
      select: { kotTicketId: true }
    });
    await tx.kotItem.updateMany({
      where: { orderItemId: { in: orderItemIds } },
      data: { status: "CANCELLED" }
    });
    const tickets = [];
    for (const { kotTicketId } of ticketIds) {
      tickets.push(await syncTicketStatusFromItems(kotTicketId, tx));
    }
    return tickets;
  }
};
