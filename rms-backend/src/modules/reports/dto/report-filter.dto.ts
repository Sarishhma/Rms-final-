import { z } from "zod";

const baseSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  resolution: z.enum(["hour", "day", "week", "month"]).optional(),
  staffId: z.string().uuid().optional(),
  cashierId: z.string().uuid().optional(),
  waiterId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
  menuItemId: z.string().uuid().optional(),
  channel: z.enum(["DINE_IN", "TAKEAWAY", "DELIVERY"]).optional(),
  shiftId: z.string().uuid().optional(),
  tableId: z.string().uuid().optional(),
  paymentMethod: z.enum(["CASH", "QR", "CARD", "MIXED"]).optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
});

export const reportFilterSchema = baseSchema.transform((data) => {
  const to = data.to ?? new Date();
  let from = data.from;

  if (data.resolution === "hour") {
    // Recent 24 hours
    from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
  } else if (!from) {
    // Default 30 days
    from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return {
    ...data,
    from,
    to,
  };
}).refine((data) => data.from <= data.to, {
  message: "`from` must be on or before `to`",
  path: ["from"],
});

export type ReportFilterDto = z.infer<typeof reportFilterSchema>;
