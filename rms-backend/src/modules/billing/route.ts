import { Hono } from "hono";
import type { AppBindings } from "../../types.js";
import { idempotency } from "../../middleware/idempotency.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { billingController } from "./controller.js";
import { billIdParamSchema, generateBillSchema, listBillsSchema } from "./schema.js";

export const billingRoutes = new Hono<AppBindings>();

billingRoutes.get("/", requirePermission("bill:read"), validate("query", listBillsSchema), billingController.list);
billingRoutes.get("/:id", requirePermission("bill:read"), validate("param", billIdParamSchema), billingController.get);
billingRoutes.post("/", idempotency, requirePermission("bill:write"), validate("json", generateBillSchema), billingController.generate);
