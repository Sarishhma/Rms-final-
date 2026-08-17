import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { getPagination, type PaginationInput } from "../../utils/pagination.js";

// ── Internal include — used ONLY inside service-layer transactions that need
// full related objects for business-logic checks (e.g. bill.paid, trackStock).
// NEVER return this shape directly to the client.
export const _orderInternalInclude = {
  table: { select: { id: true, name: true, status: true } },
  customer: { select: { id: true, name: true, phone: true } },
  createdBy: { select: { id: true, name: true, role: true } },
  items: {
    include: {
      menuItem: { select: { id: true, name: true, trackStock: true, basePrice: true } },
      variant: { select: { id: true, name: true, trackStock: true, price: true } },
      addons: { select: { id: true, addonId: true, quantity: true, unitPrice: true, total: true } },
    },
  },
  bill: { select: { id: true, status: true, paid: true, refunded: true, due: true, grandTotal: true, discountAmount: true, discountPercentage: true, subtotal: true } },
} satisfies Prisma.OrderInclude;

// Trimmed payload for list endpoints. Drops item lines, addons, KOT items,
// payment/refund rows — these belong to the detail view. Keeps bill.status so
// the paymentStatus formatter can derive a value.
const orderListSelect = {
  id: true,
  orderNumber: true,
  mergedIntoOrderId: true,
  channel: true,
  status: true,
  guestCount: true,
  subtotal: true,
  discountAmount: true,
  discountPercentage: true,
  grandTotal: true,
  confirmedAt: true,
  completedAt: true,
  cancelledAt: true,
  voidedAt: true,
  createdAt: true,
  updatedAt: true,
  table: { select: { id: true, name: true } },
  customer: { select: { id: true, name: true, phone: true } },
  createdBy: { select: { id: true, name: true } },
  _count: { select: { items: true, kotTickets: true } },
    // ORDER ITEMS
  items: {
    select: {
      id: true,
      quantity: true,
      unitPrice: true,
      addonTotal: true,
      lineSubtotal: true,
      specialInstructions: true,
      courseName: true,
      fireAt: true,
      status: true,
      createdAt: true,

      menuItem: {
        select: {
          id: true,
          name: true,
          type: true,
          basePrice: true,
        },
      },

      variant: {
        select: {
          id: true,
          name: true,
          price: true,
        },
      },

      addons: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          total: true,
          addon: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      },

      kotItems: {
        select: {
          id: true,
          quantity: true,
          status: true,
          kotTicket: {
            select: {
              id: true,
              kotNumber: true,
              status: true,
              station: { select: { id: true, name: true } },
              stationId: true,
              isAddon: true,
            },
          },
        },
      },
    },
  },
  bill: {
    select: {
      id: true,
      billNumber: true,
      status: true,
      grandTotal: true,
      paid: true,
      refunded: true,
      due: true,
    },
  },
} satisfies Prisma.OrderSelect;

// Detail payload for GET /orders/:id and mutation responses.
// Pulls only the fields the frontend needs — no full related objects.
export const orderDetailSelect = {
  id: true,
  orderNumber: true,
  mergedIntoOrderId: true,
  channel: true,
  status: true,
  guestCount: true,
  specialInstructions: true,

  subtotal: true,
  discountAmount: true,
  discountPercentage: true,
  grandTotal: true,

  confirmedAt: true,
  completedAt: true,
  cancelledAt: true,
  voidedAt: true,

  createdAt: true,
  updatedAt: true,

  // TABLE
  table: {
    select: {
      id: true,
      name: true,
      capacity: true,
      status: true,
      floor: true,
    },
  },

  // CUSTOMER
  customer: {
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
    },
  },

  // CREATED BY
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },

  // ORDER ITEMS
  items: {
    select: {
      id: true,
      quantity: true,
      unitPrice: true,
      addonTotal: true,
      lineSubtotal: true,
      specialInstructions: true,
      courseName: true,
      fireAt: true,
      status: true,
      createdAt: true,

      menuItem: {
        select: {
          id: true,
          name: true,
          type: true,
          basePrice: true,
        },
      },

      variant: {
        select: {
          id: true,
          name: true,
          price: true,
        },
      },

      addons: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          total: true,
          addon: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      },

      kotItems: {
        select: {
          id: true,
          quantity: true,
          status: true,
          kotTicket: {
            select: {
              id: true,
              kotNumber: true,
              status: true,
              station: { select: { id: true, name: true } },
              stationId: true,
              isAddon: true,
            },
          },
        },
      },
    },
  },

  // KOT TICKETS
  kotTickets: {
    select: {
      id: true,
      kotNumber: true,
      status: true,
      station: { select: { id: true, name: true } },
      stationId: true,
      isAddon: true,
      firedAt: true,
      targetReadyAt: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  },

  // BILL
  bill: {
    select: {
      id: true,
      billNumber: true,
      subtotal: true,
      discountAmount: true,
      discountPercentage: true,
      grandTotal: true,
      paid: true,
      refunded: true,
      due: true,
      status: true,
      generationCount: true,
      createdAt: true,

      payments: {
        select: {
          id: true,
          amount: true,
          method: true,
          status: true,
          reference: true,
          createdAt: true,
          receivedBy: {
            select: { id: true, name: true },
          },
        },
      },

      splits: {
        select: {
          id: true,
          label: true,
          amount: true,
        },
      },
    },
  },

  _count: {
    select: {
      items: true,
      kotTickets: true,
    },
  },
} satisfies Prisma.OrderSelect;

export const orderRepository = {
  list: (
    input: PaginationInput & {
      status?: string;
      tableId?: string;
      tableName?: string;
      channel?: string;
      customerId?: string;
    },
  ) => {
    // Paid, cancelled, or voided orders are restricted to the last 24 hours.
    // Active/unpaid orders (no bill, or OPEN bill) are shown for all time.
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const where: Prisma.OrderWhereInput = {
      OR: [
        { createdAt: { gte: last24h } },
        {
          status: { notIn: ["CANCELLED", "VOIDED"] },
          OR: [
            { bill: null },
            { bill: { status: "OPEN" } }
          ]
        }
      ],
      ...(input.status ? { status: input.status as Prisma.EnumOrderStatusFilter } : {}),
      ...(input.tableId ? { tableId: input.tableId } : {}),
      ...(input.tableName ? { table: { name: { contains: input.tableName, mode: 'insensitive' } } } : {}),
      ...(input.channel ? { channel: input.channel as Prisma.EnumOrderChannelFilter } : {}),
      ...(input.customerId ? { customerId: input.customerId } : {}),
    };

    return prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        ...getPagination(input),
        select: orderListSelect,
        orderBy: { createdAt: "desc" },
      }),
    ]);
  },

  // Detail view — returns the trimmed select shape for API responses.
  findById: (id: string, tx: Prisma.TransactionClient = prisma) =>
    tx.order.findFirst({ where: { id }, select: orderDetailSelect }),

  // Internal fetch — returns the include shape for service-layer business logic.
  findByIdInternal: (id: string, tx: Prisma.TransactionClient = prisma) =>
    tx.order.findFirst({ where: { id }, include: _orderInternalInclude }),

  create: (data: Prisma.OrderUncheckedCreateInput, tx: Prisma.TransactionClient = prisma) =>
    tx.order.create({ data, select: orderDetailSelect }),

  update: (id: string, data: Prisma.OrderUpdateInput, tx: Prisma.TransactionClient = prisma) =>
    tx.order.update({ where: { id }, data, select: orderDetailSelect }),

  deleteItems: async (orderId: string, tx: Prisma.TransactionClient) => {
    await tx.orderItemAddon.deleteMany({ where: { orderItem: { orderId } } });
    return tx.orderItem.deleteMany({ where: { orderId } });
  },
};
