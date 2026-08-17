import { Hono } from "hono";
import type { AppBindings } from "../../types.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { authController } from "./controller.js";
import { addStaffSchema, changePasswordSchema, createAdminSchema, loginSchema, logoutSchema, refreshTokenSchema, registerCompanySchema, resetPasswordSchema, updateUserSchema } from "./schema.js";

export const publicAuthRoutes = new Hono<AppBindings>();
export const authRoutes = new Hono<AppBindings>();

// ─── Public (no auth required) ────────────────────────────────────────────────
publicAuthRoutes.post("/login", validate("json", loginSchema), authController.login);
publicAuthRoutes.post("/refresh", validate("json", refreshTokenSchema), authController.refreshToken);
publicAuthRoutes.post("/logout", validate("json", logoutSchema), authController.logout);

// ─── Protected (auth required) ────────────────────────────────────────────────
authRoutes.get("/me", authController.me);
authRoutes.post("/change-password", requirePermission("user:manage"), validate("json",changePasswordSchema),authController.changePassword)
authRoutes.post("/reset-password",requirePermission("user:manage"),validate("json",resetPasswordSchema), authController.resetPassword)
authRoutes.post("/logout-all", authController.logoutAll);
authRoutes.post("/register-company", validate("json", registerCompanySchema), authController.registerCompany);
authRoutes.get("/admins", requirePermission("user:manage"), authController.listAdmins);
authRoutes.post("/admins", requirePermission("user:manage"), validate("json", createAdminSchema), authController.createAdmin);
authRoutes.get("/users", requirePermission("user:manage"), authController.listUsers);
authRoutes.post("/staff", requirePermission("user:manage"), validate("json", addStaffSchema), authController.addStaff);
authRoutes.patch("/users/:id", requirePermission("user:manage"), validate("json", updateUserSchema), authController.updateUser);
