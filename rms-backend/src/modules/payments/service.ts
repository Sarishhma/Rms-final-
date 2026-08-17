import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { badRequest, conflict, notFound } from "../../utils/app-error.js";
import { getCompanyId } from "../../utils/context.js";
import { D } from "../../utils/money.js";
import { paginationMeta } from "../../utils/pagination.js";
import { publishEvent } from "../../websocket/socket.js";
import { websocketEvents } from "../../websocket/events.js";
import { auditRepository } from "../audit/repository.js";
import { billStatusForPayment as billStatusFor, billStatusForRefund } from "../billing/service.js";
import { shiftRepository } from "../shifts/repository.js";
import { kotRepository } from "../kot/repository.js";
import { paymentRepository, paymentDetailSelect } from "./repository.js";
import type { createPaymentSchema, listPaymentsSchema, voidPaymentSchema } from "./schema.js";
import type { z } from "zod";

// Resolve payment amount from payInFull or amount
const resolvePaymentAmount = (
  input: z.infer<typeof createPaymentSchema>,
  billDue: Prisma.Decimal
): Prisma.Decimal => {
  if (input.payInFull) {
    return billDue;
  }
  if (!input.amount) {
    throw badRequest("Amount is required when payInFull is false");
  }
  return input.amount;
};

export const paymentService = {
  list: async (input: z.infer<typeof listPaymentsSchema>) => {
    const [total, rows] = await paymentRepository.list(input);
    return { data: rows, meta: paginationMeta(input, total) };
  },

  create: async (input: z.infer<typeof createPaymentSchema>, actorId: string) =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const companyId = getCompanyId();
      if (!companyId) throw badRequest("Missing tenant context");

      // Serialize concurrent payments against the same bill: without this row
      // lock, two cashiers can both pass the "amount <= due" check under Read
      // Committed isolation and overpay the bill. The lock is held until the
      // transaction ends. ($queryRaw bypasses the tenant extension, so the
      // companyId scope is applied explicitly here.)
      await tx.$queryRaw`SELECT id FROM "Bill" WHERE id = ${input.billId} AND "companyId" = ${companyId} FOR UPDATE`;

      const bill = await tx.bill.findFirst({ where: { id: input.billId }, include: { payments: true } });
      if (!bill) throw notFound("Bill");
      if (bill.status === "PAID" || bill.status === "VOIDED" || bill.status === "REFUNDED")
        throw conflict("Bill is not payable");
      
      // Resolve payment amount from payInFull or amount
      const amount = resolvePaymentAmount(input, bill.due);
      if (amount.gt(bill.due)) throw conflict("Payment amount exceeds bill due");

      // Attach the cashier's open shift if any. Sales without an open shift
      // remain allowed (e.g. ADMIN ad-hoc payments) but won't appear on a
      // Z-report, which is the desired audit behaviour.
      const shiftId = await shiftRepository.findOpenIdForUser(actorId, tx);

      const payment = await tx.payment.create({
        data: {
          billId: input.billId,
          receivedById: actorId,
          shiftId,
          method: input.method,
          amount,
          reference: input.reference,
          note: input.note
        },
        select: paymentDetailSelect
      });

      const paid = bill.paid.plus(amount);
      const due = bill.grandTotal.minus(paid);
      const updatedBill = await tx.bill.update({
        where: { id: bill.id },
        data: {
          paid,
          due,
          status: billStatusFor(paid, bill.grandTotal, bill.status)
        },
        select: { id: true, status: true, paid: true, due: true, grandTotal: true, orderId: true }
      });

      if (updatedBill.status === "PAID") {
        await tx.order.update({ where: { id: bill.orderId }, data: { status: "COMPLETED", completedAt: new Date() } });
        await kotRepository.deleteForOrder(bill.orderId, tx);

        // ─── Auto-release tables on full payment ─────
        const orderForRelease = await tx.order.findUnique({ where: { id: bill.orderId }, select: { tableId: true } });
        const orderTableId = orderForRelease?.tableId;
        if (orderTableId) {
          // 1. Dissolve any active table group for this order
          const activeGroup = await tx.tableGroup.findFirst({
            where: { orderId: bill.orderId, isActive: true },
            include: { members: { where: { releasedAt: null } } },
          });

          if (activeGroup) {
            // Stamp releasedAt on every TableGroupMember row
            await tx.tableGroupMember.updateMany({
              where: { tableGroupId: activeGroup.id, releasedAt: null },
              data: { releasedAt: new Date() },
            });

            // Mark group as dissolved
            await tx.tableGroup.update({
              where: { id: activeGroup.id },
              data: { isActive: false },
            });

            // Release each secondary table (all except the primary)
            const secondaryIds = activeGroup.members
              .map((m: any) => m.tableId)
              .filter((id: string) => id !== orderTableId);

            for (const tableId of secondaryIds) {
              await tx.diningTable.update({
                where: { id: tableId },
                data: { status: "AVAILABLE", activeOrderId: null },
              });
              publishEvent(
                websocketEvents.tableUpdated,
                { id: tableId, status: "AVAILABLE", activeOrderId: null },
                "floor"
              );
            }
          }

          // 2. Release the primary (or sole) table
          const releasedPrimary = await tx.diningTable.update({
            where: { id: orderTableId },
            data: { status: "AVAILABLE", activeOrderId: null },
          });
          publishEvent(websocketEvents.tableUpdated, releasedPrimary, "floor");
        }
        // ─────────────────────────────────────────────────────────────────────
      }

      await auditRepository.create(
        {
          actorId,
          action: "PAYMENT_CREATED",
          entity: "Payment",
          entityId: payment.id,
          after: payment
        },
        tx
      );

      publishEvent(websocketEvents.paymentUpdated, payment, "cashier");
      publishEvent(websocketEvents.billUpdated, updatedBill, "cashier");
      return { payment, bill: updatedBill };
    }),

  void: async (id: string, input: z.infer<typeof voidPaymentSchema>, actorId: string) =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const payment = await tx.payment.findFirst({ where: { id }, include: { bill: true } });
      if (!payment) throw notFound("Payment");
      if (payment.status !== "COMPLETED") throw conflict("Only completed payments can be voided");

      // Voiding takes the Payment row lock, serialising with any in-flight
      // refund on this payment before we re-aggregate below.
      const voided = await tx.payment.update({ where: { id }, data: { status: "VOIDED" }, select: paymentDetailSelect });

      // Re-derive the bill from its source rows rather than `bill.paid - amount`,
      // so the void can't drift stored totals/status when refunds exist on the
      // bill. Pick the refund-aware status function only when refunds are
      // present; otherwise the pure payment status (which returns OPEN at zero).
      const [paidAgg, refundedAgg] = await Promise.all([
        tx.payment.aggregate({ where: { billId: payment.billId, status: "COMPLETED" }, _sum: { amount: true } }),
        tx.refund.aggregate({ where: { payment: { billId: payment.billId }, status: "COMPLETED" }, _sum: { amount: true } }),
      ]);
      const paid = paidAgg._sum.amount ?? D(0);
      const refunded = refundedAgg._sum.amount ?? D(0);
      const netPaid = paid.minus(refunded);
      const dueRaw = payment.bill.grandTotal.minus(netPaid);
      const due = dueRaw.isNegative() ? D(0) : dueRaw;
      const status = refunded.gt(0)
        ? billStatusForRefund(netPaid, payment.bill.grandTotal, payment.bill.status)
        : billStatusFor(paid, payment.bill.grandTotal, payment.bill.status);

      const bill = await tx.bill.update({
        where: { id: payment.billId },
        data: { paid, refunded, due, status },
        select: { id: true, status: true, paid: true, refunded: true, due: true, grandTotal: true, orderId: true }
      });

      await auditRepository.create(
        {
          actorId,
          action: "PAYMENT_VOIDED",
          entity: "Payment",
          entityId: id,
          before: payment,
          after: voided,
          reason: input.reason
        },
        tx
      );

      publishEvent(websocketEvents.paymentUpdated, voided, "cashier");
      publishEvent(websocketEvents.billUpdated, bill, "cashier");
      return { payment: voided, bill };
    })
};
