import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { getPagination, type PaginationInput } from "../../utils/pagination.js";

// Trimmed payload for GET /payments list.
const paymentListSelect = {
  id: true,
  billId: true,
  billSplitId: true,
  method: true,
  status: true,
  amount: true,
  reference: true,
  note: true,
  createdAt: true,
  bill: {
    select: {
      id: true,
      billNumber: true,
      status: true,
      grandTotal: true,
    },
  },
  receivedBy: { select: { id: true, name: true } },
} satisfies Prisma.PaymentSelect;

export const paymentDetailSelect = {
  id: true,
  billId: true,
  billSplitId: true,
  shiftId: true,
  method: true,
  status: true,
  amount: true,
  reference: true,
  note: true,
  createdAt: true,
  updatedAt: true,
  bill: {
    select: {
      id: true,
      billNumber: true,
      status: true,
      grandTotal: true,
    },
  },
  receivedBy: { select: { id: true, name: true, role: true } },
} satisfies Prisma.PaymentSelect;

export const paymentRepository = {
  list: (input: PaginationInput & { method?: string; status?: string }) => {
    const where: Prisma.PaymentWhereInput = {
      ...(input.method ? { method: input.method as Prisma.EnumPaymentMethodFilter } : {}),
      ...(input.status ? { status: input.status as Prisma.EnumPaymentStatusFilter } : {}),
    };

    return prisma.$transaction([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        ...getPagination(input),
        select: paymentListSelect,
        orderBy: { createdAt: "desc" },
      }),
    ]);
  },
};
