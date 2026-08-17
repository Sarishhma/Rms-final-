import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BASE_URL;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket"],
  // ── Built-in reconnection with back-off ──────────────────────────────────
  // socket.io will wait reconnectionDelay * (reconnectionDelayMax factor)
  // between each attempt, capped at reconnectionDelayMax
  reconnection: true,
  reconnectionAttempts: 5, // stop after 5 failed attempts (not infinite)
  reconnectionDelay: 2000, // start at 2s
  reconnectionDelayMax: 30_000, // cap at 30s
  randomizationFactor: 0.3, // jitter so clients don't all hit at once

  // ── Token sent on every connect / reconnect ──────────────────────────────
  auth: (cb) => {
    cb({ token: localStorage.getItem("accessToken") });
  },
});


export const websocketEvents = {
  orderUpdated: "order.updated",
  kotUpdated: "kot.updated",
  tableUpdated: "table.updated",
  billUpdated: "bill.updated",
  paymentUpdated: "payment.updated",
  stockUpdated: "stock.updated",
} as const;

export type websocketEvents =
  (typeof websocketEvents)[keyof typeof websocketEvents];

export const socketQueryMap: Record<websocketEvents, string[][]> = {
  [websocketEvents.orderUpdated]: [["orders"], ["tables"]], 
  [websocketEvents.kotUpdated]: [["orders"], ["tables"]],
  [websocketEvents.tableUpdated]: [["tables"]],
  [websocketEvents.billUpdated]: [["bills"]],
  [websocketEvents.paymentUpdated]: [["payments"], ["orders"]],
  [websocketEvents.stockUpdated]: [["stock"]], 
};
