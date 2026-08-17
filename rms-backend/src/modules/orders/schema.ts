import { z } from "zod";
import { paginationSchema } from "../../utils/pagination.js";
import { normalizeName } from "../../utils/string.js";

export const orderItemSchema = z.object({
  menuItemId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(100),
  addonIds: z.array(z.string().uuid()).default([]),
  specialInstructions: z.string().trim().max(500).optional(),
  courseName: z.string().trim().min(1).max(80).optional(),
  fireAt: z.coerce.date().optional()
});

export const orderIdParamSchema = z.object({ id: z.string().uuid() });

export const orderChannelSchema = z.enum(["DINE_IN", "TAKEAWAY", "DELIVERY"]);

export const listOrdersSchema = paginationSchema.extend({
  status: z.enum(["CONFIRMED", "CANCELLED", "VOIDED", "COMPLETED"]).optional(),
  tableId: z.string().uuid().optional(),
  tableName: z.string().trim().max(100).transform(normalizeName).optional(),
  channel: orderChannelSchema.optional(),
  customerId: z.string().uuid().optional()
});

export const createOrderSchema = z
  .object({
    channel: orderChannelSchema.default("DINE_IN"),
    tableId: z.string().uuid().optional(),
    customerId: z.string().uuid().optional(),
    customerName: z.string().trim().max(100).transform(normalizeName).optional(),
    guestCount: z.number().int().min(1).max(200).optional(),
    specialInstructions: z.string().trim().max(500).optional(),
    createDraftBill: z.boolean().optional().default(false),
    items: z.array(orderItemSchema).default([])
  })
  .superRefine((data, ctx) => {
    if (data.channel !== "DINE_IN" && data.tableId) {
      ctx.addIssue({
        code: "custom",
        path: ["tableId"],
        message: `${data.channel} orders cannot be assigned to a table`
      });
    }

    // Require at least one identifier for DINE_IN
    if (data.channel === "DINE_IN" && !data.tableId && !data.customerId && !data.customerName) {
      ctx.addIssue({
        code: "custom",
        path: ["tableId"],
        message: "DINE_IN orders must be assigned to either a tableId, customerId, or customerName."
      });
    }
  });

export const updateOrderSchema = z.object({
  items: z.array(orderItemSchema),
});

export const orderActionSchema = z.object({
  action: z.enum(["CANCEL", "VOID"]),
  reason: z.string().trim().min(1).max(300)
});
