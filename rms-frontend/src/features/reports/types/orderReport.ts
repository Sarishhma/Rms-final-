export type Resolution = "day" | "week" | "month";

export interface OrderReportData {
  meta: OrderReportMeta;
  summary: OrderSummary;
  rows: OrderChannelRow[];
  charts: OrderChartPoint[];
  comparison: null; 
}

export interface OrderReportMeta {
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

export interface OrderSummary {
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  voided_orders: number;
  pending_orders: number;
  avg_order_value: number | null;
  max_order_value: number | null;
  min_order_value: number | null;
  avg_guest_count: number | null;
  avg_items_per_order: number | null;
  cancellation_rate: number;
  fulfillment: {
    avg_minutes: number | null;
    min_minutes: number | null;
    max_minutes: number | null;
  };
}

export interface OrderChannelRow {
  channel: string;
  orders: number;
  revenue: number | null;
  avg_value: number | null;
  cancellation_rate: number;
}

export interface OrderChartPoint {
  period: string;
  orders: number;
  revenue: number | null;
  cancelled: number;
  cancellation_rate: number;
}