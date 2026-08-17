import { prisma } from "../../../../prisma/client.js";
import { ReportFilters } from "../../domain/report.types.js";
import { staffSql } from "../sql/staff.sql.js";

export const staffPerformanceRepo = {
  summary: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      total_staff: number;
      total_orders: number;
      total_revenue: number;
      avg_orders_per_staff: number;
      avg_revenue_per_staff: number;
      highest_staff_revenue: number;
      lowest_staff_revenue: number;
      total_cancelled: number;
      total_voided: number;
      overall_cancellation_rate: number;
      total_items_sold: number;
      total_guests_served: number;
    }>>(staffSql.summary(f));
  },

  byPeriod: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      period: Date;
      orders: number;
      revenue: number;
    }>>(staffSql.byPeriod(f));
  },

  byStaff: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      staff_id: string;
      staff_name: string | null;
      staff_role: string | null;
      total_orders: number;
      completed_orders: number;
      cancelled_orders: number;
      voided_orders: number;
      cancellation_rate: number;
      total_revenue: number;
      avg_order_value: number;
      max_order_value: number;
      min_order_value: number;
      total_discount_given: number;
      total_items_sold: number;
      total_guests_served: number;
      avg_items_per_order: number;
      avg_guests_per_order: number;
      avg_fulfillment_minutes: number;
      dine_in_orders: number;
      takeaway_orders: number;
      delivery_orders: number;
    }>>(staffSql.byStaff(f));
  },

  staffPayments: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      staff_id: string;
      staff_name: string | null;
      total_collected: number;
      payment_count: number;
      cash_collected: number;
      qr_collected: number;
      card_collected: number;
      refunds_processed: number;
      refund_amount: number;
      net_collected: number;
    }>>(staffSql.staffPayments(f));
  },

  staffTopItems: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      staff_id: string;
      staff_name: string | null;
      item_id: string;
      item_name: string | null;
      quantity: number;
      sales: number;
      rank: number;
    }>>(staffSql.staffTopItems(f));
  },

  staffByPhase: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      staff_id: string;
      staff_name: string | null;
      period: Date;
      orders: number;
      revenue: number;
    }>>(staffSql.staffByPhase(f));
  },

  staffAuditActivity: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      staff_id: string;
      staff_name: string | null;
      total_actions: number;
      order_cancels: number;
      order_voids: number;
      discounts_applied: number;
      payment_voids: number;
      refunds_created: number;
    }>>(staffSql.staffAuditActivity(f));
  }
};
