import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { getPagination, type PaginationInput } from "../../utils/pagination.js";

type ListInput = PaginationInput & {
  status?: string;
  openedById?: string;
};

export const shiftDetailSelect = {
  id: true,
  shiftNumber: true,
  status: true,
  openingCash: true,
  closingCash: true,
  expectedCash: true,
  variance: true,
  cashSales: true,
  qrSales: true,
  cardSales: true,
  mixedSales: true,
  totalSales: true,
  cashRefunds: true,
  qrRefunds: true,
  cardRefunds: true,
  mixedRefunds: true,
  totalRefunds: true,
  payIns: true,
  payOuts: true,
  paymentsCount: true,
  refundsCount: true,
  billsCount: true,
  openingNote: true,
  closingNote: true,
  openedAt: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  openedBy: { select: { id: true, name: true, email: true, role: true } },
  closedBy: { select: { id: true, name: true, email: true, role: true } },
  cashEvents: {
    include: { actor: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" }
  }
} satisfies Prisma.ShiftSelect;

const shiftListSelect = {
  id: true,
  shiftNumber: true,
  status: true,
  openingCash: true,
  closingCash: true,
  expectedCash: true,
  variance: true,
  totalSales: true,
  totalRefunds: true,
  openedAt: true,
  closedAt: true,
  openedBy: { select: { id: true, name: true } },
  closedBy: { select: { id: true, name: true } }
} satisfies Prisma.ShiftSelect;

export const shiftRepository = {
  list: (input: ListInput) => {
    const where: Prisma.ShiftWhereInput = {
      ...(input.status ? { status: input.status as Prisma.EnumShiftStatusFilter } : {}),
      ...(input.openedById ? { openedById: input.openedById } : {})
    };

    return prisma.$transaction([
      prisma.shift.count({ where }),
      prisma.shift.findMany({
        where,
        ...getPagination(input),
        select: shiftListSelect,
        orderBy: { openedAt: "desc" }
      })
    ]);
  },

  findById: (id: string, tx: Prisma.TransactionClient = prisma) =>
    tx.shift.findFirst({ where: { id }, select: shiftDetailSelect }),

  findOpenForUser: (userId: string, tx: Prisma.TransactionClient = prisma) =>
    tx.shift.findFirst({
      where: { openedById: userId, status: "OPEN" },
      select: shiftDetailSelect
    }),

  findOpenIdForUser: async (
    userId: string,
    tx: Prisma.TransactionClient
  ): Promise<string | null> => {
    const row = await tx.shift.findFirst({
      where: { openedById: userId, status: "OPEN" },
      select: { id: true }
    });
    return row?.id ?? null;
  }
};
