import type { UserRole } from "@prisma/client";
import type { Permission } from "../../rbac/types.js";
import { hasPermission } from "../../rbac/service.js";
import { forbidden } from "../../../utils/app-error.js";

// Maps each report `type` (the route param) to the RBAC permission required to
// view it. Operational reports a cashier needs day-to-day require only
// `report:read`. Management / financial reports — the executive dashboard, the
// profit report (cost & margins), per-staff performance, and the audit-risk
// report — require the stricter `report:financial:read`, which only ADMIN and
// MASTER hold.
const reportTypePermission: Record<string, Permission> = {
  dashboard: "report:financial:read",
  "executive-dashboard": "report:financial:read",
  profit: "report:financial:read",
  staff: "report:financial:read",
  audit: "report:financial:read",
  "audit-risk": "report:financial:read",
  sales: "report:read",
  orders: "report:read",
  items: "report:read",
  payments: "report:read",
  inventory: "report:read",
  shifts: "report:read",
  "cash-reconciliation": "report:read",
};

export const reportPermissionService = {
  /**
   * Resolve the permission a given report type requires. Unknown types fall
   * back to the strict permission so a newly added report can never be exposed
   * by accident before it is classified here.
   */
  permissionFor: (type: string | undefined): Permission =>
    (type ? reportTypePermission[type] : undefined) ?? "report:financial:read",

  /** Throw 403 unless `role` is allowed to view report `type`. */
  assertAccess: (role: UserRole, type: string | undefined) => {
    const permission = reportPermissionService.permissionFor(type);
    if (!hasPermission(role, permission)) {
      throw forbidden("You do not have permission to view this report");
    }
  },
};
