import { z } from "zod";
import { normalizeName } from "../../utils/string.js";

// Complexity policy for newly-set passwords. Applied only where a password is
// created (admin/staff) — NOT to login, so existing accounts with older
// passwords can still authenticate.
const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number");

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1)
});

export const registerCompanySchema = z.object({
  name: z.string().trim().min(2).max(120).transform(normalizeName),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only")
});

export const createAdminSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).max(120).transform(normalizeName).optional(),
  password: strongPassword
});

export const addStaffSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).max(120).transform(normalizeName).optional(),
  password: strongPassword,
  role: z.enum(["CASHIER", "WAITER", "CASHIER_WAITER", "KITCHEN"]),
  phoneNumber:z.string().optional()
});

export const updateUserSchema = z.object({
  role: z.enum(["CASHIER", "WAITER", "CASHIER_WAITER", "KITCHEN"]).optional(),
  name: z.string().trim().min(1).max(120).transform(normalizeName).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  isActive: z.boolean().optional(),
});


export const changePasswordSchema = z.object({
  currentPassword:z.string().min(8).max(50),
  newPassword: strongPassword,
})

export const resetPasswordSchema= z.object({
  userId:z.string().uuid(),
  newPassword: strongPassword,
})