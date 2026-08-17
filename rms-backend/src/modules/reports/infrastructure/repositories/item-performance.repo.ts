import { prisma } from "../../../../prisma/client.js";
import { ReportFilters } from "../../domain/report.types.js";
import { itemSql } from "../sql/item.sql.js";

export const itemPerformanceRepo = {
  summary: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      total_quantity: number;
      unique_items: number;
      total_sales: number;
      avg_item_price: number;
    }>>(itemSql.summary(f));
  },

  byPeriod: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      period: Date;
      quantity: number;
      sales: number;
    }>>(itemSql.byPeriod(f));
  },

  byHour: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      date: Date;
      hour: number;
      quantity: number;
      sales: number;
    }>>(itemSql.byHour(f));
  },

  byCategory: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      category_id: string;
      category_name: string;
      quantity: number;
      sales: number;
      item_count: number;
    }>>(itemSql.byCategory(f));
  },

  topItems: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      item_id: string;
      item_name: string;
      quantity: number;
      sales: number;
      order_count: number;
    }>>(itemSql.topItems(f));
  },

  bottomItems: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      item_id: string;
      item_name: string;
      quantity: number;
      sales: number;
      order_count: number;
    }>>(itemSql.bottomItems(f));
  },

  neverOrdered: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      item_id: string;
      item_name: string;
      category_name: string | null;
      base_price: number;
    }>>(itemSql.neverOrdered(f));
  }
};
