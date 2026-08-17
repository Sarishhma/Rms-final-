import { prisma } from "../../../../prisma/client.js";
import { ReportFilters } from "../../domain/report.types.js";
import { orderSql } from "../sql/order.sql.js";

export const orderReportRepo = {
  summary: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      total_orders: number;
      completed_orders: number;
      cancelled_orders: number;
      voided_orders: number;
      pending_orders: number;
      avg_order_value: number;
      max_order_value: number;
      min_order_value: number;
      avg_guest_count: number;
      avg_items_per_order: number;
      cancellation_rate: number;
    }>>(orderSql.summary(f));
  },

  byPeriod: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      period: Date;
      orders: number;
      revenue: number;
      cancelled: number;
      cancellation_rate: number;
    }>>(orderSql.byPeriod(f));
  },

  byHour: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      date: Date;
      hour: number;
      orders: number;
      revenue: number;
    }>>(orderSql.byHour(f));
  },

  byChannel: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      channel: string;
      orders: number;
      revenue: number;
      avg_value: number;
      cancellation_rate: number;
    }>>(orderSql.byChannel(f));
  },

  avgFulfillmentTime: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      avg_minutes: number;
      min_minutes: number;
      max_minutes: number;
    }>>(orderSql.avgFulfillmentTime(f));
  }
};
