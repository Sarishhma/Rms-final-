import type { MiddlewareHandler } from "hono";
import type { AppBindings } from "../types.js";

// Baseline security response headers (a small helmet-equivalent). The strict
// `default-src 'none'` CSP is applied only to API/JSON routes; the HTML admin
// pages (master portal, swagger UI) get only `frame-ancestors 'none'` so their
// inline assets keep working while still being protected from clickjacking.
export const securityHeaders: MiddlewareHandler<AppBindings> = async (c, next) => {
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "no-referrer");
  c.header("X-DNS-Prefetch-Control", "off");
  c.header("Cross-Origin-Opener-Policy", "same-origin");
  // Harmless over plain HTTP (browsers ignore it); enforced once served via TLS.
  c.header("Strict-Transport-Security", "max-age=15552000; includeSubDomains");

  const path = c.req.path;
  const isApi = path === "/health" || path.startsWith("/api/");
  c.header(
    "Content-Security-Policy",
    isApi
      ? "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
      : "frame-ancestors 'none'",
  );

  await next();
};
