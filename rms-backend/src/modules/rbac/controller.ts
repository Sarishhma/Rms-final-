import type { Context } from "hono";
import { ok } from "../../utils/response.js";
import { rolePermissions } from "./service.js";

export const rbacController = {
  listPermissions: (c: Context) => ok(c, rolePermissions)
};
