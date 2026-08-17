export enum MenuItemType {
  FOOD = "FOOD",
  BEVERAGE = "BEVERAGE",
  OTHER = "OTHER",
}

export interface Category {
  id: string;
  companyId: string;
  name: string;
  sortOrder: number;
  isAvailable: boolean;
  isDeleted: boolean;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  companyId: string;
  categoryId: string;
  name: string;
  sortOrder: number;
  isAvailable: boolean;
  isDeleted: boolean;
}

export interface Variant {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  sku: string | null;
  isAvailable: boolean;
  isDeleted: boolean;
  trackStock: boolean;
}

export interface MenuAddon {
  id: string;
  menuItemId: string | null;
  name: string;
  price: number;
  isAvailable: boolean;
  isDeleted: boolean;
}

export interface MenuItem {
  id: string;
  companyId: string;
  name: string;
  type: MenuItemType;
  categoryId: string;
  category: Category;
  basePrice: number;
  sku: string | null;
  trackStock: boolean;
  isAvailable: boolean;
  isDeleted: boolean;
  variants: Variant[];
  addons: MenuAddon[];
  stockQuantity?: number;
  lowStockThreshold?: number;
  remainingStock?: number;
  createdAt: string;
  updatedAt: string;
  orders?: number;
    description?: string;
    subcategoryId?: string;
  
}
