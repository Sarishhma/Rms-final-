import type { Variant } from "@/features/menu/types";
import type { MenuItemType } from "@/features/menu/types";

export enum KotStatus {
  PENDING = "PENDING",
  SERVED = "SERVED",
  CANCELLED = "CANCELLED",
}

export interface KotOrderTable {
  id: string;
  name: string;
}
export interface KotItem {
  id: string;
  quantity: number;
  status: string; // e.g., "PENDING"
  orderItem: KotOrderItem;
}

export interface KotOrder {
  id: string;
  orderNumber: string;
  tableId: string | null;
  table: KotOrderTable | null;
}

export interface Kot {
  id: string;
  kotNumber: string;
  orderId: string;
  status: KotStatus | string;
  createdAt: string;
  updatedAt: string;
  order: KotOrder;
  items?: KotItem[];
  _count: {
    items: number;
  };
}

export interface KotListResponse {
  success: boolean;
  data: Kot[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export interface KotOrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  specialInstructions: string | null;
  status: string; // e.g., "PENDING"
  menuItem: {
    id: string;
    name: string;
    type: MenuItemType;
  };
  variant: Variant | null;
  addons: any[];
}
export interface UpdateKotPayload {
  status?: KotStatus | string;
  items?: {
    id: string;
    status?: string;
  }[];
}

export interface KitchenPrinterJobItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface KitchenPrinterJob {
  kitchenStationId: string;
  kitchenStationName: string;

  printerIp: string | null;
  printerPort: number | null;

  orderId: string;
  orderNumber: string;

  table: string | null;
  customer: string | null;
  staff: string;

  createdAt: string;

  notes: string | null;

  items: KitchenPrinterJobItem[];
}
