/**
 * useRoleRedirect.ts
 *
 * Call this inside the sign-in page (or AuthProvider) right after login
 * succeeds. It reads the user's role from the auth-me response and
 * pushes them to the correct home route.
 *
 * Usage (in SignIn.tsx after successful mutation):
 *   const redirect = useRoleRedirect();
 *   onSuccess: (data) => redirect(data.user)
 */

import { useNavigate } from "react-router-dom";
import { getHomeRoute } from "@/utils/roleConfig";

export function useRoleRedirect() {
  const navigate = useNavigate();

  /** Pass the user object from auth-me / login response */
  return function redirectByRole(user: { role: string }) {
    const destination = getHomeRoute(user.role);

    navigate(destination, { replace: true });
  };
}
