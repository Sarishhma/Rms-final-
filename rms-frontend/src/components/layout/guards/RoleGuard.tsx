/**
 * RoleGuard.tsx
 *
 * A route-level guard that:
 *  1. Redirects unauthenticated users to /sign-in
 *  2. Redirects users who lack a required permission to /error
 *  3. Optionally restricts to specific roles
 *
 * Usage:
 *   <Route element={<RoleGuard permission="user:manage" />}>
 *     <Route path="/" element={<Dashboard />} />
 *   </Route>
 *
 *   <Route element={<RoleGuard roles={["WAITER","CASHIER"]} />}>
 *     <Route path="/tables" element={<Tables />} />
 *   </Route>
 */

import { Navigate, Outlet } from "react-router-dom";
import { RBAC_PERMISSIONS } from "@/utils/rbac.permissions";
interface RoleGuardProps {
  /** A single permission string that must be present */
  permission?: string;
  /** If provided, only these roles are allowed */
  roles?: string[];
}

export default function RoleGuard({ permission, roles }: RoleGuardProps) {


  const token = localStorage.getItem("accessToken");

  if (!token) return <Navigate to="/sign-in" replace />;

  const rawUser = localStorage.getItem("User");

  const user = rawUser ? JSON.parse(rawUser) : null;

  const permissions = RBAC_PERMISSIONS[user?.role as keyof typeof RBAC_PERMISSIONS] ?? [];

  const role: string = user?.role ?? "";

  if (permission && !permissions.includes(permission)) {
    return (
      <Navigate
        to={`/error?reason=permission&required=${permission}&role=${role}`}
        replace
      />
    );
  }
  if (roles && roles.length > 0 && !roles.includes(role)) {


    return (
      <Navigate
        to={`/error?reason=role&userRole=${role}&allowed=${roles.join(",")}`}
        replace
      />
    );
  }
  // Check role allowlist
  if (roles && roles.length > 0 && !roles.includes(role)) {
    return (
      <Navigate
        to={`/error?reason=role&userRole=${role}&allowed=${roles.join(",")}`}
        replace
      />
    );
  }

  return <Outlet />;
}
