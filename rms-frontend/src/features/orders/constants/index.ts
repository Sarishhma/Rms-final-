export const ORDER_STATUSES = {
  PENDING: "pending",
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  VOIDED: "voided",
} as const;

export const ORDER_STATUS_LABELS = {
  pending: "Pending",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
  voided: "Voided",
} as const;

export const ORDER_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  active: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
  voided: "bg-red-100 text-red-800",
} as const;

export const KOT_STATUSES = {
  PENDING: "pending",
  COOKING: "cooking",
  READY: "ready",
  SERVED: "served",
  CANCELLED: "cancelled",
} as const;
