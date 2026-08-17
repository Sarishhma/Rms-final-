import { Hono } from "hono";
import type { AppBindings } from "../../types.js";
import { idempotency } from "../../middleware/idempotency.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { refundController } from "./controller.js";
import {
  createRefundSchema,
  listRefundsSchema,
  refundIdParamSchema,
  voidRefundSchema
} from "./schema.js";

export const refundRoutes = new Hono<AppBindings>();

refundRoutes.get("/", requirePermission("refund:read"), validate("query", listRefundsSchema), refundController.list);
refundRoutes.get("/:id", requirePermission("refund:read"), validate("param", refundIdParamSchema), refundController.get);
refundRoutes.post("/", idempotency, requirePermission("refund:write"), validate("json", createRefundSchema), refundController.create);
refundRoutes.post("/:id/void", idempotency, requirePermission("refund:write"), validate("param", refundIdParamSchema), validate("json", voidRefundSchema), refundController.void);
