import { z } from "zod";
import { paginationSchema } from "../../utils/pagination.js";


export const kitchenStationIdParamSchema = z.object({
  id: z.string().uuid(),
});


export const listKitchenStationsSchema = paginationSchema.extend({
  isActive: z.coerce.boolean().optional(),
  search: z.string().trim().optional(),
});


export const createKitchenStationSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(255).optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  staffIds: z.array(z.string().uuid()).optional(),
});


export const updateKitchenStationSchema = createKitchenStationSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
    staffIds: z.array(z.string().uuid()).optional(),
  });


// Station-centric routing assignment (replace-set). Each list fully replaces the
// set of targets routed to this station: ids present are assigned, targets
// previously on this station but now absent are unassigned (fall back to parent
// tier, ultimately the default station).
export const assignRoutesSchema = z.object({
  categoryIds: z.array(z.string().uuid()).default([]),
  subcategoryIds: z.array(z.string().uuid()).default([]),
  menuItemIds: z.array(z.string().uuid()).default([]),
});
