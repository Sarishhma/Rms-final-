import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// ─── Payload Types ────────────────────────────────────────────────────────────

type AccessTokenPayload = jwt.JwtPayload & {
  sub: string;
  email: string;
  role: string;
  companyId: string | null;
  type: "access";
};

type RefreshTokenPayload = jwt.JwtPayload & {
  sub: string;
  jti: string;
  type: "refresh";
};

// ─── Access Token (short-lived, stateless) ────────────────────────────────────

export const createAccessToken = (payload: Omit<AccessTokenPayload, "type">) =>
  jwt.sign({ ...payload, type: "access" as const }, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: env.JWT_ACCESS_EXPIRES_IN_SECONDS
  });

export const verifyAccessToken = (token: string): AccessTokenPayload | null => {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"]
    });

    if (typeof payload === "string") return null;
    if (payload.type !== "access") return null;
    if (!payload.sub || !payload.email || !payload.role) return null;

    return payload as AccessTokenPayload;
  } catch {
    return null;
  }
};

// ─── Refresh Token (long-lived, DB-backed) ────────────────────────────────────

/**
 * Generate a cryptographically random refresh token string.
 * This raw value is sent to the client; only its SHA-256 hash is stored in DB.
 */
export const generateRefreshToken = () => randomBytes(48).toString("base64url");

/**
 * Create a signed JWT wrapper around the raw refresh token.
 * The `jti` (JWT ID) carries the raw token so the client only stores one value.
 */
export const createRefreshTokenJwt = (userId: string, rawToken: string) =>
  jwt.sign(
    { sub: userId, jti: rawToken, type: "refresh" as const },
    env.JWT_REFRESH_SECRET,
    { algorithm: "HS256", expiresIn: env.JWT_REFRESH_EXPIRES_IN_SECONDS }
  );

export const verifyRefreshTokenJwt = (token: string): RefreshTokenPayload | null => {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      algorithms: ["HS256"]
    });

    if (typeof payload === "string") return null;
    if (payload.type !== "refresh") return null;
    if (!payload.sub || !payload.jti) return null;

    return payload as RefreshTokenPayload;
  } catch {
    return null;
  }
};

/**
 * Hash a raw refresh token for safe DB storage.
 */
export const hashRefreshToken = (rawToken: string) =>
  createHash("sha256").update(rawToken).digest("hex");

/** Returns the expiry Date for a new refresh token. */
export const refreshTokenExpiresAt = () =>
  new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN_SECONDS * 1000);

// ─── Backward-compat alias (used only by auth middleware) ─────────────────────

/** @deprecated — prefer verifyAccessToken */
export const verifyJwt = verifyAccessToken;
export const createJwt = createAccessToken;
