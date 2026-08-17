import { z } from "zod";
import { orderItemSchema } from "../orders/schema.js";
import { normalizeName } from "../../utils/string.js";

export const tableIdParamSchema = z.object({ id: z.string().uuid() });

export const listTablesSchema = z.object({
  status: z
    .enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"])
    .optional(),
  floor: z.string().trim().transform(normalizeName).optional(),
});

export const createTableBaseSchema = z.object({
  name: z.string().trim().min(1).max(50).transform(normalizeName),
  capacity: z.coerce.number().int().min(1).max(50).default(4),
});

export const createTableSchema = createTableBaseSchema.extend({
  floor: z.string().trim().max(50).transform(normalizeName).optional(),
});

export const createTableBatchRequestSchema = z.object({
  floor: z.string().trim().max(50).transform(normalizeName).optional(),
  tables: z.array(createTableBaseSchema).min(1).max(20)
});

export const createTableRequestSchema = z.union([
  createTableSchema,
  z.array(createTableSchema).min(1).max(20),
  createTableBatchRequestSchema
]);

export const updateTableSchema = createTableSchema.partial().extend({
  status: z
    .enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"])
    .optional(),
});

// ─── Swap Schemas ─────────────────────────────────────────────────────────────

export const tableSwapSchema = z.object({
  // orderId:     z.string().uuid(),
  fromTableId: z.string().uuid(),
  toTableId: z.string().uuid(),
  reason: z.string().trim().max(500).optional(),
});

// ─── Combine Schemas ──────────────────────────────────────────────────────────

export const tableCombineSchema = z.object({
  tableIds: z.array(z.string().uuid()).min(2).max(10), // 2–10 tables, any combination of occupied/available
  reason: z.string().trim().max(500).optional(),
});



// ─── Assign / seat an order from the table side ───────────────────────────────
// Two modes:
//   • attach — provide `orderId` to (re)seat an existing order at this table.
//   • create — omit `orderId` to start a fresh dine-in order already seated here.
export const assignOrderSchema = z.object({
  orderId: z.string().uuid().optional(),
  guestCount: z.number().int().min(1).max(200).optional(),
  customerId: z.string().uuid().optional(),
  customerName: z.string().trim().max(100).transform(normalizeName).optional(),
  specialInstructions: z.string().trim().max(500).optional(),
  items: z.array(orderItemSchema).optional(),
});

//SPLIT
export const tableSplitSchema = z.object({
  sourceOrderId: z.string().uuid(),
  toTableId: z.string().uuid(),
  items: z
    .array(
      z.object({
        orderItemId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, "Must select at least one item to split"),
  reason: z.string().trim().max(500).optional(),
});