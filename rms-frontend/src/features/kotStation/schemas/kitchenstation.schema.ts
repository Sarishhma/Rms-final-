import { z } from "zod";

export const kitchenStationSchema = z.object({
  name: z.string().min(1, "Station name is required").max(50, "Name is too long"),
  printerId: z.string().optional(),
  isActive: z.boolean(),
  isDefault: z.boolean(),
  sortOrder: z.number().int().min(0, "Sort order must be 0 or greater"),
  assignedStaffIds: z.array(z.string()).optional(),
});

export type KitchenStationFormValues = z.infer<typeof kitchenStationSchema>;