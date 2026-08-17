import { prisma } from "../../../../prisma/client.js";
import { ReportFilters } from "../../domain/report.types.js";
import { inventorySql } from "../sql/inventory.sql.js";

export const inventoryReportRepo = {
  summary: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      total_items_tracked: number;
      total_in_stock: number;
      total_low_stock: number;
      total_out_of_stock: number;
      total_remaining_qty: number;
    }>>(inventorySql.summary(f));
  },

  byCategory: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      category_id: string;
      category_name: string;
      items_tracked: number;
      remaining_qty: number;
    }>>(inventorySql.byCategory(f));
  },

  criticalStock: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      item_id: string;
      item_name: string;
      remaining_qty: number;
      status: string;
    }>>(inventorySql.criticalStock(f));
  },

  transactions: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      purchase_qty: number;
      purchase_cost: number;
      wastage_qty: number;
      wastage_cost: number;
    }>>(inventorySql.transactions(f));
  }
};
