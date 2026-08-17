import { Hono } from "hono";
import type { AppBindings } from "../../types.js";
import { requireCompany } from "../../middleware/company.js";
import { requirePermission } from "../../middleware/rbac.js";
import { qzController } from "./controller.js";

// All QZ endpoints are JWT-protected by the app-wide API middleware. Signing
// additionally requires a company context and the existing printer permission.
export const qzRoutes = new Hono<AppBindings>();
qzRoutes.get("/certificate", qzController.certificate);
qzRoutes.post("/sign", requireCompany, requirePermission("printer:read"), qzController.sign);
