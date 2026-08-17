import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { getPagination, type PaginationInput } from "../../utils/pagination.js";

// Detail payload returned for a single bill (GET /bills/:id and create/update
// responses). Uses targeted selects instead of full includes.
export const billDetailSelect = {
  id: true,
  billNumber: true,
  orderId: true,
  subtotal: true,
  discountAmount: true,
  discountPercentage: true,
  grandTotal: true,
  paid: true,
  refunded: true,
  due: true,
  status: true,
  generationCount: true,
  taxJurisdiction: true,
  taxRegistrationNumber: true,
  businessName: true,
  businessAddress: true,
  invoiceFooter: true,
  currency: true,
  createdAt: true,
  updatedAt: true,
  order: {
    select: {
      id: true,
      orderNumber: true,
      channel: true,
      status: true,
      table: { select: { id: true, name: true } },
      items: {
        where: { status: { notIn: ["CANCELLED", "VOIDED"] } },
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          addonTotal: true,
          lineSubtotal: true,
          specialInstructions: true,
          status: true,
          menuItem: { select: { id: true, name: true } },
          variant: { select: { id: true, name: true } },
          addons: {
            select: {
              quantity: true,
              unitPrice: true,
              total: true,
              addon: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  },
  splits: {
    select: { id: true, label: true, amount: true },
  },
  payments: {
    select: {
      id: true,
      method: true,
      status: true,
      amount: true,
      reference: true,
      createdAt: true,
      receivedBy: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.BillSelect;

// Trimmed payload returned for list endpoints. Excludes payments, splits, and
// order items so the response stays small even when paginating large
// collections.
const billListSelect = {
  id: true,
  billNumber: true,
  status: true,
  subtotal: true,
  discountAmount: true,
  discountPercentage: true,
  grandTotal: true,
  paid: true,
  refunded: true,
  due: true,
  createdAt: true,
  updatedAt: true,
  order: {
    select: {
      id: true,
      orderNumber: true,
      channel: true,
      status: true,
      table: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.BillSelect;

export const billingRepository = {
  list: (input: PaginationInput & { status?: string }) => {
    const where: Prisma.BillWhereInput = input.status
      ? { status: input.status as Prisma.EnumBillStatusFilter }
      : {};

    return prisma.$transaction([
      prisma.bill.count({ where }),
      prisma.bill.findMany({
        where,
        ...getPagination(input),
        select: billListSelect,
        orderBy: { createdAt: "desc" },
      }),
    ]);
  },

  findById: (id: string, tx: Prisma.TransactionClient = prisma) =>
    tx.bill.findFirst({ where: { id }, select: billDetailSelect }),

  findByOrderId: (orderId: string, tx: Prisma.TransactionClient = prisma) =>
    tx.bill.findFirst({ where: { orderId }, select: billDetailSelect }),
};
