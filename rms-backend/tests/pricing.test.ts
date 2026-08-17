import { describe, expect, it } from "vitest";
import { calculateBillTotals } from "../src/modules/billing/service.js";
import { calculateTotals } from "../src/modules/orders/service.js";
import { D } from "../src/utils/money.js";

describe("orders calculateTotals", () => {
  it("computes subtotal minus discount as grand total", () => {
    const totals = calculateTotals(
      [{ lineSubtotal: D(100) }, { lineSubtotal: D(50) }],
    );
    expect(totals.subtotal).toEqual(D(150));
    expect(totals.grandTotal).toEqual(D(150));
  });

  it("applies discount", () => {
    const totals = calculateTotals(
      [{ lineSubtotal: D(100) }],
      D(20)
    );
    expect(totals.discountAmount).toEqual(D(20));
    expect(totals.grandTotal).toEqual(D(80));
  });

  it("rejects discount greater than subtotal", () => {
    expect(() =>
      calculateTotals([{ lineSubtotal: D(10) }], D(20))
    ).toThrow(/Discount cannot exceed subtotal/);
  });

  it("handles empty items as zero everything", () => {
    const totals = calculateTotals([]);
    expect(totals).toEqual({
      subtotal: D(0),
      discountAmount: D(0),
      discountPercentage: D(0),
      grandTotal: D(0)
    });
  });
});

describe("billing calculateBillTotals", () => {
  it("yields due === grandTotal on first generation", () => {
    const totals = calculateBillTotals(D(150), D(0));
    expect(totals.due).toEqual(totals.grandTotal);
  });

  it("matches order pricing for the same inputs", () => {
    const order = calculateTotals(
      [{ lineSubtotal: D(150) }],
      D(10)
    );
    const bill = calculateBillTotals(D(150), D(10));
    expect(bill.subtotal).toEqual(order.subtotal);
    expect(bill.grandTotal).toEqual(order.grandTotal);
  });

  it("rejects discount greater than subtotal", () => {
    expect(() => calculateBillTotals(D(10), D(20))).toThrow(
      /Discount cannot exceed subtotal/
    );
  });
});
