import { describe, it, expect } from "vitest";
import { planAdditive } from "../../src/modules/orders/service.js";
import type { OrderItemInput } from "../../src/modules/orders/types.js";

const BURGER = "11111111-1111-1111-1111-111111111111";
const PIZZA = "22222222-2222-2222-2222-222222222222";
const LARGE = "33333333-3333-3333-3333-333333333333";
const CHEESE = "44444444-4444-4444-4444-444444444444";

let seq = 0;
const existing = (over: Partial<Parameters<typeof planAdditive>[0][number]> = {}) => ({
  id: `oi-${seq++}`,
  menuItemId: BURGER,
  variantId: null as string | null,
  specialInstructions: null as string | null,
  quantity: 1,
  addons: [] as Array<{ addonId: string; quantity: number }>,
  ...over,
});

const req = (over: Partial<OrderItemInput> = {}): OrderItemInput => ({
  menuItemId: BURGER,
  quantity: 1,
  addonIds: [],
  ...over,
});

describe("planAdditive", () => {
  it("adding a new item never touches existing lines (the reported bug)", () => {
    const burger = existing();
    const plan = planAdditive([burger], [req({ menuItemId: PIZZA })]);
    expect(plan.increments).toEqual([]);
    expect(plan.additions.map((a) => a.menuItemId)).toEqual([PIZZA]);
  });

  it("adding an item already on the order increments that line by the sent qty", () => {
    const burger = existing({ quantity: 2 });
    const plan = planAdditive([burger], [req({ quantity: 3 })]);
    expect(plan.increments).toEqual([{ existing: burger, addQuantity: 3 }]);
    expect(plan.additions).toEqual([]);
  });

  it("blank note vs stored null still counts as the same line", () => {
    const burger = existing({ specialInstructions: null });
    const plan = planAdditive([burger], [req({ specialInstructions: "  " })]);
    expect(plan.increments.map((i) => i.existing.id)).toEqual([burger.id]);
    expect(plan.additions).toEqual([]);
  });

  it("a different note is a new add-on line, not an increment", () => {
    const burger = existing({ specialInstructions: "no onion" });
    const plan = planAdditive([burger], [req({ specialInstructions: "extra cheese" })]);
    expect(plan.increments).toEqual([]);
    expect(plan.additions.map((a) => a.specialInstructions)).toEqual(["extra cheese"]);
  });

  it("a different addon set is a new add-on line", () => {
    const burger = existing();
    const plan = planAdditive([burger], [req({ addonIds: [CHEESE] })]);
    expect(plan.increments).toEqual([]);
    expect(plan.additions).toHaveLength(1);
  });

  it("a different variant is a new line", () => {
    const plan = planAdditive([existing()], [req({ variantId: LARGE })]);
    expect(plan.increments).toEqual([]);
    expect(plan.additions.map((a) => a.variantId)).toEqual([LARGE]);
  });

  it("mixes increments and additions in one payload", () => {
    const burger = existing();
    const plan = planAdditive([burger], [req(), req({ menuItemId: PIZZA })]);
    expect(plan.increments.map((i) => i.existing.id)).toEqual([burger.id]);
    expect(plan.additions.map((a) => a.menuItemId)).toEqual([PIZZA]);
  });

  it("two identical existing lines: one increment consumes only one line", () => {
    const a = existing();
    const b = existing();
    const plan = planAdditive([a, b], [req({ quantity: 1 })]);
    expect(plan.increments).toHaveLength(1);
    expect([a.id, b.id]).toContain(plan.increments[0]?.existing.id);
    expect(plan.additions).toEqual([]);
  });
});
