import { z } from "zod";
import { paginationSchema } from "../../utils/pagination.js";

export const kotIdParamSchema = z.object({ id: z.string().uuid() });
export const kotOrderIdParamSchema = z.object({ orderId: z.string().uuid() });
export const kotItemIdParamSchema = z.object({ itemId: z.string().uuid() });

export const listKotSchema = paginationSchema.extend({
  status: z.enum(["PENDING", "PREPARING", "READY", "SERVED", "CANCELLED"]).optional(),
  stationId: z.string().uuid().optional()
});

export const updateKotStatusSchema = z.object({
  status: z.enum(["PENDING", "PREPARING", "READY", "SERVED", "CANCELLED"])
});

export const fireKotItemsSchema = z.object({
  orderItemIds: z.array(z.string().uuid()).min(1).optional(),
  courseName: z.string().trim().min(1).max(80).optional()
}).refine((data) => data.orderItemIds?.length || data.courseName, {
  message: "Provide orderItemIds or courseName"
});
