import { z } from "zod";
import { paginationSchema } from "../../utils/pagination.js";
import { moneySchema } from "../../utils/money.js";
import { normalizeName } from "../../utils/string.js";

export const idParamSchema = z.object({ id: z.string().uuid() });

export const listMenuItemsSchema = paginationSchema.extend({
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
  availableOnly: z.coerce.boolean().default(false)
});

export const listSubcategoriesSchema = z.object({
  categoryId: z.string().uuid().optional()
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(80).transform(normalizeName),
  sortOrder: z.number().int().min(0).default(0),
  targetPrepMinutes: z.number().int().min(1).max(240).optional()
});
export const createCategoryRequestSchema = z.union([
  createCategorySchema,
  z.array(createCategorySchema).min(1).max(20)
]);
export const deleteCategorySchema = z.object({
 id: z.string().uuid()
});

export const createSubcategorySchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().trim().min(1).max(80).transform(normalizeName),
  sortOrder: z.number().int().min(0).default(0)
});
export const createSubcategoryRequestSchema = z.union([
  createSubcategorySchema,
  z.array(createSubcategorySchema).min(1).max(20)
]);

export const createMenuItemBaseSchema = z.object({
  name: z.string().trim().min(1).max(120).transform(normalizeName),
  description: z.string().trim().max(500).optional(),
  type: z.enum(["FOOD", "BEVERAGE", "OTHER"]).default("FOOD"),
  basePrice: moneySchema,
  sku: z.string().trim().max(80).optional(),
  targetPrepMinutes: z.number().int().min(1).max(240).optional(),
  // Optional direct kitchen-station assignment ("product belongs to a station").
  // When omitted, the item inherits routing from its subcategory/category, then
  // the company default (see kitchen-stations routing engine).
  kitchenStationId: z.string().uuid().optional(),
  trackStock: z.boolean().default(true),
  variants: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80).transform(normalizeName),
        price: moneySchema,
        sku: z.string().trim().max(80).optional(),
        trackStock: z.boolean().default(true)
      })
    )
    .default([]),
  addons: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80).transform(normalizeName),
        price: moneySchema
      })
    )
    .default([])
});

export const createMenuItemSchema = createMenuItemBaseSchema.extend({
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().optional(),
});

export const createMenuItemBatchRequestSchema = z.object({
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().optional(),
  items: z.array(createMenuItemBaseSchema).min(1).max(20)
});

export const createMenuItemRequestSchema = z.union([
  createMenuItemSchema,
  z.array(createMenuItemSchema).min(1).max(20),
  createMenuItemBatchRequestSchema
]);

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const createVariantSchema = z.object({
  menuItemId: z.string().uuid(),
  name: z.string().trim().min(1).max(80).transform(normalizeName),
  price: moneySchema,
  sku: z.string().trim().max(80).optional(),
  trackStock: z.boolean().default(true)
});

export const createAddonSchema = z.object({
  menuItemId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80).transform(normalizeName),
  price: moneySchema
});

export const availabilitySchema = z.object({
  target: z.enum(["CATEGORY", "SUBCATEGORY", "ITEM", "VARIANT", "ADDON"]),
  id: z.string().uuid(),
  isAvailable: z.boolean()
});
