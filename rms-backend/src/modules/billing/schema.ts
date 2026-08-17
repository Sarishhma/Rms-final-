import { z } from "zod";
import { paginationSchema } from "../../utils/pagination.js";
import { moneySchema } from "../../utils/money.js";

export const billIdParamSchema = z.object({ id: z.string().uuid() });

export const listBillsSchema = paginationSchema.extend({
  status: z.enum(["OPEN", "PARTIALLY_PAID", "PAID", "VOIDED", "REFUNDED"]).optional()
});

// Discount object for simplified API
const discountObjectSchema = z.object({
  type: z.enum(["amount", "percentage"]),
  value: moneySchema,
  reason: z.string().trim().max(300).optional()
}).refine(
  (data) => data.value.gte(0),
  { message: "Discount value must be non-negative", path: ["value"] }
);

// Legacy discount as a plain number (amount in rupees)
const discountNumberSchema = moneySchema.refine(
  (val) => val.gte(0),
  { message: "Discount must be non-negative" }
);

// Accept both formats: { type, value, reason } or a plain number (legacy)
const discountSchema = z.union([discountObjectSchema, discountNumberSchema]);

// Split definition without amount (for splitCount)
const splitLabelSchema = z.object({
  label: z.string().trim().min(1).max(80)
});

export const generateBillSchema = z.object({
  orderId: z.string().uuid(),
  discount: discountSchema.optional(),
  splitCount: z.number().int().min(2).max(20).optional(),
  splitLabels: z.array(splitLabelSchema).optional()
}).refine(
  (data) => {
    // If splitLabels provided, splitCount must also be provided
    if (data.splitLabels && data.splitLabels.length > 0 && !data.splitCount) {
      return false;
    }
    return true;
  },
  {
    message: "splitLabels requires splitCount to be specified",
    path: ["splitLabels"]
  }
).refine(
  (data) => {
    // If splitCount provided, splitLabels length must match (if provided)
    if (data.splitCount && data.splitLabels && data.splitLabels.length !== data.splitCount) {
      return false;
    }
    return true;
  },
  {
    message: "splitLabels length must match splitCount",
    path: ["splitLabels"]
  }
);
