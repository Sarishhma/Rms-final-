export const ReportKPIDefinitions = {
  GROSS_SALES: "Bill subtotal before discount/tax",
  DISCOUNT: "Total discount amount",
  TAX_COLLECTED: "Tax amount",
  NET_BILL_AMOUNT: "Final bill grand total",
  COLLECTED_AMOUNT: "Completed payments",
  REFUNDED_AMOUNT: "Completed refunds",
  NET_COLLECTION: "Completed payments - completed refunds",
  COGS: "Quantity * unitCost",
  GROSS_PROFIT: "Revenue - COGS",
  GROSS_MARGIN_PCT: "GrossProfit / Revenue * 100",
  EXPECTED_CASH: "openingCash + cashPayments + cashPayIn - cashRefunds - cashPayOut",
  CASH_DIFFERENCE: "actualClosingCash - expectedCash",
  RISK_SCORE: "(orderVoids * 5) + (paymentVoids * 5) + (refunds * 4) + (discounts * 2) + (stockAdjustments * 3) + (cashDrawerAdjustments * 5)"
};
