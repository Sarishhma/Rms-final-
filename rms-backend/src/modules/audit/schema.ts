import { z } from "zod";
import { paginationSchema } from "../../utils/pagination.js";

export const listAuditSchema = paginationSchema.extend({
  action: z
    .enum([
      "ORDER_EDITED",
      "ORDER_CANCELLED",
      "ORDER_VOIDED",
      "DISCOUNT_APPLIED",
      "PAYMENT_CREATED",
      "PAYMENT_EDITED",
      "PAYMENT_VOIDED",
      "TABLE_RELEASED",
      "STOCK_ADJUSTED",
      "MENU_AVAILABILITY_CHANGED"
    ])
    .optional(),
  entity: z.string().trim().optional(),
  entityId: z.string().trim().optional()
});
