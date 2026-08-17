import { createHash } from "node:crypto";
import type { MiddlewareHandler } from "hono";
import { prisma } from "../prisma/client.js";
import type { AppBindings } from "../types.js";
import { conflict } from "../utils/app-error.js";

const MAX_KEY_LENGTH = 255;

// Persists the first successful 2xx response for a given
// (companyId, key+bodyHash, route) tuple and replays it on subsequent
// requests carrying the same Idempotency-Key header and identical body.
// Different bodies under the same key are treated as separate operations so
// a reused key never replays a response that belongs to a different request.
// Failed or in-flight responses are not cached so the client can retry.
export const idempotency: MiddlewareHandler<AppBindings> = async (c, next) => {
  const rawKey = c.req.header("Idempotency-Key");
  if (!rawKey) {
    await next();
    return;
  }

  // Idempotency applies only to mutating methods
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(c.req.method)) {
    await next();
    return;
  }

  if (rawKey.length > MAX_KEY_LENGTH) {
    throw conflict("Idempotency-Key exceeds maximum length");
  }

  const user = c.get("authUser");
  const companyId = user?.companyId;
  if (!companyId) {
    await next();
    return;
  }

  // Read the body via a clone so downstream handlers can still parse it.
  const bodyText = await c.req.raw.clone().text();
  const bodyHash = createHash("sha256")
    .update(bodyText)
    .digest("hex")
    .slice(0, 32);
  const key = `${rawKey}:${bodyHash}`;

  const route = `${c.req.method} ${c.req.routePath ?? new URL(c.req.url).pathname}`;
  const whereKey = { companyId_key_route: { companyId, key, route } };

  const existing = await prisma.idempotencyKey.findUnique({ where: whereKey });

  if (existing) {
    if (existing.responseStatus !== null && existing.responseBody !== null) {
      return c.body(existing.responseBody, existing.responseStatus as any, {
        "Content-Type": existing.contentType ?? "application/json",
        "Idempotent-Replay": "true",
      });
    }
    throw conflict("Duplicate request still in flight");
  }

  try {
    await prisma.idempotencyKey.create({
      data: { companyId, key, route, userId: user.id },
    });
  } catch {
    throw conflict("Duplicate request still in flight");
  }

  // Release the lock on any failure (non-2xx, handler throw, or cache-write
  // error) so the client can retry; otherwise the row would stay in-flight
  // forever and every retry would 409.
  const releaseLock = () =>
    prisma.idempotencyKey
      .delete({ where: whereKey })
      .catch(() => undefined);

  try {
    await next();
  } catch (err) {
    await releaseLock();
    throw err;
  }

  const res = c.res;
  if (res.status < 200 || res.status >= 300) {
    await releaseLock();
    return;
  }

  try {
    const cloned = res.clone();
    const body = await cloned.text();
    const contentType = res.headers.get("content-type") ?? "application/json";

    await prisma.idempotencyKey.update({
      where: whereKey,
      data: { responseStatus: res.status, responseBody: body, contentType },
    });
  } catch {
    await releaseLock();
  }
};
