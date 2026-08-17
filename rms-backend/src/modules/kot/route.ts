import { Hono } from "hono";
import type { AppBindings } from "../../types.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { kotController } from "./controller.js";
import { fireKotItemsSchema, kotIdParamSchema, kotItemIdParamSchema, kotOrderIdParamSchema, listKotSchema, updateKotStatusSchema } from "./schema.js";

export const kotRoutes = new Hono<AppBindings>();

kotRoutes.get("/", requirePermission("kot:read"), validate("query", listKotSchema), kotController.list);
kotRoutes.patch("/items/:itemId/status", requirePermission("kot:write"), validate("param", kotItemIdParamSchema), validate("json", updateKotStatusSchema), kotController.updateItemStatus);
kotRoutes.post("/orders/:orderId/fire", requirePermission("kot:write"), validate("param", kotOrderIdParamSchema), validate("json", fireKotItemsSchema), kotController.fireOrderItems);
kotRoutes.get("/orders/:orderId", requirePermission("kot:read"), validate("param", kotOrderIdParamSchema), kotController.listByOrder);
kotRoutes.get("/order/:orderId", requirePermission("kot:read"), validate("param", kotOrderIdParamSchema), kotController.listByOrder);
kotRoutes.get("/:id", requirePermission("kot:read"), validate("param", kotIdParamSchema), kotController.get);
kotRoutes.patch("/:id/status", requirePermission("kot:write"), validate("param", kotIdParamSchema), validate("json", updateKotStatusSchema), kotController.updateStatus);
