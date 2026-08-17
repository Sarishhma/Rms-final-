import { randomUUID } from "node:crypto";
import type { AuthUser } from "../../types.js";
import { badRequest, conflict, forbidden, notFound, unauthorized } from "../../utils/app-error.js";
import { invalidateAuthCache } from "../../middleware/auth.js";
import { authRepository } from "./repository.js";
import type { CurrentUserDto } from "./types.js";
import type { addStaffSchema, createAdminSchema, loginSchema, registerCompanySchema, updateUserSchema } from "./schema.js";
import type { z } from "zod";
import {
  createAccessToken,
  generateRefreshToken,
  createRefreshTokenJwt,
  hashRefreshToken,
  refreshTokenExpiresAt,
  verifyRefreshTokenJwt
} from "../../utils/jwt.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { loginThrottle } from "../../utils/login-throttle.js";
import { env } from "../../config/env.js";
import { auth } from "hono/utils/basic-auth";

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Issue a fresh access + refresh token pair for the given user.
 * The refresh token is persisted in DB as a SHA-256 hash.
 */
const issueTokenPair = async (user: { id: string; email: string; role: string; companyId: string | null }, family?: string) => {
  const accessToken = createAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId
  });

  const rawRefreshToken = generateRefreshToken();
  const tokenFamily = family ?? randomUUID();

  await authRepository.createRefreshToken({
    tokenHash: hashRefreshToken(rawRefreshToken),
    userId: user.id,
    family: tokenFamily,
    expiresAt: refreshTokenExpiresAt()
  });

  const refreshToken = createRefreshTokenJwt(user.id, rawRefreshToken);

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: env.JWT_ACCESS_EXPIRES_IN_SECONDS,
    refreshTokenExpiresIn: env.JWT_REFRESH_EXPIRES_IN_SECONDS
  };
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const authService = {
  currentUser: async (user: AuthUser | any): Promise<CurrentUserDto> => {
    let company: CurrentUserDto['company'] = null;

    if (user.companyId) {
      const row = await authRepository.findCompanyWithProfile(user.companyId);
      if (row) {
        company = {
          name: row.name,
          slug: row.slug,
          businessName: row.taxConfig?.businessName ?? null,
          businessAddress: row.taxConfig?.businessAddress ?? null,
          taxRegistrationNumber: row.taxConfig?.taxRegistrationNumber ?? null,
          currency: row.taxConfig?.currency ?? 'NPR',
        };
      }
    }


    return { 
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      phoneNumber: user.phoneNumber,
      company 
    };
  },
      //Change own password
    changePassword: async (actor: AuthUser, input:{currentPassword:string; newPassword:string})=>{
      const user = await authRepository.findUserByEmail(actor.email);
      if(!user) throw notFound("User");

      //verify current password
      const valid = await 
      verifyPassword(input.currentPassword,user.passwordHash);
      if(!valid)throw badRequest ("Current password is incorrect");

      // hash & save new password
      const newHash = await hashPassword(input.newPassword);
      await authRepository.updatePasswordHash(actor.id,newHash)

      // revoke all session tokens 
      await authRepository.revokeAllUserTokens(actor.id);
      invalidateAuthCache(actor.id);
      return {message:"Password changed successfully"};

    },
      //reset another user's password(admin-> staff, master-> admin)
    resetPassword: async(actor: AuthUser, input:{userId:string; newPassword: string})=>{
      const target = await
      authRepository.findUser(input.userId);
      if(!target)throw notFound("User")

        //role hirarchy check
        if (actor.role === "ADMIN") {
          //Admin can only reset staff within their company
          if (!actor.companyId) throw badRequest ("Admin is not bound to a company");
          if (target.companyId !== actor.companyId) throw forbidden("Cannot reset password for user outside your company");
          if (target.role === "ADMIN" || target.role === "MASTER") throw forbidden("Admin cannot reset other admin or master passwords");
        } else if (actor.role === "MASTER") {
          //master can reset admin and staff paswd too
          if (target.role === "MASTER" && target.id !== actor.id) throw forbidden ("Cannot reset another master's password");
        } else {
          throw forbidden("Only admin and masters can reset passwords")
        }

const newHash = await 
hashPassword(input.newPassword);
await 
authRepository.updatePasswordHash(input.userId, newHash);

//revoke target's session 
await authRepository.revokeAllUserTokens(input.userId);
invalidateAuthCache(input.userId);
return {message: "Password reset successfully"};
  },
  login: async (input: z.infer<typeof loginSchema>) => {
    const email = input.email.toLowerCase();
    // Reject early if this account is in a lockout window (brute-force guard).
    loginThrottle.assertNotLocked(email);

    const user = await authRepository.findUserByEmail(email);
    if (!user || !user.isActive || !(await verifyPassword(input.password, user.passwordHash))) {
      loginThrottle.recordFailure(email);
      throw unauthorized("Invalid email or password");
    }
    loginThrottle.recordSuccess(email);

    const [authUser, tokens] = await Promise.all([
      authService.currentUser(user),
      issueTokenPair(user),
    ]);

    return {
      ...tokens,
      user: authUser
    };
  },

  /**
   * Rotate the refresh token: revoke the old one, issue a new pair.
   * If the presented token was already revoked, the entire family is
   * invalidated (replay-attack detection).
   */
  refreshToken: async (refreshTokenJwt: string) => {
    const payload = verifyRefreshTokenJwt(refreshTokenJwt);
    if (!payload?.jti || !payload.sub) {
      throw unauthorized("Invalid refresh token");
    }

    const tokenHash = hashRefreshToken(payload.jti);
    const storedToken = await authRepository.findRefreshTokenByHash(tokenHash);

    if (!storedToken) {
      throw unauthorized("Refresh token not recognised");
    }

    // Replay detection: if the token was already revoked, someone is reusing
    // a rotated-out token → revoke the entire family as a precaution.
    if (storedToken.isRevoked) {
      await authRepository.revokeTokenFamily(storedToken.family);
      throw unauthorized("Refresh token reuse detected — all sessions revoked for security");
    }

    // Check expiry server-side (belt-and-suspenders alongside JWT exp)
    if (storedToken.expiresAt < new Date()) {
      await authRepository.revokeRefreshToken(tokenHash);
      throw unauthorized("Refresh token has expired");
    }

    // Check that the user is still active
    if (!storedToken.user.isActive) {
      await authRepository.revokeTokenFamily(storedToken.family);
      throw unauthorized("User account is inactive");
    }

    // Revoke the current token and issue a new pair in the same family
    await authRepository.revokeRefreshToken(tokenHash);

    const tokens = await issueTokenPair(storedToken.user, storedToken.family);

    return {
      ...tokens,
      user: storedToken.user
    };
  },

  /** Revoke a specific refresh token (single-device logout). */
  logout: async (refreshTokenJwt: string) => {
    const payload = verifyRefreshTokenJwt(refreshTokenJwt);
    if (!payload?.jti) return; // silently succeed if token is garbage

    const tokenHash = hashRefreshToken(payload.jti);
    const storedToken = await authRepository.findRefreshTokenByHash(tokenHash);
    if (storedToken && !storedToken.isRevoked) {
      await authRepository.revokeRefreshToken(tokenHash);
    }
  },

  /** Revoke all refresh tokens for the current user (logout from all devices). */
  logoutAll: async (actor: AuthUser) => {
    await authRepository.revokeAllUserTokens(actor.id);
    invalidateAuthCache(actor.id);
  },

  registerCompany: async (actor: AuthUser, input: z.infer<typeof registerCompanySchema>) => {
    const current = await authRepository.findUser(actor.id);
    if (!current) throw notFound("User");
    if (current.role !== "ADMIN") throw forbidden("Only restaurant admins can register company details");
    if (current.companyId) throw conflict("Admin is already bound to a company");

    const result = await authRepository.createCompanyForAdmin(actor.id, input);
    invalidateAuthCache(actor.id);

    return result;
  },

  createAdmin: async (actor: AuthUser, input: z.infer<typeof createAdminSchema>) => {
    const current = await authRepository.findUser(actor.id);
    if (!current) throw notFound("User");
    if (current.role !== "MASTER") throw forbidden("Only platform master can create restaurant admins");

    const email = input.email.toLowerCase();
    const existing = await authRepository.findUserByEmail(email);
    if (existing) throw conflict("A user with this email already exists");

    return authRepository.createAdmin({
      email,
      name: input.name,
      passwordHash: await hashPassword(input.password)
    });
  },

  listAdmins: async (actor: AuthUser) => {
    const current = await authRepository.findUser(actor.id);
    if (!current) throw notFound("User");
    if (current.role !== "MASTER") throw forbidden("Only platform master can list restaurant admins");

    return authRepository.listAdmins();
  },

  listUsers: (actor: AuthUser) => {
    if (!actor.companyId) throw badRequest("User is not bound to a company");
    return authRepository.listUsers(actor.companyId);
  },

  addStaff: async (actor: AuthUser, input: z.infer<typeof addStaffSchema>) => {
    if (actor.role !== "ADMIN") throw forbidden("Only restaurant admins can add staff");
    if (!actor.companyId) throw badRequest("Admin is not bound to a company");

    const company = await authRepository.findCompany(actor.companyId);
    if (!company || !company.isActive) throw notFound("Company");

    const email = input.email.toLowerCase();
    const existing = await authRepository.findUserByEmail(email);
    if (existing) throw conflict("A user with this email already exists");

    return authRepository.addPendingStaff({
      companyId: actor.companyId,
      email,
      passwordHash: await hashPassword(input.password),
      name: input.name,
      role: input.role,
      phoneNumber:input.phoneNumber
    });
  },

  updateUser: async (actor: AuthUser, id: string, input: z.infer<typeof updateUserSchema>) => {
    if (actor.role !== "ADMIN") throw forbidden("Only restaurant admins can update staff details");
    if (!actor.companyId) throw badRequest("Admin is not bound to a company");

    const target = await authRepository.findUser(id);
    if (!target) throw notFound("User");
    if (target.companyId !== actor.companyId) throw forbidden("Cannot update a user outside your company");
    if (target.role === "MASTER" || target.role === "ADMIN") throw forbidden("Owner and platform roles cannot be changed here");

    if (input.email && input.email !== target.email) {
      const existingEmail = await authRepository.findUserByEmail(input.email);
      if (existingEmail) throw conflict("A user with this email already exists");
    }

    return authRepository.updateUser(id, input).then((updated) => {
      // Bust cache so the updated details take effect immediately
      invalidateAuthCache(target.id);
      return updated;
    });
  }
};
