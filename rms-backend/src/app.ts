import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./config/env.js";
import { apiDocsRoutes } from "./api-docs/route.js";
import { errorHandler } from "./middleware/error-handler.js";
import { requestLogger } from "./middleware/request-logger.js";
import { securityHeaders } from "./middleware/security-headers.js";
import { requireAuth } from "./middleware/auth.js";
import { injectTenantContext } from "./middleware/tenant.js";
import { idempotency } from "./middleware/idempotency.js";
import { rateLimit } from "./middleware/rate-limit.js";
import type { AppBindings } from "./types.js";
import { ok } from "./utils/response.js";
import { registerRoutes } from "./routes.js";
import { publicAuthRoutes } from "./modules/auth/route.js";
import { masterPortalRoutes } from "./modules/master-portal/route.js";

export const app = new Hono<AppBindings>({ strict: false });

app.use("*", requestLogger);
app.use("*", securityHeaders);
app.use(
  "*",
  cors({
    origin: env.FRONTEND_ORIGIN === "*" ? "*" : env.FRONTEND_ORIGIN,
    // credentials: true is incompatible with origin: "*" per the CORS spec.
    // Only enable when a specific origin is configured.
    credentials: env.FRONTEND_ORIGIN !== "*",
  }),
);

app.get("/health", (c) =>
  ok(c, { status: "ok", timestamp: new Date().toISOString() }),
);
app.route("/api-docs", apiDocsRoutes);
app.route("/master", masterPortalRoutes);

app.use(
  "/api/*",
  rateLimit({ keyPrefix: "global", windowMs: 60_000, max: 300 }),
);
app.use(
  "/api/auth/*",
  rateLimit({ keyPrefix: "auth", windowMs: 60_000, max: 20 }),
);

app.route("/api/auth", publicAuthRoutes);

app.use("/api/*", requireAuth);
app.use("/api/*", injectTenantContext);
// Per-tenant limit applied after auth so one company can't exhaust the
// global IP bucket and starve other tenants on the same node.
app.use(
  "/api/*",
  rateLimit({ keyPrefix: "tenant", windowMs: 60_000, max: 600 }),
);

app.use("/api/*", idempotency);

registerRoutes(app);

app.notFound((c) =>
  c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
      },
    },
    404,
  ),
);

app.onError(errorHandler);
