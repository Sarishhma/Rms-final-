import { describe, it, expect } from "vitest";
import {
  normalizeInstructions,
  orderItemKeyFromInput,
  orderItemKeyFromExisting,
} from "../../src/modules/orders/service.js";

const MENU = "11111111-1111-1111-1111-111111111111";
const VARIANT = "22222222-2222-2222-2222-222222222222";
const ADDON = "33333333-3333-3333-3333-333333333333";

const existing = (over: Partial<Parameters<typeof orderItemKeyFromExisting>[0]> = {}) => ({
  menuItemId: MENU,
  variantId: null,
  specialInstructions: null,
  addons: [] as Array<{ addonId: string; quantity: number }>,
  ...over,
});

describe("normalizeInstructions", () => {
  it("treats blank / whitespace-only notes as null", () => {
    expect(normalizeInstructions(undefined)).toBeNull();
    expect(normalizeInstructions(null)).toBeNull();
    expect(normalizeInstructions("")).toBeNull();
    expect(normalizeInstructions("   ")).toBeNull();
  });

  it("keeps and trims real notes", () => {
    expect(normalizeInstructions("  no onion ")).toBe("no onion");
  });
});

describe("order reconciliation keys", () => {
  it("matches a line whose only difference is blank-note vs null (the recreate-all bug)", () => {
    // Client sends "" for an empty note; the persisted row is null.
    const inputKey = orderItemKeyFromInput({ menuItemId: MENU, quantity: 1, specialInstructions: "", addonIds: [] });
    const existingKey = orderItemKeyFromExisting(existing());
    expect(inputKey).toBe(existingKey);
  });

  it("matches when notes differ only by surrounding whitespace", () => {
    const inputKey = orderItemKeyFromInput({ menuItemId: MENU, quantity: 2, specialInstructions: "  no onion ", addonIds: [] });
    const existingKey = orderItemKeyFromExisting(existing({ specialInstructions: "no onion" }));
    expect(inputKey).toBe(existingKey);
  });

  it("does NOT match when the note genuinely changes", () => {
    const inputKey = orderItemKeyFromInput({ menuItemId: MENU, quantity: 1, specialInstructions: "extra cheese", addonIds: [] });
    const existingKey = orderItemKeyFromExisting(existing({ specialInstructions: "no onion" }));
    expect(inputKey).not.toBe(existingKey);
  });

  it("matches identical variant + addon lines regardless of addonIds order", () => {
    const inputKey = orderItemKeyFromInput({
      menuItemId: MENU,
      variantId: VARIANT,
      quantity: 1,
      addonIds: [ADDON, MENU],
    });
    const existingKey = orderItemKeyFromExisting(
      existing({
        variantId: VARIANT,
        addons: [
          { addonId: MENU, quantity: 1 },
          { addonId: ADDON, quantity: 1 },
        ],
      }),
    );
    expect(inputKey).toBe(existingKey);
  });
});
