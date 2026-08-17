import { z } from "zod";
import { paginationSchema } from "../../utils/pagination.js";
import { normalizeName } from "../../utils/string.js";

export const customerIdParamSchema = z.object({ id: z.string().uuid() });

const phoneSchema = z
  .string()
  .trim()
  .min(4)
  .max(32)
  .regex(/^[+\d][\d\s\-]*$/, "Phone must contain digits and optional + or separators");

export const listCustomersSchema = paginationSchema.extend({
  search: z.string().trim().min(1).max(120).optional(),
  // z.coerce.boolean() treats any non-empty string (including "false") as
  // true. Use an explicit enum so query strings behave as users expect.
  includeDeleted: z
    .enum(["true", "false"]).default("false")
    .transform((v) => v === "true")
});

export const lookupCustomerSchema = z.object({
  phone: phoneSchema
});

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1).max(120).transform(normalizeName),
  phone: phoneSchema,
  email: z.string().trim().email().max(160).optional(),
  notes: z.string().trim().max(500).optional()
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  isActive: z.boolean().optional()
});
