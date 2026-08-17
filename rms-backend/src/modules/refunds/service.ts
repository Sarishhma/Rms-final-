import { BillStatus, Prisma } from "@prisma/client";
import { D } from "../../utils/money.js";
import { prisma } from "../../prisma/client.js";
import { badRequest, conflict, notFound } from "../../utils/app-error.js";
import { getCompanyId } from "../../utils/context.js";
import { paginationMeta } from "../../utils/pagination.js";
import { publishEvent } from "../../websocket/socket.js";
import { websocketEvents } from "../../websocket/events.js";
import { auditRepository } from "../audit/repository.js";
import { billStatusForRefund } from "../billing/service.js";
import { shiftRepository } from "../shifts/repository.js";
import { refundRepository, refundDetailSelect } from "./repository.js";
import type { createRefundSchema, listRefundsSchema, voidRefundSchema } from "./schema.js";
import type { z } from "zod";

// Re-derive bill totals from the source rows. Reading the bill's stored
// paid/refunded is unsafe because they drift under concurrent
// void/re-pay/refund flows; aggregates over completed payments and refunds
// are the only consistent view.
const recomputeBillTotals = async (
  tx: Prisma.TransactionClient,
  billId: string,
  grandTotal: Prisma.Decimal,
  originalStatus: BillStatus
) => {
  const [paidAgg, refundedAgg] = await Promise.all([
    tx.payment.aggregate({
      where: { billId, status: "COMPLETED" },
      _sum: { amount: true }
    }),
    tx.refund.aggregate({
      where: { payment: { billId }, status: "COMPLETED" },
      _sum: { amount: true }
    })
  ]);
  const paid = paidAgg._sum.amount ?? D(0);
  const refundedRaw = refundedAgg._sum.amount ?? D(0);
  const refunded = refundedRaw.isNegative() ? D(0) : refundedRaw;
  const netPaid = paid.minus(refunded);
  const dueRaw = grandTotal.minus(netPaid);
  const due = dueRaw.isNegative() ? D(0) : dueRaw;
  const status = billStatusForRefund(netPaid, grandTotal, originalStatus);
  return { paid, refunded, due, status };
};

export const refundService = {
  list: async (input: z.infer<typeof listRefundsSchema>) => {
    const [total, rows] = await refundRepository.list(input);
    return { data: rows, meta: paginationMeta(input, total) };
  },

  get: async (id: string) => {
    const refund = await refundRepository.findById(id);
    if (!refund) throw notFound("Refund");
    return refund;
  },

  create: async (input: z.infer<typeof createRefundSchema>, actorId: string) => {
    const companyId = getCompanyId();
    if (!companyId) throw badRequest("Missing tenant context");
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Row-lock the payment for the duration of the txn. Without this,
      // two concurrent refunds both pass the remainingRefundable check under
      // default Read Committed isolation and total refunds can exceed the
      // original payment amount.
      await tx.$queryRaw`SELECT id FROM "Payment" WHERE id = ${input.paymentId} AND "companyId" = ${companyId} FOR UPDATE`;

      const payment = await tx.payment.findFirst({
        where: { id: input.paymentId, companyId },
        include: { bill: true }
      });
      if (!payment) throw notFound("Payment");
      if (payment.status !== "COMPLETED")
        throw conflict("Only completed payments can be refunded");

      const previouslyRefunded = await refundRepository.sumCompletedForPayment(payment.id, tx);
      const remainingRefundable = payment.amount.minus(previouslyRefunded);
      if (input.amount.gt(remainingRefundable)) {
        throw badRequest(
          `Refund amount exceeds refundable balance (max ${remainingRefundable})`
        );
      }

      const shiftId = await shiftRepository.findOpenIdForUser(actorId, tx);

      // Default to original payment method if not specified
      const refundMethod = input.method ?? payment.method;

      const refund = await tx.refund.create({
        data: {
          paymentId: payment.id,
          processedById: actorId,
          shiftId,
          method: refundMethod as any,
          amount: input.amount,
          reason: input.reason,
          reference: input.reference
        },
        select: refundDetailSelect
      });

      const newRefundedForPayment = previouslyRefunded.plus(input.amount);
      if (newRefundedForPayment.gte(payment.amount)) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "REFUNDED" }
        });
      }

      const totals = await recomputeBillTotals(
        tx,
        payment.billId,
        payment.bill.grandTotal,
        payment.bill.status
      );

      const bill = await tx.bill.update({
        where: { id: payment.billId },
        data: totals,
        select: { id: true, status: true, paid: true, refunded: true, due: true, grandTotal: true, orderId: true }
      });

      await auditRepository.create(
        {
          actorId,
          action: "REFUND_CREATED",
          entity: "Refund",
          entityId: refund.id,
          after: refund,
          reason: input.reason
        },
        tx
      );

      publishEvent(websocketEvents.paymentUpdated, { paymentId: payment.id, refund }, "cashier");
      publishEvent(websocketEvents.billUpdated, bill, "cashier");
      return { refund, bill };
    });
  },

  void: async (id: string, input: z.infer<typeof voidRefundSchema>, actorId: string) => {
    const companyId = getCompanyId();
    if (!companyId) throw badRequest("Missing tenant context");
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const refund = await tx.refund.findFirst({
        where: { id, companyId },
        include: { payment: { include: { bill: true } } }
      });
      if (!refund) throw notFound("Refund");
      if (refund.status !== "COMPLETED")
        throw conflict("Only completed refunds can be voided");

      // Serialize void with concurrent refund flows on the same payment so
      // bill totals stay consistent.
      await tx.$queryRaw`SELECT id FROM "Payment" WHERE id = ${refund.payment.id} AND "companyId" = ${companyId} FOR UPDATE`;

      const voided = await tx.refund.update({
        where: { id },
        data: { status: "VOIDED" },
        select: refundDetailSelect
      });

      // If the payment was previously marked REFUNDED but is no longer fully
      // covered by completed refunds, restore it to COMPLETED.
      const remainingRefundedForPayment = await refundRepository.sumCompletedForPayment(
        refund.payment.id,
        tx
      );
      if (
        refund.payment.status === "REFUNDED" &&
        remainingRefundedForPayment.lt(refund.payment.amount)
      ) {
        await tx.payment.update({
          where: { id: refund.payment.id },
          data: { status: "COMPLETED" }
        });
      }

      const totals = await recomputeBillTotals(
        tx,
        refund.payment.billId,
        refund.payment.bill.grandTotal,
        refund.payment.bill.status
      );

      const updatedBill = await tx.bill.update({
        where: { id: refund.payment.billId },
        data: totals,
        select: { id: true, status: true, paid: true, refunded: true, due: true, grandTotal: true, orderId: true }
      });

      await auditRepository.create(
        {
          actorId,
          action: "REFUND_VOIDED",
          entity: "Refund",
          entityId: id,
          before: refund,
          after: voided,
          reason: input.reason
        },
        tx
      );

      publishEvent(websocketEvents.paymentUpdated, { paymentId: refund.payment.id, refund: voided }, "cashier");
      publishEvent(websocketEvents.billUpdated, updatedBill, "cashier");
      return { refund: voided, bill: updatedBill };
    });
  }
};
