import type { MiddlewareHandler } from "hono";
import type { AppBindings } from "../types.js";

// Keys whose values must never reach the logs in plaintext (credentials,
// session tokens, password hashes).
const SENSITIVE_KEYS = new Set([
  "password",
  "currentpassword",
  "newpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "passwordhash",
  "authorization",
  "secret",
]);

// Recursively mask sensitive fields so request/response bodies can be logged
// without leaking credentials or tokens.
const redact = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) =>
        SENSITIVE_KEYS.has(k.toLowerCase())
          ? [k, "[REDACTED]"]
          : [k, redact(v)],
      ),
    );
  }
  return value;
};

/**
 * Detailed request/response logger middleware.
 *
 * Logs:
 * - Incoming request: method, URL, query params, headers, body (for non-GET)
 * - Outgoing response: status code, response body
 * - Errors: full details with stack traces
 * - Timing: duration of each request
 *
 * Sensitive fields (passwords, tokens) are redacted from logged bodies.
 */
export const requestLogger: MiddlewareHandler<AppBindings> = async (
  c,
  next,
) => {
  const start = Date.now();
  const method = c.req.method;
  const url = c.req.url;
  const path = c.req.path;
  // QZ signing requests and responses are cryptographic material. Never log
  // their payloads or signatures, even in development.
  const isQzSigningRequest = path === "/api/qz/sign";

  // ── Incoming Request ──────────────────────────────────────────────────
  const queryParams = Object.fromEntries(new URL(url).searchParams.entries());

  console.log("\n┌──────────────────────────────────────────────────────────");
  console.log(`│ ➜  ${method} ${path}`);
  console.log(`│ URL: ${url}`);

  if (Object.keys(queryParams).length > 0) {
    console.log(`│ Query: ${JSON.stringify(queryParams)}`);
  }

  // Log relevant headers
  const headers: Record<string, string> = {};
  for (const [key, value] of c.req.raw.headers.entries()) {
    // Skip sensitive/noisy headers
    if (["authorization", "cookie"].includes(key.toLowerCase())) {
      headers[key] = "[REDACTED]";
    } else {
      headers[key] = value;
    }
  }
  console.log(`│ Headers: ${JSON.stringify(headers, null, 2)}`);

  // Log request body for non-GET requests
  if (!isQzSigningRequest && method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    try {
      const clonedReq = c.req.raw.clone();
      const contentType = c.req.header("content-type") ?? "";

      if (contentType.includes("application/json")) {
        const body = await clonedReq.json();
        console.log(`│ Body: ${JSON.stringify(redact(body), null, 2)}`);
      } else if (contentType.includes("form")) {
        const formData = await clonedReq.formData();
        const formObj: Record<string, string> = {};
        formData.forEach((value, key) => {
          if (SENSITIVE_KEYS.has(key.toLowerCase())) {
            formObj[key] = "[REDACTED]";
          } else {
            formObj[key] = typeof value === "string" ? value : "[File]";
          }
        });
        console.log(`│ Body (form): ${JSON.stringify(formObj, null, 2)}`);
      } else {
        const text = await clonedReq.text();
        if (text) {
          console.log(`│ Body (raw): ${text.slice(0, 500)}`);
        }
      }
    } catch {
      console.log("│ Body: [Could not parse]");
    }
  }

  console.log("├──────────────────────────────────────────────────────────");

  // ── Execute downstream ────────────────────────────────────────────────
  let caughtError: unknown = null;
  try {
    await next();
  } catch (err) {
    caughtError = err;
    console.error("│ ✖ ERROR thrown during handler:");
    if (err instanceof Error) {
      console.error(`│   Name: ${err.name}`);
      console.error(`│   Message: ${err.message}`);
      console.error(`│   Stack: ${err.stack}`);
    } else {
      console.error(`│   ${JSON.stringify(err)}`);
    }
  }

  // ── Outgoing Response ─────────────────────────────────────────────────
  const duration = Date.now() - start;
  const status = c.res?.status ?? 500;
  const statusIcon = status >= 400 ? "✖" : "✔";

  console.log(`│ ${statusIcon}  Response: ${status}`);
  console.log(`│ Duration: ${duration}ms`);

  if (!caughtError && !isQzSigningRequest) {
    // Log response body
    try {
      const resClone = c.res.clone();
      const resContentType = resClone.headers.get("content-type") ?? "";

      if (resContentType.includes("application/json")) {
        // Skip logging the massive swagger file
        if (path.includes("swagger.json") || url.includes("swagger.json")) {
          console.log(`│ Response Body: [Swagger JSON File Hidden from Logs]`);
        } else {
          const resBody = await resClone.json();
          console.log(
            `│ Response Body: ${JSON.stringify(redact(resBody), null, 2)}`,
          );
        }
      }
    } catch {
      console.log("│ Response Body: [Could not parse]");
    }
  }

  if (status >= 400) {
    console.log(`│ ⚠ Error response for ${method} ${path}`);
  }

  console.log("└──────────────────────────────────────────────────────────");
  console.log(
    "\n\n\n══════════════════════════════════════════════════════════════\n\n\n",
  );

  if (caughtError) {
    throw caughtError; // re-throw so the error handler can process it
  }
};
