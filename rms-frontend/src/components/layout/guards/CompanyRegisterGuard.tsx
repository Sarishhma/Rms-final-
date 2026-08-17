// src/components/layout/CompanyRegisterGuard.tsx

import { useAuthMe } from "@/features/auth/hook/useAuthMe";
import { Navigate, Outlet } from "react-router-dom";
import Loader from "../../../features/shared/LottieLoader";

export default function CompanyRegisterGuard() {
  const token = localStorage.getItem("accessToken");
  const { data, isLoading } = useAuthMe();

  // Bug #1 fix: no token → send to login
  if (!token) return <Navigate to="/sign-in" replace />;

  if (isLoading) return <Loader />;

  const user = data?.data ?? data?.user ?? data;

  // Still no user after query → send to login
  if (!user) return <Navigate to="/sign-in" replace />;

  function getDashboardRoute(role: string) {
    switch (role) {
      case "ADMIN":
        return "/dashboard";

      case "CASHIER":
        return "/admin/orders";

      case "WAITER":
        return "/tables";

      default:
        return "/sign-in";
    }
  }
  // Bug #2 fix: already has a company → send to dashboard
  if (user.companyId) {
    return <Navigate to={getDashboardRoute(user.role)} replace />;
  }
  return <Outlet />;
}
