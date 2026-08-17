export type Resolution = "day" | "week" | "month";

export interface SalesReportResponse {
  success: boolean;
  data: SalesReportData;
}
export interface SalesReportData {
  meta: ReportMeta;
  summary: SalesSummary;
  rows: StaffRow[];
  charts: ChartPoint[];
  comparison: Comparison;
}
export interface ReportMeta {
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
export interface SalesSummary {
  gross_sales: number;
  discount: number;
  tax_collected?: number;
  net_bill_amount: number;
  total_orders: number;
  avg_order_value: number;
  max_order_value: number;
  min_order_value: number;
}
export interface StaffRow {
  staff_id: string;
  staff_name: string;
  net_bill_amount: number;
  orders: number;
  avg_value: number;
}
export interface ChartPoint {
  period: string;
  net_bill_amount: number;
  orders: number;
  avg_value: number;
}
export interface Comparison {
  current_revenue: number;
  previous_revenue: number;
  current_orders: number;
  previous_orders: number;
}