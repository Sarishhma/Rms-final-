import type { Context } from "hono";
import { getValidated } from "../../middleware/validate.js";
import { ok } from "../../utils/response.js";
import { authService } from "./service.js";
import type { addStaffSchema, changePasswordSchema, createAdminSchema, loginSchema, logoutSchema, refreshTokenSchema, registerCompanySchema, resetPasswordSchema, updateUserSchema } from "./schema.js";
import type { z } from "zod";

export const authController = {
  me: async (c: Context) => ok(c, await authService.currentUser(c.get("authUser"))),

  login: async (c: Context) => {
    const input = getValidated<z.infer<typeof loginSchema>>(c, "json");
    return ok(c, await authService.login(input));
  },

  refreshToken: async (c: Context) => {
    const input = getValidated<z.infer<typeof refreshTokenSchema>>(c, "json");
    return ok(c, await authService.refreshToken(input.refreshToken));
  },
  changePassword:async(c:Context)=>{
const input = getValidated<z.infer<typeof changePasswordSchema>>(c,"json")
return ok(c, await
  authService.changePassword(c.get("authUser"),input)
)
  },
  resetPassword:async(c:Context)=>{
const input= getValidated<z.infer<typeof resetPasswordSchema>>(c,"json");
return ok (c, await
  authService.resetPassword(c.get("authUser"), input)
);
  },

  logout: async (c: Context) => {
    const input = getValidated<z.infer<typeof logoutSchema>>(c, "json");
    await authService.logout(input.refreshToken);
    return ok(c, { message: "Logged out successfully" });
  },

  logoutAll: async (c: Context) => {
    await authService.logoutAll(c.get("authUser"));
    return ok(c, { message: "All sessions revoked" });
  },

  registerCompany: async (c: Context) => {
    const input = getValidated<z.infer<typeof registerCompanySchema>>(c, "json");
    return ok(c, await authService.registerCompany(c.get("authUser"), input));
  },

  createAdmin: async (c: Context) => {
    const input = getValidated<z.infer<typeof createAdminSchema>>(c, "json");
    return ok(c, await authService.createAdmin(c.get("authUser"), input));
  },

  listAdmins: async (c: Context) => ok(c, await authService.listAdmins(c.get("authUser"))),

  listUsers: async (c: Context) => ok(c, await authService.listUsers(c.get("authUser"))),

  addStaff: async (c: Context) => {
    const input = getValidated<z.infer<typeof addStaffSchema>>(c, "json");
    return ok(c, await authService.addStaff(c.get("authUser"), input));
  },

  updateUser: async (c: Context) => {
    const id = c.req.param("id") as string;
    const input = getValidated<z.infer<typeof updateUserSchema>>(c, "json");
    return ok(c, await authService.updateUser(c.get("authUser"), id, input));
  }
};
