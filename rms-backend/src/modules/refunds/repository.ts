import { Prisma } from "@prisma/client";
import { D } from "../../utils/money.js";
import { prisma } from "../../prisma/client.js";
import { getPagination, type PaginationInput } from "../../utils/pagination.js";

type ListInput = PaginationInput & {
  paymentId?: string;
  billId?: string;
  status?: string;
};

export const refundDetailSelect = {
  id: true,
  paymentId: true,
  shiftId: true,
  method: true,
  amount: true,
  reason: true,
  status: true,
  reference: true,
  createdAt: true,
  updatedAt: true,
  payment: { include: { bill: true } },
  processedBy: { select: { id: true, name: true, email: true, role: true } },
} satisfies Prisma.RefundSelect;

// Trimmed payload for GET /refunds list.
const refundListSelect = {
  id: true,
  paymentId: true,
  method: true,
  amount: true,
  reason: true,
  status: true,
  reference: true,
  createdAt: true,
  payment: {
    select: {
      id: true,
      billId: true,
      method: true,
      amount: true,
      bill: { select: { id: true, billNumber: true } },
    },
  },
  processedBy: { select: { id: true, name: true } },
} satisfies Prisma.RefundSelect;

export const refundRepository = {
  list: (input: ListInput) => {
    const where: Prisma.RefundWhereInput = {
      ...(input.paymentId ? { paymentId: input.paymentId } : {}),
      ...(input.billId ? { payment: { billId: input.billId } } : {}),
      ...(input.status ? { status: input.status as Prisma.EnumRefundStatusFilter } : {}),
    };

    return prisma.$transaction([
      prisma.refund.count({ where }),
      prisma.refund.findMany({
        where,
        ...getPagination(input),
        select: refundListSelect,
        orderBy: { createdAt: "desc" },
      }),
    ]);
  },

  findById: (id: string, tx: Prisma.TransactionClient = prisma) =>
    tx.refund.findFirst({ where: { id }, select: refundDetailSelect }),

  sumCompletedForPayment: async (paymentId: string, tx: Prisma.TransactionClient) => {
    const result = await tx.refund.aggregate({
      where: { paymentId, status: "COMPLETED" },
      _sum: { amount: true },
    });
    return result._sum.amount ?? D(0);
  },
};
