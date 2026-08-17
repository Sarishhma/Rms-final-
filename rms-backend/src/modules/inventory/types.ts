import z from "zod";
import {
  createInventoryAdjustmentSchema,
  createInventoryItemSchema,
  createInventoryPurchaseSchema,
  createInventorySupplierSchema,
  createInventoryUnitConversionSchema,
  createInventoryUnitSchema,
  createStockOutSchema,
  listInventoryAdjustmentSchema,
  listInventoryItemsSchema,
  listInventoryPurchaseSchema,
  listInventorySupplierSchema,
  listInventoryUnitSchema,
  listStockBalanceSchema,
  listStockOutSchema,
  updateInventoryItemSchema,
  updateInventorySettingSchema,
  updateInventorySupplierSchema,
  updateInventoryUnitSchema,
  updateInventoryUnitConversionSchema,
  updateInventoryPurchaseSchema,
  cancelInventoryPurchaseSchema,
  updateInventoryAdjustmentSchema,
  cancelInventoryAdjustmentSchema,
} from "./schema.js";
//unit & conversion
export type CreateInventoryUnitInput = z.infer<
  typeof createInventoryUnitSchema
>;
export type UpdateInventoryUnitInput = z.infer<
  typeof updateInventoryUnitSchema
>;
export type ListInventoryUnitQuery = z.infer<typeof listInventoryUnitSchema>;
export type CreateInventoryUnitConversionInput = z.infer<
  typeof createInventoryUnitConversionSchema
>;
export type UpdateInventoryUnitConversionInput = z.infer<
  typeof updateInventoryUnitConversionSchema
>;

//items and suppliers
export type CreateInventoryItemInput = z.infer<
  typeof createInventoryItemSchema
>;
export type UpdateInventoryItemInput = z.infer<
  typeof updateInventoryItemSchema
>;
export type ListInventoryItemsQuery = z.infer<typeof listInventoryItemsSchema>;

export type CreateInventorySupplierInput = z.infer<
  typeof createInventorySupplierSchema
>;
export type UpdateInventorySupplierInput = z.infer<
  typeof updateInventorySupplierSchema
>;
export type ListInventorySupplierQuery = z.infer<
  typeof listInventorySupplierSchema
>;

//settings
export type UpdateInventorySettingInput = z.infer<
  typeof updateInventorySettingSchema
>;

//Purchases
export type CreateInventoryPurchaseInput = z.infer<
  typeof createInventoryPurchaseSchema
>;
export type UpdateInventoryPurchaseInput = z.infer<
  typeof updateInventoryPurchaseSchema
>;
export type CancelInventoryPurchaseInput = z.infer<
  typeof cancelInventoryPurchaseSchema
>;
export type ListInventoryPurchaseQuery = z.infer<
  typeof listInventoryPurchaseSchema
>;

//stockOut
export type CreateStockOutInput = z.infer<typeof createStockOutSchema>;
export type ListStockOutQuery = z.infer<typeof listStockOutSchema>;

//Adjustment
export type CreateInventoryAdjustmentInput = z.infer<
  typeof createInventoryAdjustmentSchema
>;
export type UpdateInventoryAdjustmentInput = z.infer<
  typeof updateInventoryAdjustmentSchema
>;
export type CancelInventoryAdjustmentInput = z.infer<
  typeof cancelInventoryAdjustmentSchema
>;
export type ListInventoryAdjustmentQuery = z.infer<
  typeof listInventoryAdjustmentSchema
>;

//Stock Balance
export type ListStockBalanceQuery = z.infer<typeof listStockBalanceSchema>;
