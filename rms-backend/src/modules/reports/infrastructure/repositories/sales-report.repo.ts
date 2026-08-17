import { prisma } from "../../../../prisma/client.js";
import { ReportFilters } from "../../domain/report.types.js";
import { salesSql } from "../sql/sales.sql.js";

export const salesReportRepo = {
  summary: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      gross_sales: number;
      discount: number;
      net_bill_amount: number;
      total_orders: number;
      avg_order_value: number;
      max_order_value: number;
      min_order_value: number;
    }>>(salesSql.summary(f));
  },

  byPeriod: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      period: Date;
      net_bill_amount: number;
      orders: number;
      avg_value: number;
    }>>(salesSql.byPeriod(f));
  },

  byHour: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      date: Date;
      hour: number;
      net_bill_amount: number;
      orders: number;
    }>>(salesSql.byHour(f));
  },

  byStaff: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      staff_id: string;
      staff_name: string | null;
      net_bill_amount: number;
      orders: number;
      avg_value: number;
    }>>(salesSql.byStaff(f));
  },

  byChannel: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      channel: string;
      net_bill_amount: number;
      orders: number;
    }>>(salesSql.byChannel(f));
  },

  periodComparison: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      current_revenue: number;
      previous_revenue: number;
      current_orders: number;
      previous_orders: number;
    }>>(salesSql.periodComparison(f));
  }
};
