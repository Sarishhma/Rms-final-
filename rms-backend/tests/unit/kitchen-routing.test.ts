import { describe, it, expect } from "vitest";
import { resolveStation, type RoutableMenuItem, type StationRef } from "../../src/modules/kitchen-stations/routing.js";

const st = (id: string): StationRef => ({ id, name: id.toUpperCase() });
const DEFAULT = st("default");

// sub: null = item has no subcategory; { station } = subcategory exists (station may be null)
const item = (
  itemStation: string | null,
  sub: { station: string | null } | null,
  catStation: string | null
): RoutableMenuItem => ({
  kitchenStation: itemStation ? st(itemStation) : null,
  subcategory: sub ? { kitchenStation: sub.station ? st(sub.station) : null } : null,
  category: { kitchenStation: catStation ? st(catStation) : null },
});

describe("resolveStation precedence", () => {
  it("item override beats subcategory, category, and default", () => {
    expect(resolveStation(item("grill", { station: "fry" }, "main"), DEFAULT).id).toBe("grill");
  });

  it("subcategory beats category and default when no item override", () => {
    expect(resolveStation(item(null, { station: "fry" }, "main"), DEFAULT).id).toBe("fry");
  });

  it("category applies when item has no subcategory and no override", () => {
    expect(resolveStation(item(null, null, "main"), DEFAULT).id).toBe("main");
  });

  it("category reaches items in a subcategory that has no own rule", () => {
    // subcategory present but unrouted -> falls through to the category rule
    expect(resolveStation(item(null, { station: null }, "main"), DEFAULT).id).toBe("main");
  });

  it("falls back to default when nothing is routed (no subcategory)", () => {
    expect(resolveStation(item(null, null, null), DEFAULT).id).toBe("default");
  });

  it("falls back to default when subcategory and category are both unrouted", () => {
    expect(resolveStation(item(null, { station: null }, null), DEFAULT).id).toBe("default");
  });

  it("carries the resolved station name for the KOT snapshot", () => {
    expect(resolveStation(item(null, { station: "fry" }, "main"), DEFAULT)).toEqual({ id: "fry", name: "FRY" });
  });
});
