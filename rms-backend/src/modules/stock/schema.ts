import { z } from "zod";
import { paginationSchema } from "../../utils/pagination.js";

export const stockIdParamSchema = z.object({ id: z.string().uuid() });

export const listStockSchema = paginationSchema.extend({
  status: z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]).optional()
});

export const openStockSchema = z.object({
  menuItemId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  openingQty: z.number().int().min(0),
  lowStockAt: z.number().int().min(0).default(0)
});

export const adjustStockSchema = z
  .object({
    openingQty: z.number().int().min(0).optional(),
    remainingQty: z.number().int().min(0).optional(),
    lowStockAt: z.number().int().min(0).optional(),
    reason: z.string().trim().min(1).max(300).default("Stock updated")
  })
  .refine((input) => input.openingQty !== undefined || input.remainingQty !== undefined || input.lowStockAt !== undefined, {
    message: "At least one stock field is required"
  });
