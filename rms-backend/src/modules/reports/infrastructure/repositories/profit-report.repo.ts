import { prisma } from "../../../../prisma/client.js";
import { ReportFilters } from "../../domain/report.types.js";
import { profitSql } from "../sql/profit.sql.js";

export const profitReportRepo = {
  summary: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      total_revenue: number;
      total_cogs: number;
      gross_profit: number;
      margin_pct: number;
    }>>(profitSql.summary(f));
  },

  byPeriod: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      period: Date;
      revenue: number;
      cogs: number;
      profit: number;
      margin_pct: number;
    }>>(profitSql.byPeriod(f));
  },

  byCategory: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      category_id: string;
      category_name: string;
      revenue: number;
      cogs: number;
      profit: number;
      margin_pct: number;
    }>>(profitSql.byCategory(f));
  },

  topProfitItems: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      item_id: string;
      item_name: string;
      revenue: number;
      cogs: number;
      profit: number;
      margin_pct: number;
      quantity: number;
    }>>(profitSql.topProfitItems(f));
  }
};
