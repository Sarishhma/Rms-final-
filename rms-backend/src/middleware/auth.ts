import type { MiddlewareHandler } from "hono";
import { prisma } from "../prisma/client.js";
import type { AppBindings, AuthUser } from "../types.js";
import { unauthorized } from "../utils/app-error.js";
import { TtlCache } from "../utils/cache.js";
import { verifyAccessToken } from "../utils/jwt.js";

// Cache resolved auth users briefly to avoid hitting DB on every request.
const authCache = new TtlCache<AuthUser>({ ttlMs: 60_000, maxSize: 500 });

const getBearerToken = (header: string | undefined) => {
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length);
};

export const requireAuth: MiddlewareHandler<AppBindings> = async (c, next) => {
  const token = getBearerToken(c.req.header("Authorization"));

  if (!token) {
    throw unauthorized();
  }

  const payload = verifyAccessToken(token);

  if (!payload?.sub) {
    throw unauthorized("Invalid session");
  }

  // Skip cache for auth routes so /me, register-company, etc. always get fresh data
  const isAuthRoute = c.req.path.startsWith("/api/auth");

  // Return cached user if available (except for auth routes)
  if (!isAuthRoute) {
    const cached = authCache.get(payload.sub);
    if (cached) {
      c.set("authUser", cached);
      await next();
      return;
    }
  }

  const userSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    companyId: true,
    isActive: true,
  } as const;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: userSelect,
  });

  if (!user) {
    throw unauthorized("User is not registered. Contact your administrator.");
  }

  if (!user.isActive) {
    throw unauthorized("User account is inactive");
  }

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    companyId: user.companyId,
  };

  // Cache for subsequent requests from the same session
  authCache.set(payload.sub, authUser);

  c.set("authUser", authUser);

  await next();
};

/** Expose for admin endpoints that mutate user data (role change, deactivation). */
export const invalidateAuthCache = (userId: string) => authCache.invalidate(userId);
