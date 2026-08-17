/**
 * CompanyGuard.tsx
 *
 * Sits above all protected routes. Responsibilities:
 *  1. Shows loader while auth-me is in flight
 *  2. Redirects unauthenticated users → /sign-in
 *  3. Forces ADMIN without a company → /company-register
 *  4. Forces staff without a company → /sign-in (invalid state)
 *  5. Otherwise renders children (Outlet)
 */

import { useAuthMe } from "@/features/auth/hook/useAuthMe";
import { Navigate, Outlet } from "react-router-dom";
import Loader from "../../../features/shared/LottieLoader";

const STAFF_ROLES = ["WAITER", "CASHIER", "CASHIER_WAITER", "KITCHEN"];

export default function CompanyGuard() {
  const { data, isLoading } = useAuthMe();

  if (isLoading) return <Loader />;

  const user = data?.data ?? data?.user ?? data;

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  const hasCompany = !!user.companyId;
  const role = user.role;

  if ((role === "ADMIN" || role === "MASTER") && !hasCompany) {
    return <Navigate to="/company-register" replace />;
  }

  if (STAFF_ROLES.includes(role) && !hasCompany) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
}
