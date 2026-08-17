import { describe, it, expect } from "vitest";
import { reportMetrics } from "../../src/modules/reports/domain/report-metrics.js";

describe("Report Metrics", () => {
  it("calculates expected cash correctly", () => {
    const openingCash = 100;
    const cashPayments = 500;
    const cashPayIn = 50;
    const cashRefunds = 25;
    const cashPayOut = 10;
    
    const expected = reportMetrics.calculateExpectedCash(openingCash, cashPayments, cashPayIn, cashRefunds, cashPayOut);
    expect(expected).toBe(615); // 100 + 500 + 50 - 25 - 10 = 615
  });

  it("calculates cash difference correctly", () => {
    const actualClosingCash = 610;
    const expectedCash = 615;
    
    const diff = reportMetrics.calculateCashDifference(actualClosingCash, expectedCash);
    expect(diff).toBe(-5);
  });

  it("calculates risk score correctly based on defined weights", () => {
    // (orderVoids * 5) + (paymentVoids * 5) + (refunds * 4) + (discounts * 2) + (stockAdjustments * 3) + (cashDrawerAdjustments * 5)
    const score = reportMetrics.calculateRiskScore(2, 1, 3, 5, 2, 1);
    // (2 * 5) + (1 * 5) + (3 * 4) + (5 * 2) + (2 * 3) + (1 * 5)
    // 10 + 5 + 12 + 10 + 6 + 5 = 48
    expect(score).toBe(48);
  });

  it("calculates gross profit correctly", () => {
    expect(reportMetrics.calculateGrossProfit(1000, 400)).toBe(600);
  });

  it("calculates gross margin percentage correctly", () => {
    expect(reportMetrics.calculateGrossMarginPct(600, 1000)).toBe(60);
    expect(reportMetrics.calculateGrossMarginPct(0, 0)).toBe(0);
  });

  it("calculates net collection correctly", () => {
    expect(reportMetrics.calculateNetCollection(1000, 150)).toBe(850);
  });
});
