import { Hono } from "hono";
import type { AppBindings } from "../../types.js";
import { idempotency } from "../../middleware/idempotency.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { shiftController } from "./controller.js";
import {
  cashDrawerEventSchema,
  closeShiftSchema,
  listShiftsSchema,
  openShiftSchema,
  shiftIdParamSchema
} from "./schema.js";

export const shiftRoutes = new Hono<AppBindings>();

shiftRoutes.get("/", requirePermission("shift:read"), validate("query", listShiftsSchema), shiftController.list);
shiftRoutes.get("/current", requirePermission("shift:read"), shiftController.current);
shiftRoutes.get("/:id", requirePermission("shift:read"), validate("param", shiftIdParamSchema), shiftController.get);
shiftRoutes.get("/:id/z-report", requirePermission("shift:read"), validate("param", shiftIdParamSchema), shiftController.zReport);
shiftRoutes.post("/open", idempotency, requirePermission("shift:write"), validate("json", openShiftSchema), shiftController.open);
shiftRoutes.post(
  "/:id/close",
  idempotency,
  requirePermission("shift:write"),
  validate("param", shiftIdParamSchema),
  validate("json", closeShiftSchema),
  shiftController.close
);
shiftRoutes.post(
  "/:id/cash-events",
  idempotency,
  requirePermission("shift:write"),
  validate("param", shiftIdParamSchema),
  validate("json", cashDrawerEventSchema),
  shiftController.addCashEvent
);
