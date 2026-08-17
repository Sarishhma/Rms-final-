import "dotenv/config";
import { z } from "zod";

// Shipped development fallbacks. These are intentionally rejected in production
// (see the guard below) so a missing env var can never sign tokens with a
// publicly-known secret.
const DEV_JWT_SECRET = "development-jwt-secret-change-before-production";
const DEV_JWT_REFRESH_SECRET = "development-refresh-secret-change-before-production";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32).default(DEV_JWT_SECRET),
  JWT_REFRESH_SECRET: z.string().min(32).default(DEV_JWT_REFRESH_SECRET),
  JWT_ACCESS_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(15 * 60),           // 15 minutes
  JWT_REFRESH_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 7), // 7 days
  FRONTEND_ORIGIN: z.string().default("*"),
  // QZ Tray signing material. The private key must be mounted outside any
  // static/public directory and must never be committed.
  QZ_CERTIFICATE_PATH: z.string().trim().min(1).default("certificates/digital-certificate.txt"),
  QZ_PRIVATE_KEY_PATH: z.string().trim().min(1).default("certificates/private-key.pem"),
  QZ_MAX_SIGN_REQUEST_BYTES: z.coerce.number().int().min(1024).max(1024 * 1024).default(64 * 1024),
  // Only honor X-Forwarded-For / X-Real-IP for rate-limit keying when the
  // server actually sits behind a trusted reverse proxy. Otherwise clients
  // can spoof these headers and bypass per-IP limits.
  TRUST_PROXY: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true")
});

export const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === "production";

// Fail fast: never run in production with the shipped development signing keys,
// otherwise anyone could forge valid access/refresh tokens.
if (isProduction) {
  const usingDefaults = [
    env.JWT_SECRET === DEV_JWT_SECRET ? "JWT_SECRET" : null,
    env.JWT_REFRESH_SECRET === DEV_JWT_REFRESH_SECRET ? "JWT_REFRESH_SECRET" : null,
  ].filter(Boolean);

  if (usingDefaults.length > 0) {
    throw new Error(
      `Refusing to start in production with default ${usingDefaults.join(" and ")}. ` +
        "Set strong, unique value(s) via environment variables.",
    );
  }
}
