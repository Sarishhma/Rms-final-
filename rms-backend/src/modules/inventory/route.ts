import { Hono } from "hono";
import type { AppBindings } from "../../types.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { inventoryController } from "./controller.js";
import {
  inventoryIdParamSchema,
  updateInventorySettingSchema,
  listInventoryUnitSchema,
  createInventoryUnitSchema,
  updateInventoryUnitSchema,
  createInventoryUnitConversionSchema,
  updateInventoryUnitConversionSchema,
  listInventoryItemsSchema,
  createInventoryItemSchema,
  updateInventoryItemSchema,
  listInventorySupplierSchema,
  createInventorySupplierSchema,
  updateInventorySupplierSchema,
  listInventoryPurchaseSchema,
  createInventoryPurchaseSchema,
  listStockOutSchema,
  createStockOutSchema,
  listInventoryAdjustmentSchema,
  createInventoryAdjustmentSchema,
  listStockBalanceSchema,
  updateInventoryPurchaseSchema,
  cancelInventoryPurchaseSchema,
  updateInventoryAdjustmentSchema,
  cancelInventoryAdjustmentSchema,
} from "./schema.js";

export const inventoryRoutes = new Hono<AppBindings>();

// Utility alias
const idParam = inventoryIdParamSchema;

// ─── SETTINGS ─────────────────────────────────────────────────────────────
inventoryRoutes.get(
  "/settings",
  requirePermission("inventory:read"),
  inventoryController.getSettings,
);
inventoryRoutes.patch(
  "/settings",
  requirePermission("inventory:write"),
  validate("json", updateInventorySettingSchema),
  inventoryController.updateSettings,
);

// ─── UNITS & CONVERSIONS ──────────────────────────────────────────────────
inventoryRoutes.get(
  "/units",
  requirePermission("inventory:read"),
  validate("query", listInventoryUnitSchema),
  inventoryController.listUnits,
);
inventoryRoutes.get(
  "/units/:id",
  requirePermission("inventory:read"),
  validate("param", idParam),
  inventoryController.getUnit,
);
inventoryRoutes.post(
  "/units",
  requirePermission("inventory:write"),
  validate("json", createInventoryUnitSchema),
  inventoryController.createUnit,
);
inventoryRoutes.patch(
  "/units/:id",
  requirePermission("inventory:write"),
  validate("param", idParam),
  validate("json", updateInventoryUnitSchema),
  inventoryController.updateUnit,
);
inventoryRoutes.delete(
  "/units/:id",
  requirePermission("inventory:write"),
  validate("param", idParam),
  inventoryController.deleteUnit,
);
// ─── Unit Conversions ──────────────────────────────────────────────────
inventoryRoutes.post(
  "/unit-conversions",
  requirePermission("inventory:write"),
  validate("json", createInventoryUnitConversionSchema),
  inventoryController.createUnitConversion,
);
inventoryRoutes.patch(
  "/unit-conversions/:id",
  requirePermission("inventory:write"),
  validate("param", inventoryIdParamSchema),
  validate("json", updateInventoryUnitConversionSchema),
  inventoryController.updateUnitConversion,
);

// ─── ITEMS ────────────────────────────────────────────────────────────────
inventoryRoutes.get(
  "/items",
  requirePermission("inventory:read"),
  validate("query", listInventoryItemsSchema),
  inventoryController.listItems,
);
inventoryRoutes.get(
  "/items/:id",
  requirePermission("inventory:read"),
  validate("param", idParam),
  inventoryController.getItem,
);
inventoryRoutes.post(
  "/items",
  requirePermission("inventory:write"),
  validate("json", createInventoryItemSchema),
  inventoryController.createItem,
);
inventoryRoutes.patch(
  "/items/:id",
  requirePermission("inventory:write"),
  validate("param", idParam),
  validate("json", updateInventoryItemSchema),
  inventoryController.updateItem,
);
inventoryRoutes.delete(
  "/items/:id",
  requirePermission("inventory:write"),
  validate("param", idParam),
  inventoryController.deleteItem,
);

// ─── SUPPLIERS ────────────────────────────────────────────────────────────
inventoryRoutes.get(
  "/suppliers",
  requirePermission("inventory:read"),
  validate("query", listInventorySupplierSchema),
  inventoryController.listSuppliers,
);
inventoryRoutes.get(
  "/suppliers/:id",
  requirePermission("inventory:read"),
  validate("param", idParam),
  inventoryController.getSupplier,
);
inventoryRoutes.post(
  "/suppliers",
  requirePermission("inventory:write"),
  validate("json", createInventorySupplierSchema),
  inventoryController.createSupplier,
);
inventoryRoutes.patch(
  "/suppliers/:id",
  requirePermission("inventory:write"),
  validate("param", idParam),
  validate("json", updateInventorySupplierSchema),
  inventoryController.updateSupplier,
);
inventoryRoutes.delete(
  "/suppliers/:id",
  requirePermission("inventory:write"),
  validate("param", idParam),
  inventoryController.deleteSupplier,
);

// ─── PURCHASES ────────────────────────────────────────────────────────────
inventoryRoutes.get(
  "/purchases",
  requirePermission("inventory:read"),
  validate("query", listInventoryPurchaseSchema),
  inventoryController.listPurchases,
);
inventoryRoutes.get(
  "/purchases/:id",
  requirePermission("inventory:read"),
  validate("param", idParam),
  inventoryController.getPurchase,
);
inventoryRoutes.post(
  "/purchases",
  requirePermission("inventory:write"),
  validate("json", createInventoryPurchaseSchema),
  inventoryController.createPurchase,
);
inventoryRoutes.post(
  "/purchases/:id/post",
  requirePermission("inventory:write"),
  validate("param", idParam),
  inventoryController.postPurchase,
);
inventoryRoutes.patch(
  "/purchases/:id",
  requirePermission("inventory:write"),
  validate("param", idParam),
  validate("json", updateInventoryPurchaseSchema),
  inventoryController.updatePurchase,
);
inventoryRoutes.post(
  "/purchases/:id/cancel",
  requirePermission("inventory:write"),
  validate("param", idParam),
  validate("json", cancelInventoryPurchaseSchema),
  inventoryController.cancelPurchase,
);

// ─── STOCK OUTS ───────────────────────────────────────────────────────────
inventoryRoutes.get(
  "/stock-outs",
  requirePermission("inventory:read"),
  validate("query", listStockOutSchema),
  inventoryController.listStockOuts,
);
inventoryRoutes.get(
  "/stock-outs/:id",
  requirePermission("inventory:read"),
  validate("param", idParam),
  inventoryController.getStockOut,
);
inventoryRoutes.post(
  "/stock-outs",
  requirePermission("inventory:write"),
  validate("json", createStockOutSchema),
  inventoryController.createStockOut,
);
inventoryRoutes.post(
  "/stock-outs/:id/post",
  requirePermission("inventory:write"),
  validate("param", idParam),
  inventoryController.postStockOut,
);

// ─── ADJUSTMENTS ──────────────────────────────────────────────────────────
inventoryRoutes.get(
  "/adjustments",
  requirePermission("inventory:read"),
  validate("query", listInventoryAdjustmentSchema),
  inventoryController.listAdjustments,
);
inventoryRoutes.get(
  "/adjustments/:id",
  requirePermission("inventory:read"),
  validate("param", idParam),
  inventoryController.getAdjustment,
);
inventoryRoutes.post(
  "/adjustments",
  requirePermission("inventory:write"),
  validate("json", createInventoryAdjustmentSchema),
  inventoryController.createAdjustment,
);
inventoryRoutes.post(
  "/adjustments/:id/post",
  requirePermission("inventory:write"),
  validate("param", idParam),
  inventoryController.postAdjustment,
);
inventoryRoutes.patch(
  "/adjustments/:id",
  requirePermission("inventory:write"),
  validate("param", idParam),
  validate("json", updateInventoryAdjustmentSchema),
  inventoryController.updateAdjustment,
);
inventoryRoutes.post(
  "/adjustments/:id/cancel",
  requirePermission("inventory:write"),
  validate("param", idParam),
  validate("json", cancelInventoryAdjustmentSchema),
  inventoryController.cancelAdjustment,
);
inventoryRoutes.delete(
  "/adjustments/:id",
  requirePermission("inventory:write"),
  validate("param", idParam),
  inventoryController.deleteAdjustment,
);

// ─── STOCK BALANCES ───────────────────────────────────────────────────────
inventoryRoutes.get(
  "/stock-balances",
  requirePermission("inventory:read"),
  validate("query", listStockBalanceSchema),
  inventoryController.listStockBalances,
);
