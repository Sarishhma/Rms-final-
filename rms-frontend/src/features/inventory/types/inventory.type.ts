
export enum InventoryUnitType {
  WEIGHT = "WEIGHT",
  VOLUME = "VOLUME",
  COUNT = "COUNT",
  PACKAGING = "PACKAGING",
}

export interface InventoryUnit {
  id: string;
  companyId: string;
  name: string;
  symbol: string;
  type: InventoryUnitType;
  isBaseUnit: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;

  // Optional relations if included in the query payload
  fromConversions?: InventoryUnitConversion[];
  toConversions?: InventoryUnitConversion[];
}

export interface InventoryUnitConversion {
  id: string;
  companyId: string;
  fromUnitId: string;
  toUnitId: string;
  factor: number; // Decimal maps to number in TS payloads, or string if you handle high-precision decimals as strings
  createdAt: string;
  updatedAt: string;

  // Optional relations
  fromUnit?: Partial<InventoryUnit>;
  toUnit?: Partial<InventoryUnit>;
}
export interface InventoryCategory {
  id: string;
  name: string;
}
export interface StockBalance {
  id: string;
  companyId: string;
  itemId: string;
  quantityOnHand: number;
  averageCost: number;
  totalValue: number;
  lastMovementAt: string;
  createdAt: string;
  updatedAt: string;
  item?: InventoryItem; 
}

export enum InventoryItemType {
  RAW_MATERIAL = "RAW_MATERIAL",
  PACKAGED_ITEM = "PACKAGED_ITEM",
  CONSUMABLE = "CONSUMABLE",
  OTHER = "OTHER",
}



export interface InventoryItem {
  id: string;
  name: string;
  categoryId: string;
  baseUnitId: string;
  type: InventoryItemType;
  reorderLevel: string;
  isActive: boolean;
  baseUnit: InventoryUnit;
  category: InventoryCategory;
  stockBalance: StockBalance | null;
  defaultPurchasePrice?: string;
  trackExpiry: boolean;
 
}
export interface StockBalance {
  id: string;
  companyId: string;
  itemId: string;
  quantityOnHand: number;
  averageCost: number;
  totalValue: number;
  lastMovementAt: string;
  createdAt: string;
  updatedAt: string;
}
export interface CreateInventoryItemPayload {
  name: string;
  type: InventoryItemType;
  categoryId: string | undefined;
  baseUnitId: string;
  reorderLevel: number;
  trackExpiry: boolean;
  defaultPurchasePrice: number;
}

export type InventorySupplier = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  panNumber?: string | null;
  vatNumber?: string | null;
  isActive: boolean;
  isDeleted: boolean;
};

export enum PurchaseStatus {
  DRAFT = "DRAFT",
  POSTED = "POSTED",
  CANCELLED = "CANCELLED",
}

export interface InventoryPurchaseLine {
  id: string;
  purchaseId: string;
  itemId: string;
  unitId: string;
  quantity: number;
  unitCost: number;
  total: number;
  baseQuantity: number;
  batchNumber?: string | null;
  manufacturedDate?: string | null;
  expiryDate?: string | null;
  item?: InventoryItem;
  unit?: InventoryUnit;
}

export interface InventoryPurchase {
  id: string;
  companyId: string;
  purchaseNumber: string;
  supplierId: string | null;
  supplierInvoiceNumber: string | null;
  purchaseDate: string;
  status: PurchaseStatus;
  discountAmount: number;
  discountPercentage:number;
  vatRate: number;
  vatAmount: number;
  subtotal: number;
  grandTotal: number;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: InventorySupplier | null;
  items?: InventoryPurchaseLine[];
}

export interface CreateInventoryPurchaseLinePayload {
  itemId: string;
  unitId: string;
  quantity: number;
  unitCost: number;
  batchNumber: string ;
  manufacturedDate?: string | null;
  expiryDate?: string | null;
}

export interface CreateInventoryPurchasePayload {
  supplierId?: string;
  supplierInvoiceNumber?: string;
  purchaseDate: string;
  discountAmount:number;
  discountPercentage:number;
  vatRate: number;
  note?: string;
  items: CreateInventoryPurchaseLinePayload[];
}

export interface UpdateInventoryPurchasePayload {
  supplierId?: string | null;
  supplierInvoiceNumber?: string | null;
  purchaseDate?: string;
  discountAmount?: number;
  discountPercentage?: number;
  vatRate?: number;
  note?: string | null;
  items?: CreateInventoryPurchaseLinePayload[];
}

export interface InventoryPurchaseListParams {
  page?: number;
  limit?: number;
  status?: PurchaseStatus;
  supplierId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ── Stock Out Types ────────────────────────────────────────────────────────────

export type StockOutReason =
  | "KITCHEN_USE"
  | "BAR_USE"
  | "STAFF_MEAL"
  | "WASTE"
  | "DAMAGED"
  | "EXPIRED"
  | "EVENT_USE"
  | "COMPLIMENTARY"
  | "INTERNAL_USE"
  | "SALES_USE"
  | "OTHER";

export const STOCK_OUT_REASONS: { value: StockOutReason; label: string }[] = [
  { value: "KITCHEN_USE", label: "Kitchen Use" },
  { value: "BAR_USE", label: "Bar Use" },
  { value: "STAFF_MEAL", label: "Staff Meal" },
  { value: "WASTE", label: "Waste" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "EXPIRED", label: "Expired" },
  { value: "EVENT_USE", label: "Event Use" },
  { value: "COMPLIMENTARY", label: "Complimentary" },
  { value: "INTERNAL_USE", label: "Internal Use" },
  { value: "SALES_USE", label: "Sales Use" },
  { value: "OTHER", label: "Other" },
];

export enum StockOutStatus {
  DRAFT = "DRAFT",
  POSTED = "POSTED",
  CANCELLED = "CANCELLED",
}

export interface InventoryStockOutLine {
  id: string;
  stockOutId: string;
  itemId: string;
  unitId: string;
  quantity: string;
  baseQuantity: string;
  note?: string | null;
  item?: InventoryItem;
  unit?: InventoryUnit;
}

export interface InventoryStockOut {
  id: string;
  stockOutNumber: string;
  reason: StockOutReason;
  customReason?: string | null;
  stockOutDate: string;
  status: StockOutStatus;
  issuedTo?: string | null;
  receivedBy?: string | null;
  note?: string | null;
  createdAt: string;
  items?: InventoryStockOutLine[];
}

export interface CreateStockOutItemPayload {
  itemId: string;
  unitId: string;
  quantity: number;
  note?: string;
}

export interface CreateStockOutPayload {
  reason: StockOutReason;
  customReason?: string;
  stockOutDate: string;
  issuedTo?: string;
  receivedBy?: string;
  note?: string;
  items: CreateStockOutItemPayload[];
}

export interface StockOutListParams {
  page?: number;
  limit?: number;
  status?: StockOutStatus;
  reason?: StockOutReason;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}
export interface StockBalanceListParams {
  page?: number;
  limit?: number;
  search?: string;
  itemId?: string;
   categoryId?: string;
  lowStockOnly?: boolean;
}

export interface StockBalanceListResponse {
  success: boolean;
  data: StockBalance[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export interface ListStockBalanceProps {
  page: number;
  limit: number;
  search?: string;
  itemId?: string;
  categoryId?: string;
  lowStockOnly?: boolean;
  onPageChange: (page: number) => void;
}