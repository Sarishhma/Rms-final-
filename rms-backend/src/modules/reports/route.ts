import { Hono } from "hono";
import type { AppBindings } from "../../types.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { reportsController } from "./presentation/reports.controller.js";
import { reportExportController } from "./presentation/report-export.controller.js";
import { reportFilterSchema } from "./dto/report-filter.dto.js";

export const reportRoutes = new Hono<AppBindings>();

reportRoutes.get(
  "/:type",
  requirePermission("report:read"),
  validate("query", reportFilterSchema),
  reportsController.getReport
);

reportRoutes.get(
  "/:type/export/:format",
  requirePermission("report:read"),
  validate("query", reportFilterSchema),
  reportExportController.export
);
