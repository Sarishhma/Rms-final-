import { Hono } from "hono";
import type { AppBindings } from "../../types.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { customerController } from "./controller.js";
import {
  createCustomerSchema,
  customerIdParamSchema,
  listCustomersSchema,
  lookupCustomerSchema,
  updateCustomerSchema
} from "./schema.js";

export const customerRoutes = new Hono<AppBindings>();

customerRoutes.get("/", requirePermission("customer:read"), validate("query", listCustomersSchema), customerController.list);
customerRoutes.get("/lookup", requirePermission("customer:read"), validate("query", lookupCustomerSchema), customerController.lookup);
customerRoutes.get("/:id", requirePermission("customer:read"), validate("param", customerIdParamSchema), customerController.get);
customerRoutes.post("/", requirePermission("customer:write"), validate("json", createCustomerSchema), customerController.create);
customerRoutes.patch("/:id", requirePermission("customer:write"), validate("param", customerIdParamSchema), validate("json", updateCustomerSchema), customerController.update);
customerRoutes.delete("/:id", requirePermission("customer:write"), validate("param", customerIdParamSchema), customerController.remove);
