/**
 * usePermissions.ts
 *
 * Returns the current user's permissions.
 * Reads from localStorage (set at login) so it works outside React context too.
 * Use `has(perm)` to check a single permission anywhere in the UI.
 */

export const usePermissions = () => {
  const permissions: string[] = JSON.parse(
    localStorage.getItem("permissions") || "[]"
  );

  return {
    permissions,
    /** Returns true if the user holds the given permission */
    has: (perm: string) => permissions.includes(perm),
    /** Returns true if the user holds ALL of the given permissions */
    hasAll: (perms: string[]) => perms.every((p) => permissions.includes(p)),
    /** Returns true if the user holds ANY of the given permissions */
    hasAny: (perms: string[]) => perms.some((p) => permissions.includes(p)),
  };
};
