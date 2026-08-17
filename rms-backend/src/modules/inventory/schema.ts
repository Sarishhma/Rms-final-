import z from "zod";
import { paginationSchema } from "../../utils/pagination.js";
import { moneySchema } from "../../utils/money.js";

export const inventoryIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const inventoryUnitTypeSchema = z.enum([
  "WEIGHT",
  "VOLUME",
  "COUNT",
  "PACKAGING",
]);

export const inventoryItemTypeSchema = z.enum([
  "RAW_MATERIAL",
  "PACKAGED_ITEM",
  "CONSUMABLE",
  "OTHER",
]);

export const inventoryCostingMethodSchema = z.enum([
  "FIFO",
  "FEFO",
  "WEIGHTED_AVERAGE",
]);

export const inventoryPurchaseStatusSchema = z.enum([
  "DRAFT",
  "POSTED",
  "CANCELLED",
]);

export const stockOutStatusSchema = z.enum(["DRAFT", "POSTED", "CANCELLED"]);

export const stockOutReasonSchema = z.enum([
  "KITCHEN_USE",
  "BAR_USE",
  "STAFF_MEAL",
  "WASTE",
  "DAMAGED",
  "EXPIRED",
  "EVENT_USE",
  "COMPLIMENTARY",
  "INTERNAL_USE",
  "SALES_USE",
  "OTHER",
]);

export const inventoryAdjustmentStatusSchema = z.enum([
  "DRAFT",
  "POSTED",
  "CANCELLED",
]);

export const stockMovementTypeSchema = z.enum([
  "OPENING_BALANCE",
  "PURCHASE_IN",
  "STOCK_OUT",
  "ADJUSTMENT_IN",
  "ADJUSTMENT_OUT",
]);

export const stockMovementDirectionSchema = z.enum(["IN", "OUT"]);

export const stockReferenceTypeSchema = z.enum([
  "OPENING_BALANCE",
  "PURCHASE",
  "STOCK_OUT",
  "INVENTORY_ADJUSTMENT",
  "MANUAL",
]);

export const listInventoryUnitSchema = paginationSchema.extend({
  type: inventoryUnitTypeSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().trim().optional(),
});

export const createInventoryUnitSchema = z.object({
  name: z.string().trim().min(1).max(80),
  symbol: z.string().trim().min(1).max(20).optional(),
  type: inventoryUnitTypeSchema,
  isBaseUnit: z.boolean().default(false),
});

export const updateInventoryUnitSchema = createInventoryUnitSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export const createInventoryUnitConversionSchema = z
  .object({
    fromUnitId: z.string().uuid(),
    toUnitId: z.string().uuid(),
    factor: z.coerce.number().positive(),
  })
  .refine((input) => input.fromUnitId !== input.toUnitId, {
    message: "fromUnitId and toUnitId must be different",
    path: ["toUnitId"],
  });

export const updateInventoryUnitConversionSchema = z.object({
  fromUnitId: z.string().uuid().optional(),
  toUnitId: z.string().uuid().optional(),
  factor: z.coerce.number().positive().optional(),
});
export const listInventoryItemsSchema = paginationSchema.extend({
  categoryId: z.string().uuid().optional(),
  type: inventoryItemTypeSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  lowStockOnly: z.coerce.boolean().default(false),
  search: z.string().trim().optional(),
});

export const createInventoryItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  code: z.string().trim().min(1).max(80),
  type: inventoryItemTypeSchema.default("RAW_MATERIAL"),
  categoryId: z.string().uuid().optional(),
  baseUnitId: z.string().uuid(),
  reorderLevel: z.coerce.number().min(0).default(0),
  trackExpiry: z.boolean().default(false),
  costingMethod: inventoryCostingMethodSchema.default("FEFO"),
  defaultPurchasePrice: moneySchema.default(0),
});

export const updateInventoryItemSchema = createInventoryItemSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export const listInventorySupplierSchema = paginationSchema.extend({
  isActive: z.coerce.boolean().optional(),
  search: z.string().trim().optional(),
});

export const createInventorySupplierSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(120).optional(),
  address: z.string().trim().max(300).optional(),
  panNumber: z.string().trim().max(50).optional(),
  vatNumber: z.string().trim().max(50).optional(),
  contactPerson: z.string().trim().min(1).max(120).optional(),
});

export const updateInventorySupplierSchema = createInventorySupplierSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export const updateInventorySettingSchema = z.object({
  allowNegativeStock: z.boolean().optional(),
  defaultCostingMethod: inventoryCostingMethodSchema.optional(),
  defaultVatRate: z.coerce.number().min(0).max(100).optional(),
  lowStockAlertEnabled: z.boolean().optional(),
  expiryAlertEnabled: z.boolean().optional(),
  expiryAlertDays: z.coerce.number().int().min(0).max(365).optional(),
});

export const listInventoryPurchaseSchema = paginationSchema.extend({
  status: inventoryPurchaseStatusSchema.optional(),
  supplierId: z.string().uuid().optional(),
  fiscalYear: z.string().uuid().optional(),
  search: z.string().trim().optional(),
});

export const inventoryPurchaseItemSchema = z.object({
  itemId: z.string().uuid(),
  unitId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  unitCost: moneySchema,
  batchNumber: z.string().trim().optional(),
  manufacturedDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
});

export const createInventoryPurchaseSchema = z.object({
  supplierId: z.string().uuid().optional(),
  supplierInvoiceNumber: z.string().trim().optional(),
  purchaseDate: z.coerce.date().default(() => new Date()),
  discount: z.object({
    type: z.enum(["amount", "percentage"]),
    value: moneySchema,
  }).optional(),
  vatRate: z.coerce.number().min(0).max(100).optional(),
  note: z.string().trim().optional(),
  items: z.array(inventoryPurchaseItemSchema).min(1),
});

export const updateInventoryPurchaseSchema = z.object({
  supplierId: z.string().uuid().optional().nullable(),
  supplierInvoiceNumber: z.string().trim().optional().nullable(),
  purchaseDate: z.coerce.date().optional(),
  discount: z.object({
    type: z.enum(["amount", "percentage"]),
    value: moneySchema,
  }).optional(),
  vatRate: z.coerce.number().min(0).max(100).optional(),
  note: z.string().trim().optional().nullable(),
  items: z.array(inventoryPurchaseItemSchema).min(1).optional(),
});

export const cancelInventoryPurchaseSchema = z.object({
  cancelReason: z.string().trim().min(1).max(500),
});

export const listStockOutSchema = paginationSchema.extend({
  status: stockOutStatusSchema.optional(),
  reason: stockOutReasonSchema.optional(),
  search: z.string().trim().optional(),
});

export const stockOutitemSchema = z.object({
  itemId: z.string().uuid(),
  unitId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  note: z.string().trim().optional(),
});

export const createStockOutSchema = z.object({
  reason: stockOutReasonSchema,
  customReason: z.string().trim().optional(),
  stockOutDate: z.coerce.date().default(() => new Date()),
  issuedTo: z.string().trim().optional(),
  receivedBy: z.string().trim().optional(),
  note: z.string().trim().optional(),
  items: z.array(stockOutitemSchema).min(1),
});

export const listInventoryAdjustmentSchema = paginationSchema.extend({
  status: inventoryAdjustmentStatusSchema.optional(),
  search: z.string().trim().optional(),
});

export const inventoryAdjustmentItemSchema = z.object({
  itemId: z.string().uuid(),
  unitId: z.string().uuid(),
  actualQuantity: z.coerce.number().min(0),
  note: z.string().trim().optional(),
});

export const createInventoryAdjustmentSchema = z.object({
  reason: z.string().trim().min(1),
  adjustmentDate: z.coerce.date().default(() => new Date()),
  note: z.string().trim().optional(),
  items: z.array(inventoryAdjustmentItemSchema).min(1),
});

export const updateInventoryAdjustmentSchema = z.object({
  reason: z.string().trim().min(1).optional(),
  adjustmentDate: z.coerce.date().optional(),
  note: z.string().trim().optional().nullable(),
  items: z.array(inventoryAdjustmentItemSchema).min(1).optional(),
});

export const cancelInventoryAdjustmentSchema = z.object({
  cancelReason: z.string().trim().min(1).max(500),
});

export const listStockBalanceSchema = paginationSchema.extend({
  itemId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  lowStockOnly: z.coerce.boolean().default(false),
  search: z.string().trim().optional(),
});
