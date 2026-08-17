import type { Hono } from "hono";
import { requireCompany } from "./middleware/company.js";
import { auditRoutes } from "./modules/audit/route.js";
import { authRoutes } from "./modules/auth/route.js";
import { billingRoutes } from "./modules/billing/route.js";
import { customerRoutes } from "./modules/customers/route.js";
import { kotRoutes } from "./modules/kot/route.js";
import { menuRoutes } from "./modules/menu/route.js";
import { orderRoutes } from "./modules/orders/route.js";
import { paymentRoutes } from "./modules/payments/route.js";
import { rbacRoutes } from "./modules/rbac/route.js";
import { refundRoutes } from "./modules/refunds/route.js";
import { reportRoutes } from "./modules/reports/route.js";
import { shiftRoutes } from "./modules/shifts/route.js";
import { taxConfigRoutes } from "./modules/tax-config/route.js";
import { stockRoutes } from "./modules/stock/route.js";
import { tableRoutes } from "./modules/tables/route.js";
import type { AppBindings } from "./types.js";
import { inventoryRoutes } from "./modules/inventory/route.js";
import { kitchenStationRoutes } from "./modules/kitchen-stations/route.js";
import { printerRoutes } from "./modules/printers/route.js";
import { qzRoutes } from "./modules/qz/route.js";

export const registerRoutes = (app: Hono<AppBindings>) => {
  app.route("/api/auth", authRoutes);
  app.use("/api/rbac/*", requireCompany); //
  app.use("/api/tables/*", requireCompany);
  app.use("/api/menu/*", requireCompany);
  app.use("/api/stock/*", requireCompany);
  app.use("/api/orders/*", requireCompany);
  app.use("/api/kot/*", requireCompany); //
  app.use("/api/billing/*", requireCompany);
  app.use("/api/payments/*", requireCompany);
  app.use("/api/refunds/*", requireCompany);
  app.use("/api/customers/*", requireCompany);
  app.use("/api/shifts/*", requireCompany);
  app.use("/api/tax-config/*", requireCompany);
  app.use("/api/reports/*", requireCompany); //
  app.use("/api/audit-logs/*", requireCompany); //
  app.use("/api/inventory/*", requireCompany);
  app.use("/api/kitchen-stations/*", requireCompany);
  app.use("/api/printers/*", requireCompany);
  app.route("/api/rbac", rbacRoutes);
  app.route("/api/tables", tableRoutes);
  app.route("/api/menu", menuRoutes);
  app.route("/api/stock", stockRoutes);
  app.route("/api/orders", orderRoutes);
  app.route("/api/kot", kotRoutes);
  app.route("/api/billing", billingRoutes);
  app.route("/api/payments", paymentRoutes);
  app.route("/api/refunds", refundRoutes);
  app.route("/api/customers", customerRoutes);
  app.route("/api/shifts", shiftRoutes);
  app.route("/api/tax-config", taxConfigRoutes);
  app.route("/api/reports", reportRoutes);
  app.route("/api/audit-logs", auditRoutes);
  app.route("/api/inventory", inventoryRoutes);
  app.route("/api/kitchen-stations", kitchenStationRoutes);
  app.route("/api/printers", printerRoutes);
  app.route("/api/qz", qzRoutes);
};
