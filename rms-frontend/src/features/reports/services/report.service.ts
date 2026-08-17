// services/report.service.ts
import api from "@/lib/client";
import type { SalesReportData } from "@/features/reports/types/salesReport";
import type { ItemReportData } from "@/features/reports/types/itemsReport";
import type { OrderReportData } from "@/features/reports/types/orderReport";
import type { StaffReportData } from "@/features/reports/types/staffReport";
import type { Resolution } from "@/features/reports/types/resolution";
import type { ExecutiveDashboardData } from "@/types/dashboard";
import type { PaymentReportData } from "@/features/reports/types/paymentReport";

export interface ReportParams {
  from: string;
  to: string;
  resolution?: Resolution;
  limit?: number;
  staffId?: string;
  categoryId?: string;
  channel?: string;
}

interface ReportDataMap {
  sales: SalesReportData;
  items: ItemReportData;
  orders: OrderReportData;
  staff: StaffReportData;
  payments: PaymentReportData;
  dashboard: ExecutiveDashboardData;
}

export type ReportType = keyof ReportDataMap;

async function getReport<T extends ReportType>(
  type: T,
  params: ReportParams,
): Promise<ReportDataMap[T]> {
  const res = await api.get<{ success: boolean; data: ReportDataMap[T] }>(
    `/api/reports/${type}`,
    { params },
  );
  return res.data.data;
}

export const reportService = {
  getReport,
  getSales: (params: ReportParams) => getReport("sales", params),
  getItems: (params: ReportParams) => getReport("items", params),
  getOrders: (params: ReportParams) => getReport("orders", params),
  getStaff: (params: ReportParams) => getReport("staff", params),
  getPayments: (params: ReportParams) => getReport("payments", params),
  getDashboard: (params: ReportParams) => getReport("dashboard", params),
};
