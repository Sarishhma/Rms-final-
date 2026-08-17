import type { Context } from "hono";
import { getValidated } from "../../../middleware/validate.js";
import { reportQueryService } from "../application/report-query.service.js";
import { reportExportService } from "../application/report-export.service.js";
import { reportPermissionService } from "../application/report-permission.service.js";
import { getCompanyId } from "../../../utils/context.js";
import { ReportFilters, ReportResponse } from "../domain/report.types.js";
import { addDays, startOfDay } from "../../../utils/dates.js";
import { badRequest } from "../../../utils/app-error.js";

const buildFilters = (input: any): ReportFilters => {
  const companyId = getCompanyId();
  if (!companyId) throw new Error("Missing tenant context");

  const to = input.to ?? addDays(startOfDay(new Date()), 1);
  const from = input.from ?? addDays(to, -30);

  return {
    ...input,
    companyId,
    from,
    to,
    resolution: input.resolution || "day",
    limit: input.limit ?? 10
  };
};

// Row-shaped reports that make sense as a flat table export (CSV / PDF / Excel).
const loadReport = (type: string | undefined, filters: ReportFilters): Promise<ReportResponse> => {
  switch (type) {
    case "sales": return reportQueryService.getSalesReport(filters);
    case "orders": return reportQueryService.getOrderReport(filters);
    case "items": return reportQueryService.getItemPerformanceReport(filters);
    case "staff": return reportQueryService.getStaffPerformanceReport(filters);
    case "payments": return reportQueryService.getPaymentReport(filters);
    case "inventory": return reportQueryService.getInventoryReport(filters);
    case "profit": return reportQueryService.getProfitReport(filters);
    case "audit-risk": return reportQueryService.getAuditRiskReport(filters);
    case "shifts": return reportQueryService.getShiftReport(filters);
    case "cash-reconciliation": return reportQueryService.getCashReconciliationReport(filters);
    case "executive-dashboard": return reportQueryService.getExecutiveDashboard(filters);
    default: throw badRequest("Unsupported report type");
  }
};

export const reportExportController = {
  /**
   * Unified export handler — GET /:type/export/:format
   * Supported formats: csv, pdf, excel
   */
  export: async (c: Context) => {
    const type = c.req.param("type");
    const format = c.req.param("format");

    reportPermissionService.assertAccess(c.get("authUser").role, type);

    const filters = buildFilters(getValidated(c, "query") as any);
    const report = await loadReport(type, filters);

    const fromDate = new Date(report.meta?.from || filters.from).toISOString().split("T")[0];
    const toDate = new Date(report.meta?.to || filters.to).toISOString().split("T")[0];
    const baseFilename = `${type}-report-${fromDate}-${toDate}`;

    switch (format) {
      case "csv": {
        const csv = reportExportService.toCsv(report);
        c.header("Content-Type", "text/csv; charset=utf-8");
        c.header("Content-Disposition", `attachment; filename="${baseFilename}.csv"`);
        return c.body(csv);
      }
      case "pdf": {
        const pdf = await reportExportService.toPdf(report);
        c.header("Content-Type", "application/pdf");
        c.header("Content-Disposition", `attachment; filename="${baseFilename}.pdf"`);
        return c.body(new Uint8Array(pdf));
      }
      case "excel": {
        const excel = reportExportService.toExcel(report);
        c.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        c.header("Content-Disposition", `attachment; filename="${baseFilename}.xlsx"`);
        return c.body(new Uint8Array(excel));
      }
      default:
        throw badRequest(`Unsupported export format "${format}". Use: csv, pdf, excel`);
    }
  }
};
