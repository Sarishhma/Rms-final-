import { useState } from "react";
import {
  RefreshCw,
  Home,
  ShieldOff,
  Users,
  WifiOff,
  AlertTriangle,
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { RBAC_PERMISSIONS } from "@/utils/rbac.permissions";

type ErrorReason = "permission" | "role" | "system" | null;

interface ErrorConfig {
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  canRetry: boolean;
  canGoHome: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRolePermissions(role: string): string[] {
  return RBAC_PERMISSIONS[role as keyof typeof RBAC_PERMISSIONS] ?? [];
}

function buildErrorConfig(
  reason: ErrorReason,
  params: URLSearchParams,
): ErrorConfig {
  const required = params.get("required") ?? "";
  const userRole = params.get("role") ?? params.get("userRole") ?? "";
  const allowed = params.get("allowed") ?? "";

  if (reason === "permission") {
    return {
      badge: "Permission denied",
      badgeColor: "bg-orange-100 text-orange-700",
      icon: <ShieldOff size={20} className="text-orange-500 mt-0.5 shrink-0" />,
      title: "You don't have access to this page",
      description: `Your role (${userRole || "unknown"}) is missing the "${required}" permission required for this route.`,
      canRetry: false,
      canGoHome: true,
    };
  }

  if (reason === "role") {
    const allowedRoles = allowed.split(",").filter(Boolean);
    return {
      badge: "Role not allowed",
      badgeColor: "bg-yellow-100 text-yellow-700",
      icon: <Users size={20} className="text-yellow-500 mt-0.5 shrink-0" />,
      title: "Your role can't access this page",
      description: `You're signed in as ${userRole || "unknown"}. This page is only available to: ${allowedRoles.join(", ") || "other roles"}.`,
      canRetry: false,
      canGoHome: true,
    };
  }

  // fallback: generic system error
  return {
    badge: "System error",
    badgeColor: "bg-red-100 text-red-600",
    icon: <WifiOff size={20} className="text-red-500 mt-0.5 shrink-0" />,
    title: "We're having trouble connecting to our servers",
    description:
      "Our team has been notified and is working to resolve the issue. Please try again in a few moments.",
    canRetry: true,
    canGoHome: true,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SystemErrorPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [retrying, setRetrying] = useState(false);

  const reason = params.get("reason") as ErrorReason;
  const userRole = params.get("role") ?? params.get("userRole") ?? "";
  const config = buildErrorConfig(reason, params);

  const userPermissions = userRole ? getRolePermissions(userRole) : [];

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => window.location.reload(), 1200);
  };

  const handleGoHome = () => {
    // Clear stale state just in case
    navigate("/sign-in", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-6">
        {/* ── Header ── */}
        <div>
          <span
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4 ${config.badgeColor}`}
          >
            <AlertTriangle size={14} />
            {config.badge}
          </span>

          <h1 className="text-3xl font-bold text-gray-900 leading-snug">
            {config.title}
          </h1>
          <p className="mt-2 text-gray-500 text-base">{config.description}</p>
        </div>

        {/* ── Debug detail card (only when reason is known) ── */}
        {reason && (
          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 text-sm">
            {/* What happened */}
            <div className="flex items-start gap-3 p-4">
              {config.icon}
              <div>
                <p className="font-medium text-gray-800">What happened</p>
                <p className="text-gray-500 mt-0.5">
                  {reason === "permission" &&
                    `The route requires the permission "${params.get("required")}". Your role doesn't have it.`}
                  {reason === "role" &&
                    `This route is restricted to specific roles. Yours (${userRole}) isn't in the list.`}
                </p>
              </div>
            </div>

            {/* Your role */}
            {userRole && (
              <div className="flex items-start gap-3 p-4">
                <Users size={20} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">Your role</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-mono text-xs">
                    {userRole}
                  </span>
                </div>
              </div>
            )}

            {/* Your permissions */}
            {userPermissions.length > 0 && (
              <div className="flex items-start gap-3 p-4">
                <ShieldOff
                  size={20}
                  className="text-gray-400 mt-0.5 shrink-0"
                />
                <div>
                  <p className="font-medium text-gray-800 mb-2">
                    Permissions your role has
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {userPermissions.map((perm) => {
                      const isRequired = perm === params.get("required");
                      return (
                        <span
                          key={perm}
                          className={`px-2 py-0.5 rounded font-mono text-xs ${
                            isRequired
                              ? "bg-orange-100 text-orange-700 ring-1 ring-orange-300"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {perm}
                        </span>
                      );
                    })}
                  </div>
                  {params.get("required") && (
                    <p className="mt-2 text-xs text-orange-600">
                      ↑ Required permission not found:{" "}
                      <code className="font-mono">
                        {params.get("required")}
                      </code>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Fix hint */}
            <div className="p-4 bg-gray-50 rounded-b-2xl">
              <p className="text-xs text-gray-400">
                <span className="font-medium text-gray-500">How to fix: </span>
                {reason === "permission" &&
                  `Ask an admin to update the RBAC_PERMISSIONS map for the "${userRole}" role to include "${params.get("required")}".`}
                {reason === "role" &&
                  `Ask an admin to assign a role that has access to this page, or check if you're logged in with the correct account.`}
              </p>
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex gap-3">
          {config.canRetry && (
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition text-sm font-medium"
            >
              <RefreshCw size={16} className={retrying ? "animate-spin" : ""} />
              Try again
            </button>
          )}
          {config.canGoHome && (
            <button
              onClick={handleGoHome}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-100 transition text-sm font-medium text-gray-700"
            >
              <Home size={16} />
              Go home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
