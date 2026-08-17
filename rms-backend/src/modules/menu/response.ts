import { Prisma } from "@prisma/client";

export const categoryResponseSelect = {
  id: true,
  name: true,
  sortOrder: true,
  kitchenStationId: true,
  targetPrepMinutes: true,
  isAvailable: true,
} satisfies Prisma.CategorySelect;

export const subcategoryResponseSelect = {
  id: true,
  categoryId: true,
  name: true,
  sortOrder: true,
  isAvailable: true,
} satisfies Prisma.SubcategorySelect;

export const menuItemResponseSelect = {
  id: true,
  name: true,
  description: true,
  type: true,
  categoryId: true,
  subcategoryId: true,
  basePrice: true,
  baseCost: true,
  sku: true,
  kitchenStationId: true,
  targetPrepMinutes: true,
  trackStock: true,
  isAvailable: true,
} satisfies Prisma.MenuItemSelect;

export const menuVariantResponseSelect = {
  id: true,
  menuItemId: true,
  name: true,
  price: true,
  sku: true,
  isAvailable: true,
} satisfies Prisma.MenuVariantSelect;

export const menuAddonResponseSelect = {
  id: true,
  menuItemId: true,
  name: true,
  price: true,
  isAvailable: true,
} satisfies Prisma.MenuAddonSelect;
