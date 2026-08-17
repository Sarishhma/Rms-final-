import { Navigate } from "react-router-dom";
import { getHomeRoute } from "@/utils/roleConfig";

export default function RootRedirect() {
  const token = localStorage.getItem("accessToken");
  const rawUser = localStorage.getItem("User");

  if (!token || !rawUser) {
    return <Navigate to="/sign-in" replace />;
  }

  const user = JSON.parse(rawUser);

  return <Navigate to={getHomeRoute(user.role)} replace />;
}
