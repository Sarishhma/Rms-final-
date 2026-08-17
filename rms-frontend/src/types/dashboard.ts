export interface ExecutiveSummary {
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
  gross_profit: number;
  margin_pct: number;
  todayOrders: {
    all_orders: number;
    active_orders: number;
    cancelled_orders: number;
    voided_orders: number;
    completed_orders: number;
  };}

export interface ExecutiveChartPoint {
  period: string;
  net_bill_amount: number;
  orders: number;
  avg_value: number;
}

export interface ExecutiveDashboardData {
  meta: { from: string; to: string };
  summary: ExecutiveSummary;
  rows: [];
  charts: ExecutiveChartPoint[];
  comparison: null;
}