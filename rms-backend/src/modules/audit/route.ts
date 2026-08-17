import { Hono } from "hono";
import type { AppBindings } from "../../types.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { auditController } from "./controller.js";
import { listAuditSchema } from "./schema.js";

export const auditRoutes = new Hono<AppBindings>();

auditRoutes.get("/", requirePermission("audit:read"), validate("query", listAuditSchema), auditController.list);
