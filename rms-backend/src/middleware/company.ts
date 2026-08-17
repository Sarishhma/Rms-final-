import type { MiddlewareHandler } from "hono";
import type { AppBindings } from "../types.js";
import { forbidden } from "../utils/app-error.js";

export const requireCompany: MiddlewareHandler<AppBindings> = async (c, next) => {
  const user = c.get("authUser");

  if (!user.companyId) {
    throw forbidden("User is not bound to a company");
  }

  await next();
};
