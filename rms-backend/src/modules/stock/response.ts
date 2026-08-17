import { Prisma } from "@prisma/client";

export const dailyStockSelect = {
  id: true,
  businessDate: true,
  menuItemId: true,
  variantId: true,
  openingQty: true,
  remainingQty: true,
  lowStockAt: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DailyStockSelect;
