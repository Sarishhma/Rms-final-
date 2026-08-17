import { Hono } from "hono";
import type { AppBindings } from "../../types.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { stockController } from "./controller.js";
import { adjustStockSchema, listStockSchema, openStockSchema, stockIdParamSchema } from "./schema.js";

export const stockRoutes = new Hono<AppBindings>();

stockRoutes.get("/", requirePermission("stock:read"), validate("query", listStockSchema), stockController.list);
stockRoutes.post("/open", requirePermission("stock:write"), validate("json", openStockSchema), stockController.open);
stockRoutes.patch("/open", requirePermission("stock:write"), validate("json", openStockSchema), stockController.updateOpening);
stockRoutes.patch("/:id/adjust", requirePermission("stock:write"), validate("param", stockIdParamSchema), validate("json", adjustStockSchema), stockController.adjust);
