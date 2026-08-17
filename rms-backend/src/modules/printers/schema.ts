import { z } from "zod";
import { paginationSchema } from "../../utils/pagination.js";

export const printerIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listPrintersSchema = paginationSchema.extend({
  isKitchen: z.coerce.boolean().optional(),
  isCashier: z.coerce.boolean().optional(),
  isBar: z.coerce.boolean().optional(),
  isReport: z.coerce.boolean().optional(),
  isEnabled: z.coerce.boolean().optional(),
  kitchenStationId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
});

// Field-level validation only. The capability invariant depends on the
// EFFECTIVE (merged) state on update, so it is enforced in the service.
export const createPrinterSchema = z.object({
  name: z.string().trim().min(1).max(80),
  ipAddress: z.string().trim().ip({ message: "ipAddress must be a valid IPv4 or IPv6 address" }),
  port: z.number().int().min(1).max(65535).default(9100),
  isKitchen: z.boolean().default(false),
  isCashier: z.boolean().default(false),
  isBar: z.boolean().default(false),
  isReport: z.boolean().default(false),
  isEnabled: z.boolean().default(true),
  kitchenStationId: z.string().uuid().nullish(),
  assignedUserId: z.string().uuid().nullish(),
});

export const updatePrinterSchema = createPrinterSchema.partial();
