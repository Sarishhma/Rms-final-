import { RBAC_PERMISSIONS } from "./rbac.permissions";

type Role = keyof typeof RBAC_PERMISSIONS;

export function hasPermission(
  role: string | undefined,
  permission: string,
): boolean {
  if (!role || !(role in RBAC_PERMISSIONS)) return false;
  return RBAC_PERMISSIONS[role as Role]?.includes(permission) ?? false;
}