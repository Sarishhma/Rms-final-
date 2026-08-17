import { Hono } from "hono";
import type { AppBindings } from "../../types.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { tableController } from "./controller.js";
import {
  assignOrderSchema,
  createTableSchema,
  listTablesSchema,
  tableCombineSchema,
  tableIdParamSchema,
  tableSplitSchema,
  tableSwapSchema,
  updateTableSchema,
} from "./schema.js";

export const tableRoutes = new Hono<AppBindings>();

// ─── Core CRUD ────────────────────────────────────────────────────────────────
tableRoutes.get("/",         requirePermission("table:read"),  validate("query", listTablesSchema),   tableController.list);
tableRoutes.get("/occupied", requirePermission("table:read"),                                         tableController.occupied);
tableRoutes.post("/",        requirePermission("table:write"), validate("json",  createTableSchema),  tableController.create);
tableRoutes.patch("/:id",    requirePermission("table:write"), validate("param", tableIdParamSchema), validate("json", updateTableSchema), tableController.update);
tableRoutes.delete("/:id",   requirePermission("table:write"), validate("param", tableIdParamSchema), tableController.remove);
tableRoutes.post("/:id/release", requirePermission("table:write"), validate("param", tableIdParamSchema), tableController.release);

// ─── Seat an order on a table (table → order: create new or attach existing) ───
tableRoutes.post("/:id/order", requirePermission("order:write"), validate("param", tableIdParamSchema), validate("json", assignOrderSchema), tableController.assignOrder);

// ─── Swap ─────────────────────────────────────────────────────────────────────
tableRoutes.post("/swap",             requirePermission("table:write"), validate("json",  tableSwapSchema),         tableController.swap);

// ─── Combine ──────────────────────────────────────────────────────────────────
tableRoutes.post("/combine",          requirePermission("table:write"), validate("json",  tableCombineSchema),   tableController.combine);

// ─── Split ────────────────────────────────────────────────────────────────────
tableRoutes.post("/split",            requirePermission("table:write"), validate("json",  tableSplitSchema),     tableController.split);
