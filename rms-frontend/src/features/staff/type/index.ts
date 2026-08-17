// types/staff.report.type.
export type Resolution = "day" | "week" | "month";

export interface StaffReportData {
  meta: StaffReportMeta;
  summary: StaffSummary;
  rows: StaffRow[];
  charts: StaffChartPoint[];
  comparison: null;
}

export interface StaffReportMeta {
  reportKey: string;
  companyId: string;
  from: string;
  to: string;
  timezone: string;
  generatedAt: string;
  filters: {
    from: string;
    to: string;
    resolution: string;
    companyId: string;
    limit: number;
  };
}

export interface StaffSummary {
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
}

export interface StaffRow {
  staff_id: string;
  staff_name: string;
  staff_role: string;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  voided_orders: number;
  draft_orders: number;
  cancellation_rate: number;
  total_revenue: number | null;
  avg_order_value: number | null;
  max_order_value: number | null;
  min_order_value: number | null;
  total_discount_given: number | null;
  total_items_sold: number;
  total_guests_served: number;
  avg_items_per_order: number | null;
  avg_guests_per_order: number | null;
  avg_fulfillment_minutes: number | null;
  dine_in_orders: number;
  takeaway_orders: number;
  delivery_orders: number;
}

export interface StaffChartPoint {
  staff_id: string;
  staff_name: string;
  period: string;
  orders: number;
  revenue: number | null;
}