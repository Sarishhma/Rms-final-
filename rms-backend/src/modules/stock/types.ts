import type { StockStatus } from "@prisma/client";

export type StockSummaryDto = {
  id: string;
  businessDate: Date;
  openingQty: number;
  remainingQty: number;
  lowStockAt: number;
  status: StockStatus;
};
