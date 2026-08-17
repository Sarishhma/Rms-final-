import { Hono } from "hono";
import type { AppBindings } from "../../types.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { taxConfigController } from "./controller.js";
import { updateTaxConfigSchema } from "./schema.js";

export const taxConfigRoutes = new Hono<AppBindings>();

taxConfigRoutes.get("/", requirePermission("tax:read"), taxConfigController.get);
taxConfigRoutes.put(
  "/",
  requirePermission("tax:write"),
  validate("json", updateTaxConfigSchema),
  taxConfigController.update
);
