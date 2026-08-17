import { z } from "zod";

export const printerSchema = z.object({
  name: z.string().min(1),
  ipAddress: z.string(),
  port: z.number().int().min(1).max(65535),
  isKitchen: z.boolean(),
  isEnabled: z.boolean(),
  kitchenStationId: z.string().optional(),
  assignedUserId: z.string().optional(),
});

export type PrinterFormValues = z.infer<typeof printerSchema>;
