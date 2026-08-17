import { Hono } from "hono";
import type { AppBindings } from "../../types.js";
import { idempotency } from "../../middleware/idempotency.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { paymentController } from "./controller.js";
import { createPaymentSchema, listPaymentsSchema, paymentIdParamSchema, voidPaymentSchema } from "./schema.js";

export const paymentRoutes = new Hono<AppBindings>();

paymentRoutes.get("/", requirePermission("payment:read"), validate("query", listPaymentsSchema), paymentController.list);
paymentRoutes.post("/", idempotency, requirePermission("payment:write"), validate("json", createPaymentSchema), paymentController.create);
paymentRoutes.post("/:id/void", idempotency, requirePermission("payment:write"), validate("param", paymentIdParamSchema), validate("json", voidPaymentSchema), paymentController.void);
