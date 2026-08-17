import type { Context } from "hono";
import { getValidated } from "../../../middleware/validate.js";
import { ok } from "../../../utils/response.js";
import { badRequest } from "../../../utils/app-error.js";
import { getCompanyId } from "../../../utils/context.js";
import { reportQueryService } from "../application/report-query.service.js";
import { reportPermissionService } from "../application/report-permission.service.js";
import { ReportFilters } from "../domain/report.types.js";
import { addDays, startOfDay } from "../../../utils/dates.js";

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

export const reportsController = {
  getReport: async (c: Context) => {
    const type = c.req.param("type");

    // The route guards a baseline `report:read`; financial/management report
    // types additionally require `report:financial:read` (ADMIN/MASTER only).
    reportPermissionService.assertAccess(c.get("authUser").role, type);

    const input = getValidated(c, "query") as any; // Using custom validation mapping

    // In actual implementation, we might validate using reportFilterSchema in the route definition
    // For now we map it manually
    const filters = buildFilters(input);

    switch (type) {
      case "dashboard": {
        // Ensure at least 24 hours of data for the dashboard
        const MS_24H = 24 * 60 * 60 * 1000;
        if (filters.to.getTime() - filters.from.getTime() < MS_24H) {
          filters.from = new Date(filters.to.getTime() - MS_24H);
        }
        return ok(c, await reportQueryService.getExecutiveDashboard(filters));
      }
      case "sales": return ok(c, await reportQueryService.getSalesReport(filters));
      case "orders": return ok(c, await reportQueryService.getOrderReport(filters));
      case "items": return ok(c, await reportQueryService.getItemPerformanceReport(filters));
      case "staff": return ok(c, await reportQueryService.getStaffPerformanceReport(filters));
      case "payments": return ok(c, await reportQueryService.getPaymentReport(filters));
      case "inventory": return ok(c, await reportQueryService.getInventoryReport(filters));
      case "profit": return ok(c, await reportQueryService.getProfitReport(filters));
      case "audit": return ok(c, await reportQueryService.getAuditRiskReport(filters));
      case "shifts": return ok(c, await reportQueryService.getShiftReport(filters));
      case "cash-reconciliation": return ok(c, await reportQueryService.getCashReconciliationReport(filters));
      default: throw badRequest("Invalid report type");
    }
  }
};
