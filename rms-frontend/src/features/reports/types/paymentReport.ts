// ─── Payment Report Types ────────────────────────────────────────────────────

export interface PaymentReportMeta {
  reportKey: "payments";
  companyId: string;
  from: string; // ISO 8601
  to: string;
  timezone: string;
  generatedAt: string;
  filters: {
    from: string;
    to: string;
    resolution: "day" | "week" | "month";
    companyId: string;
    limit: number;
  };
}

export interface PaymentReportSummary {
  total_received: number;
  total_payments: number;
  avg_payment: number;
  total_refunded: number;
  total_refunds: number;
  net_revenue: number;
}

/** One row per payment method breakdown */
export interface PaymentMethodRow {
  method: "CARD" | "QR" | "CASH" | "BANK_TRANSFER" | string;
  count: number;
  amount: number;
  percentage: number;
}

export interface PaymentChartPoint {
  period: string; // ISO 8601
  count: number;
  amount: number;
}

export interface PaymentStaffBreakdown {
  staff_id: string;
  staff_name: string;
  count: number;
  amount: number;
}

export interface PaymentReportComparison {
  byStaff: PaymentStaffBreakdown[];
}

export interface PaymentReportData {
  meta: PaymentReportMeta;
  summary: PaymentReportSummary;
  rows: PaymentMethodRow[];
  charts: PaymentChartPoint[];
  comparison: PaymentReportComparison;
}

export interface PaymentReportResponse {
  success: boolean;
  data: PaymentReportData;
}

export interface PaymentReportFilters {
  from: string;
  to: string;
  resolution?: "day" | "week" | "month";
  limit?: number;
}