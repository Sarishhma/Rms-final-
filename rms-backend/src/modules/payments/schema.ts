import { z } from "zod";
import { paginationSchema } from "../../utils/pagination.js";
import { positiveMoneySchema } from "../../utils/money.js";

export const paymentIdParamSchema = z.object({ id: z.string().uuid() });

export const listPaymentsSchema = paginationSchema.extend({
  method: z.enum(["CASH", "QR", "CARD", "MIXED"]).optional(),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED", "VOIDED"]).optional()
});

export const createPaymentSchema = z.object({
  billId: z.string().uuid(),
  method: z.enum(["CASH", "QR", "CARD", "MIXED"]),
  payInFull: z.boolean().optional().default(false),
  amount: positiveMoneySchema.optional(),
  reference: z.string().trim().max(120).optional(),
  note: z.string().trim().max(300).optional()
}).refine(
  (data) => {
    if (data.payInFull && data.amount !== undefined) {
      return false;
    }
    if (!data.payInFull && data.amount === undefined) {
      return false;
    }
    return true;
  },
  {
    message: "When payInFull is true, do not provide amount. When payInFull is false, amount is required.",
    path: ["amount"]
  }
);

export const voidPaymentSchema = z.object({
  reason: z.string().trim().min(1).max(300)
});
