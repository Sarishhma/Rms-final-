import { Context } from "hono";
import { inventoryService } from "./service.js";
import { getValidated } from "../../middleware/validate.js";
import {
  CreateInventoryAdjustmentInput,
  CreateInventoryItemInput,
  CreateInventoryPurchaseInput,
  CreateInventorySupplierInput,
  CreateInventoryUnitConversionInput,
  CreateInventoryUnitInput,
  CreateStockOutInput,
  ListInventoryAdjustmentQuery,
  ListInventoryItemsQuery,
  ListInventoryPurchaseQuery,
  ListInventorySupplierQuery,
  ListInventoryUnitQuery,
  ListStockBalanceQuery,
  ListStockOutQuery,
  UpdateInventoryItemInput,
  UpdateInventorySettingInput,
  UpdateInventorySupplierInput,
  UpdateInventoryUnitInput,
  UpdateInventoryUnitConversionInput,
  UpdateInventoryPurchaseInput,
  CancelInventoryPurchaseInput,
  UpdateInventoryAdjustmentInput,
  CancelInventoryAdjustmentInput,
} from "./types.js";
import { created, ok } from "../../utils/response.js";
import { inventoryIdParamSchema } from "./schema.js";
import z from "zod";

const idParam = inventoryIdParamSchema;

export const inventoryController = {
  // ─── SETTINGS ─────────────────────────────────────────────────────────
  getSettings: async (c: Context) =>
    ok(c, await inventoryService.getSettings()),

  updateSettings: async (c: Context) =>
    ok(
      c,
      await inventoryService.updateSettings(
        getValidated<UpdateInventorySettingInput>(c, "json"),
      ),
    ),

  // ─── UNITS ────────────────────────────────────────────────────────────
  listUnits: async (c: Context) => {
    const result = await inventoryService.listUnits(
      getValidated<ListInventoryUnitQuery>(c, "query"),
    );
    return ok(c, result.data, result.meta);
  },

  getUnit: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParam>>(c, "param");
    return ok(c, await inventoryService.getUnit(id));
  },

  createUnit: async (c: Context) =>
    created(
      c,
      await inventoryService.createUnit(
        getValidated<CreateInventoryUnitInput>(c, "json"),
        c.get("authUser").id,
      ),
    ),

  updateUnit: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParam>>(c, "param");
    return ok(
      c,
      await inventoryService.updateUnit(
        id,
        getValidated<UpdateInventoryUnitInput>(c, "json"),
      ),
    );
  },

  deleteUnit: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParam>>(c, "param");
    return ok(c, await inventoryService.deleteUnit(id));
  },

  createUnitConversion: async (c: Context) =>
    created(
      c,
      await inventoryService.createUnitConversion(
        getValidated<CreateInventoryUnitConversionInput>(c, "json"),
      ),
    ),

  updateUnitConversion: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParam>>(c, "param");
    return ok(
      c,
      await inventoryService.updateUnitConversion(
        id,
        getValidated<UpdateInventoryUnitConversionInput>(c, "json"),
      ),
    );
  },

  // ─── ITEMS ────────────────────────────────────────────────────────────
  listItems: async (c: Context) => {
    const result = await inventoryService.listItems(
      getValidated<ListInventoryItemsQuery>(c, "query"),
    );
    return ok(c, result.data, result.meta);
  },

  getItem: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParam>>(c, "param");
    return ok(c, await inventoryService.getItem(id));
  },

  createItem: async (c: Context) =>
    created(
      c,
      await inventoryService.createItem(
        getValidated<CreateInventoryItemInput>(c, "json"),
        c.get("authUser").id,
      ),
    ),

  updateItem: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParam>>(c, "param");
    return ok(
      c,
      await inventoryService.updateItem(
        id,
        getValidated<UpdateInventoryItemInput>(c, "json"),
      ),
    );
  },

  deleteItem: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParam>>(c, "param");
    return ok(c, await inventoryService.deleteItem(id));
  },

  // ─── SUPPLIERS ────────────────────────────────────────────────────────
  listSuppliers: async (c: Context) => {
    const result = await inventoryService.listSuppliers(
      getValidated<ListInventorySupplierQuery>(c, "query"),
    );
    return ok(c, result.data, result.meta);
  },

  getSupplier: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParam>>(c, "param");
    return ok(c, await inventoryService.getSupplier(id));
  },

  createSupplier: async (c: Context) =>
    created(
      c,
      await inventoryService.createSupplier(
        getValidated<CreateInventorySupplierInput>(c, "json"),
        c.get("authUser").id,
      ),
    ),

  updateSupplier: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParam>>(c, "param");
    return ok(
      c,
      await inventoryService.updateSupplier(
        id,
        getValidated<UpdateInventorySupplierInput>(c, "json"),
      ),
    );
  },

  deleteSupplier: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParam>>(c, "param");
    return ok(c, await inventoryService.deleteSupplier(id));
  },

  // ─── PURCHASES ────────────────────────────────────────────────────────
  listPurchases: async (c: Context) => {
    const result = await inventoryService.listPurchases(
      getValidated<ListInventoryPurchaseQuery>(c, "query"),
    );
    return ok(c, result.data, result.meta);
  },

  getPurchase: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParam>>(c, "param");
    return ok(c, await inventoryService.getPurchase(id));
  },

  createPurchase: async (c: Context) =>
    created(
      c,
      await inventoryService.createPurchase(
        getValidated<CreateInventoryPurchaseInput>(c, "json"),
        c.get("authUser").id,
      ),
    ),

  postPurchase: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParam>>(c, "param");
    return ok(c, await inventoryService.postPurchase(id, c.get("authUser").id));
  },

  updatePurchase: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParam>>(c, "param");
    return ok(
      c,
      await inventoryService.updatePurchase(
        id,
        getValidated<UpdateInventoryPurchaseInput>(c, "json"),
      ),
    );
  },

  cancelPurchase: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParam>>(c, "param");
    const { cancelReason } = getValidated<CancelInventoryPurchaseInput>(
      c,
      "json",
    );
    return ok(
      c,
      await inventoryService.cancelPurchase(
        id,
        c.get("authUser").id,
        cancelReason,
      ),
    );
  },

  // ─── STOCK OUTS ───────────────────────────────────────────────────────
  listStockOuts: async (c: Context) => {
    const result = await inventoryService.listStockOuts(
      getValidated<ListStockOutQuery>(c, "query"),
    );
    return ok(c, result.data, result.meta);
  },

  getStockOut: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParam>>(c, "param");
    return ok(c, await inventoryService.getStockOut(id));
  },

  createStockOut: async (c: Context) =>
    created(
      c,
      await inventoryService.createStockOut(
        getValidated<CreateStockOutInput>(c, "json"),
        c.get("authUser").id,
      ),
    ),

  postStockOut: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParam>>(c, "param");
    return ok(c, await inventoryService.postStockOut(id, c.get("authUser").id));
  },

  // ─── ADJUSTMENTS ──────────────────────────────────────────────────────
  listAdjustments: async (c: Context) => {
    const result = await inventoryService.listAdjustments(
      getValidated<ListInventoryAdjustmentQuery>(c, "query"),
    );
    return ok(c, result.data, result.meta);
  },

  getAdjustment: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParam>>(c, "param");
    return ok(c, await inventoryService.getAdjustment(id));
  },

  createAdjustment: async (c: Context) =>
    created(
      c,
      await inventoryService.createAdjustment(
        getValidated<CreateInventoryAdjustmentInput>(c, "json"),
        c.get("authUser").id,
      ),
    ),

  postAdjustment: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParam>>(c, "param");
    return ok(
      c,
      await inventoryService.postAdjustment(id, c.get("authUser").id),
    );
  },

  updateAdjustment: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParam>>(c, "param");
    return ok(
      c,
      await inventoryService.updateAdjustment(
        id,
        getValidated<UpdateInventoryAdjustmentInput>(c, "json"),
      ),
    );
  },

  cancelAdjustment: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParam>>(c, "param");
    const { cancelReason } = getValidated<CancelInventoryAdjustmentInput>(
      c,
      "json",
    );
    return ok(
      c,
      await inventoryService.cancelAdjustment(
        id,
        c.get("authUser").id,
        cancelReason,
      ),
    );
  },

  deleteAdjustment: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParam>>(c, "param");
    return ok(c, await inventoryService.deleteAdjustment(id));
  },

  // ─── STOCK BALANCES ───────────────────────────────────────────────────
  listStockBalances: async (c: Context) => {
    const result = await inventoryService.listStockBalances(
      getValidated<ListStockBalanceQuery>(c, "query"),
    );
    return ok(c, result.data, result.meta);
  },
};
