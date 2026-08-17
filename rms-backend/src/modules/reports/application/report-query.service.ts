import { ReportFilters, ReportResponse } from "../domain/report.types.js";
import { salesReportRepo } from "../infrastructure/repositories/sales-report.repo.js";
import { orderReportRepo } from "../infrastructure/repositories/order-report.repo.js";
import { itemPerformanceRepo } from "../infrastructure/repositories/item-performance.repo.js";
import { staffPerformanceRepo } from "../infrastructure/repositories/staff-performance.repo.js";
import { paymentReportRepo } from "../infrastructure/repositories/payment-report.repo.js";
import { inventoryReportRepo } from "../infrastructure/repositories/inventory-report.repo.js";
import { profitReportRepo } from "../infrastructure/repositories/profit-report.repo.js";
import { auditRiskRepo } from "../infrastructure/repositories/audit-risk.repo.js";
import { cashReconciliationRepo } from "../infrastructure/repositories/cash-reconciliation.repo.js";
import { shiftReportRepo } from "../infrastructure/repositories/shift-report.repo.js";
import { executiveDashboardRepo } from "../infrastructure/repositories/executive-dashboard.repo.js";
import { reportBaseSql } from "../infrastructure/sql/report-base.sql.js";

const buildResponse = <T>(
  f: ReportFilters,
  reportKey: string,
  summary: any,
  rows: any[] = [],
  charts: any[] = [],
  comparison: any = null
): ReportResponse => ({
  meta: {
    reportKey,
    companyId: f.companyId,
    from: f.from.toISOString(),
    to: f.to.toISOString(),
    timezone: "UTC", // Could be injected from context
    generatedAt: new Date().toISOString(),
    filters: f as unknown as Record<string, unknown>
  },
  summary,
  rows,
  charts,
  comparison
});

const groupByDateHour = <T extends { date: Date; hour: number }>(rows: T[]) => {
  const map = new Map<string, any>();
  for (const { date, hour, ...rest } of rows) {
    const key = date.toISOString();
    const hourISO = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour)).toISOString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push({ hour: hourISO, ...rest });
  }
  return Array.from(map.entries()).map(([date, hours]) => ({ date, hours }));
};

export const reportQueryService = {
  getExecutiveDashboard: async (f: ReportFilters): Promise<ReportResponse> => {
    const kpis = await executiveDashboardRepo.getKPIs(f);
    const todayOrders = await executiveDashboardRepo.getTodayOrders(f.companyId);
    const inventorySummary = await inventoryReportRepo.summary(f);
    const salesTrends = await salesReportRepo.byPeriod(f);
    
    const summary = {
      ...(kpis[0] || {}),
      todayOrders: todayOrders[0] || {
        all_orders: 0,
        active_orders: 0,
        cancelled_orders: 0,
        voided_orders: 0,
        completed_orders: 0
      },
      low_stock: inventorySummary[0]?.total_low_stock || 0,
      total_item_in_stock: inventorySummary[0]?.total_items_tracked || 0
    };
    
    return buildResponse(f, "executive-dashboard", summary, [], salesTrends);
  },

  getSalesReport: async (f: ReportFilters): Promise<ReportResponse> => {
    const hourly = reportBaseSql.includeHourly(f.resolution);
    const [summaryRows, byPeriodRows, byHourRows, byStaffRows, byChannelRows, compRows] = await Promise.all([
      salesReportRepo.summary(f),
      salesReportRepo.byPeriod(f),
      hourly ? salesReportRepo.byHour(f) : Promise.resolve([]),
      salesReportRepo.byStaff(f),
      salesReportRepo.byChannel(f),
      salesReportRepo.periodComparison(f)
    ]);
    
    return buildResponse(f, "sales", summaryRows[0] || {}, byStaffRows, byPeriodRows, compRows[0]);
  },

  getOrderReport: async (f: ReportFilters): Promise<ReportResponse> => {
    const hourly = reportBaseSql.includeHourly(f.resolution);
    const [summaryRows, byPeriodRows, byHourRows, byChannelRows, fulfillmentRows] = await Promise.all([
      orderReportRepo.summary(f),
      orderReportRepo.byPeriod(f),
      hourly ? orderReportRepo.byHour(f) : Promise.resolve([]),
      orderReportRepo.byChannel(f),
      orderReportRepo.avgFulfillmentTime(f)
    ]);

    return buildResponse(f, "orders", { ...(summaryRows[0] || {}), fulfillment: fulfillmentRows[0] }, byChannelRows, byPeriodRows);
  },

  getItemPerformanceReport: async (f: ReportFilters): Promise<ReportResponse> => {
    const hourly = reportBaseSql.includeHourly(f.resolution);
    const [summaryRows, byPeriodRows, byHourRows, byCategoryRows, topItems, bottomItems, neverOrdered] = await Promise.all([
      itemPerformanceRepo.summary(f),
      itemPerformanceRepo.byPeriod(f),
      hourly ? itemPerformanceRepo.byHour(f) : Promise.resolve([]),
      itemPerformanceRepo.byCategory(f),
      itemPerformanceRepo.topItems(f),
      itemPerformanceRepo.bottomItems(f),
      itemPerformanceRepo.neverOrdered(f)
    ]);

    return buildResponse(f, "item-performance", summaryRows[0] || {}, topItems, byPeriodRows, { bottomItems, neverOrdered, byCategory: byCategoryRows });
  },

  getStaffPerformanceReport: async (f: ReportFilters): Promise<ReportResponse> => {
    const [summaryRows, staffRows, byPhaseRows] = await Promise.all([
      staffPerformanceRepo.summary(f),
      staffPerformanceRepo.byStaff(f),
      staffPerformanceRepo.staffByPhase(f)
    ]);

    return buildResponse(f, "staff-performance", summaryRows[0] || {}, staffRows, byPhaseRows);
  },

  getPaymentReport: async (f: ReportFilters): Promise<ReportResponse> => {
    const hourly = reportBaseSql.includeHourly(f.resolution);
    const [summaryRows, byPeriodRows, byHourRows, byMethodRows, byStaffRows] = await Promise.all([
      paymentReportRepo.summary(f),
      paymentReportRepo.byPeriod(f),
      hourly ? paymentReportRepo.byHour(f) : Promise.resolve([]),
      paymentReportRepo.byMethod(f),
      paymentReportRepo.byStaff(f)
    ]);

    return buildResponse(f, "payments", summaryRows[0] || {}, byMethodRows, byPeriodRows, { byStaff: byStaffRows });
  },

  getInventoryReport: async (f: ReportFilters): Promise<ReportResponse> => {
    const [summaryRows, byCategoryRows, criticalStockRows, txRows] = await Promise.all([
      inventoryReportRepo.summary(f),
      inventoryReportRepo.byCategory(f),
      inventoryReportRepo.criticalStock(f),
      inventoryReportRepo.transactions(f)
    ]);

    return buildResponse(f, "inventory", { ...(summaryRows[0] || {}), transactions: txRows[0] }, criticalStockRows, byCategoryRows);
  },

  getProfitReport: async (f: ReportFilters): Promise<ReportResponse> => {
    const [summaryRows, byPeriodRows, byCategoryRows, topProfitItemsRows] = await Promise.all([
      profitReportRepo.summary(f),
      profitReportRepo.byPeriod(f),
      profitReportRepo.byCategory(f),
      profitReportRepo.topProfitItems(f)
    ]);

    return buildResponse(f, "profit", summaryRows[0] || {}, topProfitItemsRows, byPeriodRows, { byCategory: byCategoryRows });
  },

  getAuditRiskReport: async (f: ReportFilters): Promise<ReportResponse> => {
    const hourly = reportBaseSql.includeHourly(f.resolution);
    const [summaryRows, byPeriodRows, byHourRows, byActionRows, byEntityRows, byStaffRows] = await Promise.all([
      auditRiskRepo.summary(f),
      auditRiskRepo.byPeriod(f),
      hourly ? auditRiskRepo.byHour(f) : Promise.resolve([]),
      auditRiskRepo.byAction(f),
      auditRiskRepo.byEntity(f),
      auditRiskRepo.byStaff(f)
    ]);

    return buildResponse(f, "audit-risk", summaryRows[0] || {}, byActionRows, byPeriodRows, { byEntity: byEntityRows, byStaff: byStaffRows });
  },

  getShiftReport: async (f: ReportFilters): Promise<ReportResponse> => {
    const [summaryRows, listRows] = await Promise.all([
      shiftReportRepo.summary(f),
      shiftReportRepo.shiftList(f)
    ]);

    return buildResponse(f, "shifts", summaryRows[0] || {}, listRows);
  },

  getCashReconciliationReport: async (f: ReportFilters): Promise<ReportResponse> => {
    const [summaryRows, listRows] = await Promise.all([
      cashReconciliationRepo.summary(f),
      cashReconciliationRepo.shiftWiseReconciliation(f)
    ]);

    return buildResponse(f, "cash-reconciliation", summaryRows[0] || {}, listRows);
  }
};
