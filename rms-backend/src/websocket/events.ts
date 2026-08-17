export const websocketEvents = {
  orderUpdated: "order.updated",
  kotUpdated: "kot.updated",
  tableUpdated: "table.updated",
  billUpdated: "bill.updated",
  paymentUpdated: "payment.updated",
  stockUpdated: "stock.updated"
} as const;

export type WebsocketEvent = (typeof websocketEvents)[keyof typeof websocketEvents];
