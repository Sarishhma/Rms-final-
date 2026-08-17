import type { MiddlewareHandler } from "hono";
import type { AppBindings } from "../types.js";
import { forbidden } from "../utils/app-error.js";
import type { Permission } from "../modules/rbac/types.js";
import { hasPermission } from "../modules/rbac/service.js";

export const requirePermission =
  (permission: Permission): MiddlewareHandler<AppBindings> =>
  async (c, next) => {
    const user = c.get("authUser");

    if (!hasPermission(user.role, permission)) {
      console.warn(`[RBAC] user=${user.id} role=${user.role} denied permission=${permission}`);
      throw forbidden("You do not have permission to perform this action");
    }

    await next();
  };
