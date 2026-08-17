import { PaymentMethod, Prisma } from "@prisma/client";
import { D } from "../../utils/money.js";
import { prisma } from "../../prisma/client.js";
import { badRequest, conflict, notFound } from "../../utils/app-error.js";
import { getCompanyId } from "../../utils/context.js";
import { paginationMeta } from "../../utils/pagination.js";
import { auditRepository } from "../audit/repository.js";
import { sequenceRepository } from "../sequences/repository.js";
import { shiftRepository, shiftDetailSelect } from "./repository.js";
import type {
  cashDrawerEventSchema,
  closeShiftSchema,
  listShiftsSchema,
  openShiftSchema
} from "./schema.js";
import type { z } from "zod";

type MethodTotals = Record<PaymentMethod, Prisma.Decimal>;

const zeroTotals = (): MethodTotals => ({
  CASH: D(0),
  QR: D(0),
  CARD: D(0),
  MIXED: D(0)
});

// Recomputes a shift's running totals from its linked rows. Used to render
// the Z-report at close, and also to support a live "current shift" preview.
const computeTotals = async (tx: Prisma.TransactionClient, shiftId: string) => {
  const [payments, refunds, cashEvents] = await Promise.all([
    tx.payment.groupBy({
      by: ["method"],
      where: { shiftId, status: "COMPLETED" },
      _sum: { amount: true },
      _count: { _all: true }
    }),
    tx.refund.groupBy({
      by: ["method"],
      where: { shiftId, status: "COMPLETED" },
      _sum: { amount: true },
      _count: { _all: true }
    }),
    tx.cashDrawerEvent.groupBy({
      by: ["type"],
      where: { shiftId },
      _sum: { amount: true }
    })
  ]);

  const sales = zeroTotals();
  let paymentsCount = 0;
  for (const row of payments) {
    sales[row.method] = row._sum.amount ?? D(0);
    paymentsCount += row._count._all;
  }

  const refundTotals = zeroTotals();
  let refundsCount = 0;
  for (const row of refunds) {
    refundTotals[row.method] = row._sum.amount ?? D(0);
    refundsCount += row._count._all;
  }

  let payIns = D(0);
  let payOuts = D(0);
  for (const row of cashEvents) {
    const amt = row._sum.amount ?? D(0);
    if (row.type === "PAY_IN") payIns = amt;
    else if (row.type === "PAY_OUT") payOuts = amt;
  }

  const billRows = await tx.payment.findMany({
    where: { shiftId, status: "COMPLETED" },
    select: { billId: true },
    distinct: ["billId"]
  });

  const totalSales = sales.CASH.plus(sales.QR).plus(sales.CARD).plus(sales.MIXED);
  const totalRefunds =
    refundTotals.CASH.plus(refundTotals.QR).plus(refundTotals.CARD).plus(refundTotals.MIXED);

  return {
    cashSales: sales.CASH,
    qrSales: sales.QR,
    cardSales: sales.CARD,
    mixedSales: sales.MIXED,
    totalSales,
    cashRefunds: refundTotals.CASH,
    qrRefunds: refundTotals.QR,
    cardRefunds: refundTotals.CARD,
    mixedRefunds: refundTotals.MIXED,
    totalRefunds,
    payIns,
    payOuts,
    paymentsCount,
    refundsCount,
    billsCount: billRows.length
  };
};

const expectedCashFor = (
  openingCash: Prisma.Decimal,
  totals: { cashSales: Prisma.Decimal; cashRefunds: Prisma.Decimal; payIns: Prisma.Decimal; payOuts: Prisma.Decimal }
) =>
  openingCash.plus(totals.cashSales).plus(totals.payIns).minus(totals.cashRefunds).minus(totals.payOuts);

export const shiftService = {
  list: async (input: z.infer<typeof listShiftsSchema>) => {
    const [total, rows] = await shiftRepository.list(input);
    return { data: rows, meta: paginationMeta(input, total) };
  },

  get: async (id: string) => {
    const shift = await shiftRepository.findById(id);
    if (!shift) throw notFound("Shift");
    return shift;
  },

  current: async (actorId: string) => {
    const shift = await shiftRepository.findOpenForUser(actorId);
    if (!shift) return null;
    const totals = await computeTotals(prisma, shift.id);
    const expectedCash = expectedCashFor(shift.openingCash, totals);
    return { ...shift, ...totals, expectedCash };
  },

  open: async (input: z.infer<typeof openShiftSchema>, actorId: string) => {
    const companyId = getCompanyId();
    if (!companyId) throw badRequest("Missing tenant context");

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = await tx.shift.findFirst({
        where: { openedById: actorId, status: "OPEN" },
        select: { id: true, shiftNumber: true }
      });
      if (existing)
        throw conflict(`You already have an open shift (${existing.shiftNumber}); close it first`);

      const shiftNumber = await sequenceRepository.next(tx, companyId, "SHIFT");
      const shift = await tx.shift.create({
        data: {
          shiftNumber,
          openedById: actorId,
          openingCash: input.openingCash,
          openingNote: input.openingNote
        },
        select: shiftDetailSelect
      });

      await auditRepository.create(
        {
          actorId,
          action: "SHIFT_OPENED",
          entity: "Shift",
          entityId: shift.id,
          after: shift
        },
        tx
      );

      return shift;
    });
  },

  close: async (
    id: string,
    input: z.infer<typeof closeShiftSchema>,
    actorId: string
  ) => {
    const companyId = getCompanyId();
    if (!companyId) throw badRequest("Missing tenant context");

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Lock the shift row so totals computed below cannot race with a
      // late payment/refund that targets this shiftId.
      await tx.$queryRaw`SELECT id FROM "Shift" WHERE id = ${id} AND "companyId" = ${companyId} FOR UPDATE`;

      const shift = await tx.shift.findFirst({ where: { id } });
      if (!shift) throw notFound("Shift");
      if (shift.status !== "OPEN") throw conflict("Shift is not open");

      const totals = await computeTotals(tx, id);
      const expectedCash = expectedCashFor(shift.openingCash, totals);
      const variance = input.closingCash.minus(expectedCash);

      const closed = await tx.shift.update({
        where: { id },
        data: {
          status: "CLOSED",
          closedById: actorId,
          closedAt: new Date(),
          closingCash: input.closingCash,
          closingNote: input.closingNote,
          expectedCash,
          variance,
          ...totals
        },
        select: shiftDetailSelect
      });

      await auditRepository.create(
        {
          actorId,
          action: "SHIFT_CLOSED",
          entity: "Shift",
          entityId: id,
          before: shift,
          after: closed
        },
        tx
      );

      return closed;
    });
  },

  addCashEvent: async (
    shiftId: string,
    input: z.infer<typeof cashDrawerEventSchema>,
    actorId: string
  ) =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const shift = await tx.shift.findFirst({ where: { id: shiftId } });
      if (!shift) throw notFound("Shift");
      if (shift.status !== "OPEN")
        throw conflict("Cash drawer events can only be added to an open shift");
      if (shift.openedById !== actorId)
        throw conflict("Only the cashier who opened the shift can adjust its drawer");

      const event = await tx.cashDrawerEvent.create({
        data: {
          shiftId,
          actorId,
          type: input.type,
          amount: input.amount,
          reason: input.reason,
          reference: input.reference
        },
        include: { actor: { select: { id: true, name: true } } }
      });

      await auditRepository.create(
        {
          actorId,
          action: "CASH_DRAWER_ADJUSTED",
          entity: "CashDrawerEvent",
          entityId: event.id,
          after: event,
          reason: input.reason
        },
        tx
      );

      return event;
    }),

  zReport: async (id: string) => {
    const shift = await shiftRepository.findById(id);
    if (!shift) throw notFound("Shift");
    if (shift.status !== "CLOSED")
      throw conflict("Z-report is only available after the shift is closed");

    return {
      shift: {
        id: shift.id,
        shiftNumber: shift.shiftNumber,
        openedAt: shift.openedAt,
        closedAt: shift.closedAt,
        openedBy: shift.openedBy,
        closedBy: shift.closedBy
      },
      cash: {
        openingCash: shift.openingCash,
        cashSales: shift.cashSales ?? 0,
        cashRefunds: shift.cashRefunds ?? 0,
        payIns: shift.payIns ?? 0,
        payOuts: shift.payOuts ?? 0,
        expectedCash: shift.expectedCash ?? 0,
        closingCash: shift.closingCash ?? 0,
        variance: shift.variance ?? 0
      },
      salesByMethod: {
        cash: shift.cashSales ?? 0,
        qr: shift.qrSales ?? 0,
        card: shift.cardSales ?? 0,
        mixed: shift.mixedSales ?? 0,
        total: shift.totalSales ?? 0
      },
      refundsByMethod: {
        cash: shift.cashRefunds ?? 0,
        qr: shift.qrRefunds ?? 0,
        card: shift.cardRefunds ?? 0,
        mixed: shift.mixedRefunds ?? 0,
        total: shift.totalRefunds ?? 0
      },
      counts: {
        bills: shift.billsCount ?? 0,
        payments: shift.paymentsCount ?? 0,
        refunds: shift.refundsCount ?? 0
      },
      cashEvents: shift.cashEvents,
      notes: {
        opening: shift.openingNote,
        closing: shift.closingNote
      }
    };
  }
};
