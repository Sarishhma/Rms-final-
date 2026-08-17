import { Hono } from "hono";
import type { AppBindings } from "../../types.js";
import { requirePermission } from "../../middleware/rbac.js";
import { rbacController } from "./controller.js";

export const rbacRoutes = new Hono<AppBindings>();

rbacRoutes.get("/permissions", requirePermission("user:manage"), rbacController.listPermissions);
