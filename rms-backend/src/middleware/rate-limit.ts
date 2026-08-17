import type { Context, MiddlewareHandler } from "hono";
import { env } from "../config/env.js";
import type { AppBindings } from "../types.js";
import { tooManyRequests } from "../utils/app-error.js";

// In-memory store. Single-instance only; swap for Redis when scaling horizontally.
type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}, 60_000).unref?.();

// Resolves the client identity for rate-limit keying. Forwarded headers are
// only consulted when TRUST_PROXY=true, because an unauthenticated client can
// rotate X-Forwarded-For per request to defeat the limiter. Falls back to the
// Node socket remote address when running under @hono/node-server.
const clientIp = (c: Context): string => {
  if (env.TRUST_PROXY) {
    const fwd = c.req.header("x-forwarded-for");
    if (fwd) {
      const first = fwd.split(",")[0]?.trim();
      if (first) return first;
    }
    const real = c.req.header("x-real-ip");
    if (real) return real;
  }
  const incoming = (c.env as any)?.incoming;
  const remote = incoming?.socket?.remoteAddress;
  return typeof remote === "string" && remote ? remote : "unknown";
};

export type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyPrefix: string;
  keyBy?: (c: Context<AppBindings>) => string;
};

export const rateLimit = (opts: RateLimitOptions): MiddlewareHandler<AppBindings> => {
  return async (c, next) => {
    // Prefer the authenticated identity (user + tenant) when available so one
    // noisy tenant doesn't exhaust the global bucket for everyone else, and so
    // shared egress IPs don't lump tenants together.
    const subject = (() => {
      if (opts.keyBy) return opts.keyBy(c);
      const authUser = c.get("authUser");
      if (authUser) return `u:${authUser.companyId ?? "none"}:${authUser.id}`;
      return `ip:${clientIp(c)}`;
    })();

    const key = `${opts.keyPrefix}:${subject}`;
    const now = Date.now();
    const bucket = store.get(key);

    if (!bucket || bucket.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + opts.windowMs });
    } else {
      bucket.count += 1;
      if (bucket.count > opts.max) {
        const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
        c.header("Retry-After", String(retryAfter));
        throw tooManyRequests();
      }
    }

    await next();
  };
};
