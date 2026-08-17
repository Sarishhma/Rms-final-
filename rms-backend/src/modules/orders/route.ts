import { Hono } from "hono";
import type { AppBindings } from "../../types.js";
import { idempotency } from "../../middleware/idempotency.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { orderController } from "./controller.js";
import { createOrderSchema, listOrdersSchema, orderIdParamSchema, orderActionSchema, updateOrderSchema } from "./schema.js";

export const orderRoutes = new Hono<AppBindings>();

orderRoutes.get("/", requirePermission("order:read"), validate("query", listOrdersSchema), orderController.list);
orderRoutes.get("/:id", requirePermission("order:read"), validate("param", orderIdParamSchema), orderController.get);
orderRoutes.post("/", idempotency, requirePermission("order:write"), validate("json", createOrderSchema), orderController.create);
orderRoutes.patch("/:id", requirePermission("order:write"), validate("param", orderIdParamSchema), validate("json", updateOrderSchema), orderController.update);

// Single endpoint for state transitions (CONFIRM, CANCEL, VOID)
orderRoutes.post(
  "/:id/action", 
  idempotency, 
  requirePermission("order:write"), 
  validate("param", orderIdParamSchema), 
  validate("json", orderActionSchema), 
  orderController.action
);
