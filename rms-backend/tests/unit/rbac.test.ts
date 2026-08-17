import { describe, expect, it } from "vitest";
import { hasPermission, rolePermissions } from "../../src/modules/rbac/service.js";

describe("RBAC permissions", () => {
  it("grants inventory permissions to company admins", () => {
    expect(rolePermissions.ADMIN).toContain("inventory:read");
    expect(rolePermissions.ADMIN).toContain("inventory:write");
    expect(hasPermission("ADMIN", "inventory:read")).toBe(true);
    expect(hasPermission("ADMIN", "inventory:write")).toBe(true);
  });
});
