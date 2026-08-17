import { conflict, notFound } from "../../utils/app-error.js";
import { inventoryRepository } from "./repository.js";
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

export const inventoryService = {
  // ─── SETTINGS ─────────────────────────────────────────────────────────
  getSettings: async () => {
    return inventoryRepository.getSettings();
  },
  updateSettings: async (input: UpdateInventorySettingInput) => {
    return inventoryRepository.updateSettings(input);
  },

  // ─── UNITS ────────────────────────────────────────────────────────────
  listUnits: async (query: ListInventoryUnitQuery) => {
    return inventoryRepository.listUnits(query);
  },
  getUnit: async (id: string) => {
    const unit = await inventoryRepository.findUnitById(id);
    if (!unit) throw notFound("Inventory Unit");
    return unit;
  },
  createUnit: async (input: CreateInventoryUnitInput, actorId: string) => {
    const existing = await inventoryRepository.findUnitByName(input.name);
    if (existing) {
      if (existing.isDeleted) {
        // Restore the soft-deleted unit with new input
        return inventoryRepository.updateUnit(existing.id, {
          ...input,
          isActive: true,
          isDeleted: false,
        });
      }
      throw conflict(
        `An inventory unit with the name "${input.name}" already exists.`,
      );
    }
    return inventoryRepository.createUnit({ ...input, createdById: actorId });
  },
  updateUnit: async (id: string, input: UpdateInventoryUnitInput) => {
    const unit = await inventoryRepository.findUnitById(id);
    if (!unit) throw notFound("Inventory Unit");

    if (input.name && input.name !== unit.name) {
      const existing = await inventoryRepository.findUnitByName(input.name);
      if (existing) {
        if (existing.isDeleted) {
          throw conflict(
            `A deleted inventory unit with the name "${input.name}" exists. Please rename or restore it.`,
          );
        }
        throw conflict(
          `An inventory unit with the name "${input.name}" already exists.`,
        );
      }
    }
    return inventoryRepository.updateUnit(id, input);
  },
  deleteUnit: async (id: string) => {
    const unit = await inventoryRepository.findUnitById(id);
    if (!unit) throw notFound("Inventory Unit");
    const hasRelations = await inventoryRepository.hasRelatedUnitRecords(id);

    let deleted;
    if (hasRelations) {
      deleted = await inventoryRepository.softDeleteUnit(id);
    } else {
      deleted = await inventoryRepository.hardDeleteUnit(id);
    }
    return { id: deleted.id, deleted: true };
  },
  createUnitConversion: async (input: CreateInventoryUnitConversionInput) => {
    return inventoryRepository.createUnitConversion(input);
  },
  updateUnitConversion: async (
    id: string,
    input: UpdateInventoryUnitConversionInput,
  ) => {
    const conversion = await inventoryRepository.findUnitConversionById(id);
    if (!conversion) throw notFound("Inventory Unit Conversion");
    return inventoryRepository.updateUnitConversion(id, input);
  },

  // ─── ITEMS ────────────────────────────────────────────────────────────
  listItems: async (query: ListInventoryItemsQuery) => {
    return inventoryRepository.listItems(query);
  },
  getItem: async (id: string) => {
    const item = await inventoryRepository.findItemById(id);
    if (!item) throw notFound("Inventory Item");
    return item;
  },
  createItem: async (input: CreateInventoryItemInput, actorId: string) => {
    return inventoryRepository.createItem({ ...input, createdById: actorId });
  },
  updateItem: async (id: string, input: UpdateInventoryItemInput) => {
    const item = await inventoryRepository.findItemById(id);
    if (!item) throw notFound("Inventory Item");
    return inventoryRepository.updateItem(id, input);
  },
  deleteItem: async (id: string) => {
    const item = await inventoryRepository.findItemById(id);
    if (!item) throw notFound("Inventory Item");
    const hasRelations = await inventoryRepository.hasRelatedItemRecords(id);

    let deleted;
    if (hasRelations) {
      deleted = await inventoryRepository.softDeleteItem(id);
    } else {
      deleted = await inventoryRepository.hardDeleteItem(id);
    }
    return { id: deleted.id, deleted: true };
  },

  // ─── SUPPLIERS ────────────────────────────────────────────────────────
  listSuppliers: async (query: ListInventorySupplierQuery) => {
    return inventoryRepository.listSuppliers(query);
  },
  getSupplier: async (id: string) => {
    const supplier = await inventoryRepository.findSupplierById(id);
    if (!supplier) throw notFound("Inventory Supplier");
    return supplier;
  },
  createSupplier: async (
    input: CreateInventorySupplierInput,
    actorId: string,
  ) => {
    return inventoryRepository.createSupplier({
      ...input,
      createdById: actorId,
    });
  },
  updateSupplier: async (id: string, input: UpdateInventorySupplierInput) => {
    const supplier = await inventoryRepository.findSupplierById(id);
    if (!supplier) throw notFound("Inventory Supplier");
    return inventoryRepository.updateSupplier(id, input);
  },
  deleteSupplier: async (id: string) => {
    const supplier = await inventoryRepository.findSupplierById(id);
    if (!supplier) throw notFound("Inventory Supplier");
    const hasRelations =
      await inventoryRepository.hasRelatedSupplierRecords(id);

    let deleted;
    if (hasRelations) {
      deleted = await inventoryRepository.softDeleteSupplier(id);
    } else {
      deleted = await inventoryRepository.hardDeleteSupplier(id);
    }
    return { id: deleted.id, deleted: true };
  },

  // ─── PURCHASES ────────────────────────────────────────────────────────
  listPurchases: async (query: ListInventoryPurchaseQuery) => {
    return inventoryRepository.listPurchases(query);
  },
  getPurchase: async (id: string) => {
    const purchase = await inventoryRepository.findPurchaseById(id);
    if (!purchase) throw notFound("Purchase");
    return purchase;
  },
  createPurchase: async (
    input: CreateInventoryPurchaseInput,
    actorId: string,
  ) => {
    if (input.items.length === 0)
      throw conflict("Purchase must have at least one item.");
    return inventoryRepository.createPurchase(input, actorId);
  },
  postPurchase: async (id: string, actorId: string) => {
    const purchase = await inventoryRepository.findPurchaseById(id);
    if (!purchase) throw notFound("Purchase");
    return inventoryRepository.postPurchase(id, actorId);
  },
  updatePurchase: async (id: string, input: UpdateInventoryPurchaseInput) => {
    const purchase = await inventoryRepository.findPurchaseById(id);
    if (!purchase) throw notFound("Purchase");
    if (purchase.status !== "DRAFT") {
      throw conflict(
        "Only DRAFT purchases can be edited. Use inventory adjustments to correct posted purchases.",
      );
    }
    if (input.items && input.items.length === 0) {
      throw conflict("Purchase must have at least one item.");
    }
    return inventoryRepository.updatePurchase(id, input);
  },
  cancelPurchase: async (id: string, actorId: string, cancelReason: string) => {
    const purchase = await inventoryRepository.findPurchaseById(id);
    if (!purchase) throw notFound("Purchase");
    if (purchase.status === "CANCELLED") {
      throw conflict("Purchase is already cancelled.");
    }
    return inventoryRepository.cancelPurchase(id, actorId, cancelReason);
  },

  // ─── STOCK OUTS ───────────────────────────────────────────────────────
  listStockOuts: async (query: ListStockOutQuery) => {
    return inventoryRepository.listStockOuts(query);
  },
  getStockOut: async (id: string) => {
    const stockOut = await inventoryRepository.findStockOutById(id);
    if (!stockOut) throw notFound("Stock Out");
    return stockOut;
  },
  createStockOut: async (input: CreateStockOutInput, actorId: string) => {
    if (input.items.length === 0)
      throw conflict("Stock out must have at least one item.");
    return inventoryRepository.createStockOut(input, actorId);
  },
  postStockOut: async (id: string, actorId: string) => {
    const stockOut = await inventoryRepository.findStockOutById(id);
    if (!stockOut) throw notFound("Stock Out");
    return inventoryRepository.postStockOut(id, actorId);
  },

  // ─── ADJUSTMENTS ──────────────────────────────────────────────────────
  listAdjustments: async (query: ListInventoryAdjustmentQuery) => {
    return inventoryRepository.listAdjustments(query);
  },
  getAdjustment: async (id: string) => {
    const adjustment = await inventoryRepository.findAdjustmentById(id);
    if (!adjustment) throw notFound("Adjustment");
    return adjustment;
  },
  createAdjustment: async (
    input: CreateInventoryAdjustmentInput,
    actorId: string,
  ) => {
    if (input.items.length === 0)
      throw conflict("Adjustment must have at least one item.");
    return inventoryRepository.createAdjustment(input, actorId);
  },
  postAdjustment: async (id: string, actorId: string) => {
    const adjustment = await inventoryRepository.findAdjustmentById(id);
    if (!adjustment) throw notFound("Adjustment");
    return inventoryRepository.postAdjustment(id, actorId);
  },
  updateAdjustment: async (
    id: string,
    input: UpdateInventoryAdjustmentInput,
  ) => {
    const adjustment = await inventoryRepository.findAdjustmentById(id);
    if (!adjustment) throw notFound("Adjustment");
    if (adjustment.status !== "DRAFT") {
      throw conflict(
        "Only DRAFT adjustments can be edited. Cancel and re-create to correct posted adjustments.",
      );
    }
    if (input.items && input.items.length === 0) {
      throw conflict("Adjustment must have at least one item.");
    }
    return inventoryRepository.updateAdjustment(id, input);
  },
  cancelAdjustment: async (
    id: string,
    actorId: string,
    cancelReason: string,
  ) => {
    const adjustment = await inventoryRepository.findAdjustmentById(id);
    if (!adjustment) throw notFound("Adjustment");
    if (adjustment.status === "CANCELLED") {
      throw conflict("Adjustment is already cancelled.");
    }
    return inventoryRepository.cancelAdjustment(id, actorId, cancelReason);
  },
  deleteAdjustment: async (id: string) => {
    const adjustment = await inventoryRepository.findAdjustmentById(id);
    if (!adjustment) throw notFound("Adjustment");
    if (adjustment.status !== "DRAFT") {
      throw conflict("Only DRAFT adjustments can be deleted.");
    }
    await inventoryRepository.deleteAdjustment(id);
    return { id, deleted: true };
  },

  // ─── STOCK BALANCES ───────────────────────────────────────────────────
  listStockBalances: async (query: ListStockBalanceQuery) => {
    return inventoryRepository.listStockBalances(query);
  },
};
