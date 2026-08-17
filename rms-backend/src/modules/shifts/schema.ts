import { z } from "zod";
import { paginationSchema } from "../../utils/pagination.js";
import { moneySchema } from "../../utils/money.js";

export const shiftIdParamSchema = z.object({ id: z.string().uuid() });

export const listShiftsSchema = paginationSchema.extend({
  status: z.enum(["OPEN", "CLOSED"]).optional(),
  openedById: z.string().uuid().optional()
});

export const openShiftSchema = z.object({
  openingCash: moneySchema.default(0),
  openingNote: z.string().trim().max(300).optional()
});

export const closeShiftSchema = z.object({
  closingCash: moneySchema,
  closingNote: z.string().trim().max(300).optional()
});

export const cashDrawerEventSchema = z.object({
  type: z.enum(["PAY_IN", "PAY_OUT"]),
  amount: moneySchema,
  reason: z.string().trim().min(1).max(300),
  reference: z.string().trim().max(120).optional()
});
