import { Prisma } from "@prisma/client";

export const inventorySettingSelect = {
  id: true,
  allowNegativeStock: true,
  defaultCostingMethod: true,
  defaultVatRate: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.InventorySettingSelect;

export const inventoryUnitSelect = {
  id: true,
  name: true,
  symbol: true,
  isBaseUnit: true,
  isActive: true,
  type: true,
} satisfies Prisma.InventoryUnitSelect;

export const inventoryUnitConversionSelect = {
  id: true,
  fromUnitId: true,
  toUnitId: true,
  factor: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.InventoryUnitConversionSelect;

export const inventoryUnitListSelect = {
  ...inventoryUnitSelect,
  fromConversions: {
    select: {
      id: true,
      fromUnitId: true,
      toUnitId: true,
      factor: true,
      toUnit: { select: inventoryUnitSelect },
    },
  },
  toConversions: {
    select: {
      id: true,
      fromUnitId: true,
      toUnitId: true,
      factor: true,
      fromUnit: { select: inventoryUnitSelect },
    },
  },
} satisfies Prisma.InventoryUnitSelect;

export const inventoryItemSelect = {
  id: true,
  name: true,
  categoryId: true,
  baseUnitId: true,
  type: true,
  reorderLevel: true,
  isActive: true,
} satisfies Prisma.InventoryItemSelect;

export const stockBalanceSelect = {
  id: true,
  itemId: true,
  quantityOnHand: true,
  totalValue: true,
  averageCost: true,
  lastMovementAt: true,
  item: {
    select: {
      ...inventoryItemSelect,
      baseUnit: { select: inventoryUnitSelect },
    },
  },
} satisfies Prisma.StockBalanceSelect;

export const inventoryItemListSelect = {
  ...inventoryItemSelect,
  baseUnit: { select: inventoryUnitSelect },
  category: {
    select: {
      id: true,
      name: true,
    },
  },
  stockBalance: { select: stockBalanceSelect },
} satisfies Prisma.InventoryItemSelect;

export const inventorySupplierSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  address: true,
  isActive: true,
} satisfies Prisma.InventorySupplierSelect;

export const inventoryPurchaseSelect = {
  id: true,
  purchaseNumber: true,
  supplierId: true,
  supplierInvoiceNumber: true,
  purchaseDate: true,
  status: true,
  subtotal: true,
  discountAmount: true,
  discountPercentage: true,
  vatRate: true,
  vatAmount: true,
  grandTotal: true,
  note: true,
  createdAt: true,
  supplier: { select: inventorySupplierSelect },
  items: {
    select: {
      id: true,
      itemId: true,
      unitId: true,
      quantity: true,
      baseQuantity: true,
      unitCost: true,
      total: true,
      batchNumber: true,
      manufacturedDate: true,
      expiryDate: true,
      item: { select: inventoryItemSelect },
      unit: { select: inventoryUnitSelect },
    },
  },
} satisfies Prisma.InventoryPurchaseSelect;

export const stockOutSelect = {
  id: true,
  stockOutNumber: true,
  reason: true,
  customReason: true,
  stockOutDate: true,
  status: true,
  issuedTo: true,
  receivedBy: true,
  note: true,
  createdAt: true,
  items: {
    select: {
      id: true,
      itemId: true,
      unitId: true,
      quantity: true,
      baseQuantity: true,
      note: true,
      item: { select: inventoryItemSelect },
      unit: { select: inventoryUnitSelect },
    },
  },
} satisfies Prisma.StockOutSelect;

export const inventoryAdjustmentSelect = {
  id: true,
  adjustmentNumber: true,
  reason: true,
  adjustmentDate: true,
  status: true,
  note: true,
  createdAt: true,
  cancelledAt: true,
  cancelReason: true,
  cancelledBy: {
    select: { id: true, name: true },
  },
  createdBy: {
    select: { id: true, name: true },
  },
  postedBy: {
    select: { id: true, name: true },
  },
  items: {
    select: {
      id: true,
      itemId: true,
      unitId: true,
      systemQuantity: true,
      actualQuantity: true,
      differenceQuantity: true,
      baseSystemQuantity: true,
      baseActualQuantity: true,
      baseDifferenceQuantity: true,
      note: true,
      item: { select: inventoryItemSelect },
      unit: { select: inventoryUnitSelect },
    },
  },
} satisfies Prisma.InventoryAdjustmentSelect;
