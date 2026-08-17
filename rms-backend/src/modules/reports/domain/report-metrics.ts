export const reportMetrics = {
  calculateExpectedCash: (
    openingCash: number,
    cashPayments: number,
    cashPayIn: number,
    cashRefunds: number,
    cashPayOut: number
  ) => {
    return Number((openingCash + cashPayments + cashPayIn - cashRefunds - cashPayOut).toFixed(2));
  },

  calculateCashDifference: (actualClosingCash: number, expectedCash: number) => {
    return Number((actualClosingCash - expectedCash).toFixed(2));
  },

  calculateRiskScore: (
    orderVoids: number,
    paymentVoids: number,
    refunds: number,
    discounts: number,
    stockAdjustments: number,
    cashDrawerAdjustments: number
  ) => {
    return (
      (orderVoids * 5) +
      (paymentVoids * 5) +
      (refunds * 4) +
      (discounts * 2) +
      (stockAdjustments * 3) +
      (cashDrawerAdjustments * 5)
    );
  },

  calculateGrossProfit: (revenue: number, cogs: number) => {
    return Number((revenue - cogs).toFixed(2));
  },

  calculateGrossMarginPct: (grossProfit: number, revenue: number) => {
    if (revenue === 0) return 0;
    return Number(((grossProfit / revenue) * 100).toFixed(2));
  },

  calculateNetCollection: (completedPayments: number, completedRefunds: number) => {
    return Number((completedPayments - completedRefunds).toFixed(2));
  }
};
