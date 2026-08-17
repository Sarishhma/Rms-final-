/**
 * Central source of truth for role-based routing in Mealuxe.
 *
 * Every role has:
 *   homeRoute   – where to land after login
 *   layout      – which shell to render ("admin" | "pos")
 *   permissions – what this role can do (mirrors rbac.permissions.ts)
 */

export type AppRole =
  | "MASTER"
  | "ADMIN"
  | "CASHIER"
  | "WAITER"
  | "CASHIER_WAITER"
  | "KITCHEN";

export interface RoleConfig {
  homeRoute: string;
  permissions: string[];
}

export const ROLE_CONFIG: Record<AppRole, RoleConfig> = {
  MASTER: {
    homeRoute: "/dashoard",
    permissions: [
      "table:read",
      "table:write",
      "menu:read",
      "menu:write",
      "stock:read",
      "stock:write",
      "order:read",
      "order:write",
      "order:void",
      "kot:read",
      "kot:write",
      "bill:read",
      "bill:write",
      "payment:read",
      "payment:write",
      "refund:read",
      "refund:write",
      "customer:read",
      "customer:write",
      "shift:read",
      "shift:write",
      "tax:read",
      "tax:write",
      "report:read",
      "audit:read",
      "user:manage",
    ],
  },

  ADMIN: {
    homeRoute: "/dashboard",
    permissions: [
      "table:read",
      "table:write",
      "menu:read",
      "menu:write",
      "stock:read",
      "stock:write",
      "order:read",
      "order:write",
      "order:void",
      "kot:read",
      "kot:write",
      "bill:read",
      "bill:write",
      "payment:read",
      "payment:write",
      "refund:read",
      "refund:write",
      "customer:read",
      "customer:write",
      "shift:read",
      "shift:write",
      "tax:read",
      "tax:write",
      "report:read",
      "audit:read",
      "user:manage",
    ],
  },

  CASHIER: {
    homeRoute: "/admin/orders",
    permissions: [
      "table:read",
      "order:read",
      "order:write",
      "bill:read",
      "bill:write",
      "payment:read",
      "payment:write",
      "refund:read",
      "refund:write",
      "customer:read",
      "customer:write",
      "shift:read",
      "shift:write",
      "report:read",
      "menu:read",
    ],
  },

  WAITER: {
    homeRoute: "/tables",
    permissions: [
      "table:read",
      "table:write",
      "menu:read",
      "order:read",
      "order:write",
      "kot:read",
      "stock:read",
      "customer:read",
      "customer:write",
    ],
  },

  CASHIER_WAITER: {
    homeRoute: "/tables",
    permissions: [
      "table:read",
      "table:write",
      "menu:read",
      "order:read",
      "order:write",
      "kot:read",
      "bill:read",
      "bill:write",
      "payment:read",
      "payment:write",
      "refund:read",
      "refund:write",
      "customer:read",
      "customer:write",
      "shift:read",
      "shift:write",
      "report:read",
      "stock:read",
    ],
  },

  KITCHEN: {
    homeRoute: "/active-orders",
    permissions: ["order:read", "kot:read", "kot:write", "stock:read"],
  },
};

/** Utility: get the home route for a user from auth-me response */
export function getHomeRoute(role: string): string {
  return ROLE_CONFIG[role as AppRole]?.homeRoute ?? "/sign-in-hg";
}

/** Utility: does this role have admin-level access? */
export function isAdminRole(role: string): boolean {
  return role === "ADMIN" || role === "MASTER";
}

/** Utility: does this role use the POS shell? */
export function isPosRole(role: string): boolean {
  return !isAdminRole(role);
}
