import { prisma } from "../../../../prisma/client.js";
import { ReportFilters } from "../../domain/report.types.js";
import { paymentSql } from "../sql/payment.sql.js";

export const paymentReportRepo = {
  summary: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      total_received: number;
      total_refunded: number;
      net_revenue: number;
      avg_payment: number;
      total_payments: number;
      total_refunds: number;
    }>>(paymentSql.summary(f));
  },

  byPeriod: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      period: Date;
      amount: number;
      count: number;
    }>>(paymentSql.byPeriod(f));
  },

  byHour: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      date: Date;
      hour: number;
      amount: number;
      count: number;
    }>>(paymentSql.byHour(f));
  },

  byMethod: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      method: string;
      amount: number;
      count: number;
      percentage: number;
    }>>(paymentSql.byMethod(f));
  },

  byStaff: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      staff_id: string;
      staff_name: string | null;
      amount: number;
      count: number;
    }>>(paymentSql.byStaff(f));
  }
};
