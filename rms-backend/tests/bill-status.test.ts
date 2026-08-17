import { describe, expect, it } from "vitest";
import {
  billStatusForPayment,
  billStatusForRefund
} from "../src/modules/billing/service.js";
import { D } from "../src/utils/money.js";

describe("billStatusForPayment", () => {
  it("preserves VOIDED terminal state", () => {
    expect(billStatusForPayment(D(100), D(100), "VOIDED")).toBe("VOIDED");
  });

  it("preserves REFUNDED terminal state", () => {
    expect(billStatusForPayment(D(0), D(100), "REFUNDED")).toBe("REFUNDED");
  });

  it("returns OPEN when nothing is paid", () => {
    expect(billStatusForPayment(D(0), D(100), "OPEN")).toBe("OPEN");
  });

  it("returns PARTIALLY_PAID when paid is less than grand total", () => {
    expect(billStatusForPayment(D(30), D(100), "OPEN")).toBe("PARTIALLY_PAID");
  });

  it("returns PAID when paid equals grand total", () => {
    expect(billStatusForPayment(D(100), D(100), "OPEN")).toBe("PAID");
  });

  it("treats overpayment as PAID", () => {
    // Service layer rejects this earlier, but pure function shouldn't crash.
    expect(billStatusForPayment(D(120), D(100), "OPEN")).toBe("PAID");
  });
});

describe("billStatusForRefund", () => {
  it("preserves VOIDED terminal state", () => {
    expect(billStatusForRefund(D(0), D(100), "VOIDED")).toBe("VOIDED");
  });

  it("returns REFUNDED when net paid drops to zero", () => {
    expect(billStatusForRefund(D(0), D(100), "PAID")).toBe("REFUNDED");
  });

  it("returns REFUNDED on negative residual (shouldn't happen but stable)", () => {
    expect(billStatusForRefund(D(-10), D(100), "PAID")).toBe("REFUNDED");
  });

  it("returns PARTIALLY_PAID after a partial refund", () => {
    expect(billStatusForRefund(D(40), D(100), "PAID")).toBe("PARTIALLY_PAID");
  });

  it("returns PAID when nothing was refunded yet", () => {
    expect(billStatusForRefund(D(100), D(100), "PAID")).toBe("PAID");
  });
});
