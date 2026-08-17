import type { MenuItem, Variant } from "@/features/menu/types";
import type { StockStatus } from "@/features/orders";

// types/stock.type.ts
export interface StockItem {
  id: string;
  menuItem: { name: string } | null;
  variantId: string | null;
  openingQty: number;
  remainingQty: number;
  lowStockAt: number;
  businessDate: string;
}

 export interface DailyStock {
    id: string;
    companyId: string;
    businessDate: string;
    menuItemId: string;
    variantId: string | null;
    menuItem?: Pick<MenuItem, "id" | "name" | "basePrice">;
    variant?: Pick<Variant, "id" | "name" | "price"> | null;
    openingQty: number;
    remainingQty: number;
    lowStockAt: number;
    status: StockStatus;
    createdAt: string;
    updatedAt: string;
  }