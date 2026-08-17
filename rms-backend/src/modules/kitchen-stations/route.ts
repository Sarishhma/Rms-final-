import { Hono } from "hono";
import { AppBindings } from "../../types.js";
import { kitchenStationController } from "./controller.js";
import {
  assignRoutesSchema,
  createKitchenStationSchema,
  kitchenStationIdParamSchema,
  listKitchenStationsSchema,
  updateKitchenStationSchema,
} from "./schema.js";
import { validate } from "../../middleware/validate.js";
import { requirePermission } from "../../middleware/rbac.js";

export const kitchenStationRoutes = new Hono<AppBindings>();

kitchenStationRoutes.get("/", requirePermission("kitchen-station:read"), validate("query", listKitchenStationsSchema), kitchenStationController.list);

// Effective backend-resolved routing for every menu item. Static path — must be
// registered before "/:id" so it is not captured by the id param.
kitchenStationRoutes.get("/routing", requirePermission("kitchen-station:read"), kitchenStationController.routing);

kitchenStationRoutes.get("/:id", requirePermission("kitchen-station:read"), validate("param", kitchenStationIdParamSchema), kitchenStationController.get);

kitchenStationRoutes.get("/:id/assignments", requirePermission("kitchen-station:read"), validate("param", kitchenStationIdParamSchema), kitchenStationController.getAssignments);

kitchenStationRoutes.post("/", requirePermission("kitchen-station:write"), validate("json", createKitchenStationSchema), kitchenStationController.create);

kitchenStationRoutes.patch("/:id", requirePermission("kitchen-station:write"), validate("param", kitchenStationIdParamSchema), validate("json", updateKitchenStationSchema), kitchenStationController.update);

kitchenStationRoutes.post("/:id/default", requirePermission("kitchen-station:write"), validate("param", kitchenStationIdParamSchema), kitchenStationController.setDefault);

kitchenStationRoutes.put("/:id/assignments", requirePermission("kitchen-station:write"), validate("param", kitchenStationIdParamSchema), validate("json", assignRoutesSchema), kitchenStationController.assignRoutes);

kitchenStationRoutes.delete("/:id", requirePermission("kitchen-station:write"), validate("param", kitchenStationIdParamSchema), kitchenStationController.remove);
