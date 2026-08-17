import { z } from "zod";
import { paginationSchema } from "../../utils/pagination.js";
import { positiveMoneySchema } from "../../utils/money.js";

export const refundIdParamSchema = z.object({ id: z.string().uuid() });

export const listRefundsSchema = paginationSchema.extend({
  paymentId: z.string().uuid().optional(),
  billId: z.string().uuid().optional(),
  status: z.enum(["COMPLETED", "VOIDED"]).optional()
});

export const createRefundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: positiveMoneySchema,
  method: z.enum(["CASH", "QR", "CARD"]).optional(),
  reason: z.string().trim().min(1).max(300),
  reference: z.string().trim().max(120).optional()
});

export const voidRefundSchema = z.object({
  reason: z.string().trim().min(1).max(300)
});
