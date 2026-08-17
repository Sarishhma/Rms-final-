import { describe, expect, it } from "vitest";
import { app } from "../../src/app.js";

// Hono's zValidator middleware runs BEFORE auth in some setups, but here 
// auth runs first. So to test validation, we either need a mocked auth 
// or we test paths that might bypass auth (none do).
// We'll mock the requireAuth middleware.
import * as auth from "../../src/middleware/auth.js";
import { vi } from "vitest";

vi.mock("../../src/middleware/auth.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/middleware/auth.js")>();
  return {
    ...actual,
    requireAuth: async (c: any, next: any) => {
      // Mock an authenticated user
      c.set("authUser", { id: "user-1", companyId: "comp-1", role: "ADMIN" });
      await next();
    }
  };
});

describe("Orders API Validation", () => {
  it("rejects order creation with invalid item schema", async () => {
    const res = await app.request("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ menuItemId: "not-a-uuid", quantity: -1 }]
      })
    });
    
    // Zod validation should fail
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("BAD_REQUEST");
  });

  it("rejects order creation with invalid channel", async () => {
    const res = await app.request("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: "INVALID_CHANNEL",
        items: []
      })
    });
    
    expect(res.status).toBe(400);
  });

  it("rejects order creation with negative guest count", async () => {
    const res = await app.request("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: "DINE_IN",
        guestCount: -5,
        items: []
      })
    });
    
    expect(res.status).toBe(400);
  });
});
