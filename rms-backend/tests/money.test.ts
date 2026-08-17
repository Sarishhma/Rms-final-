import { describe, expect, it } from "vitest";
import { applyBps, percentageOf } from "../src/utils/money.js";

describe("applyBps", () => {
  it("computes 13% on a flat amount", () => {
    expect(applyBps(10000, 1300)).toBe(1300);
  });

  it("rounds half to nearest integer (banker's? no — JS Math.round)", () => {
    // 1234 * 1300 / 10000 = 160.42 → 160
    expect(applyBps(1234, 1300)).toBe(160);
    // 1235 * 1300 / 10000 = 160.55 → 161
    expect(applyBps(1235, 1300)).toBe(161);
  });

  it("returns zero for zero rate", () => {
    expect(applyBps(99999, 0)).toBe(0);
  });

  it("returns zero for zero base", () => {
    expect(applyBps(0, 1300)).toBe(0);
  });

  it("handles 100% (10000bps)", () => {
    expect(applyBps(5000, 10000)).toBe(5000);
  });
});

describe("percentageOf", () => {
  it("matches legacy float-based math", () => {
    expect(percentageOf(10000, 0.13)).toBe(1300);
    expect(percentageOf(10000, 0.1)).toBe(1000);
  });
});
