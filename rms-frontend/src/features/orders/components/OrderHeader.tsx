interface OrderHeaderProps {
  order: any;
  isLocked: boolean;
  flowStep: "editing" | "bill_ready" | "payment_open" | "paid";
  onCancel: () => void;
  onVoid: () => void;
}

interface StatusBadgeProps {
  label: string;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
  CONFIRMED: "bg-sky-50 text-sky-700 border border-sky-200",
  CANCELLED: "bg-red-50 text-red-600 border border-red-200",
  VOIDED: "bg-zinc-100 text-zinc-500 border border-zinc-200",
  PAID: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  UNPAID: "bg-orange-50 text-orange-700 border border-orange-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

function StatusBadge({ label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase ${
        statusColors[label] ??
        "bg-zinc-100 text-zinc-500 border border-zinc-200"
      }`}
    >
      {label}
    </span>
  );
}

export function OrderHeader({
  order,
  isLocked,
  flowStep,
  onCancel,
  onVoid,
}: OrderHeaderProps) {
  // Only show cancel/void in editing step and if not locked
  const showOrderControls = !isLocked && flowStep === "editing";

  return (
    <div className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={() => window.history.back()}
          className="p-2 rounded-lg hover:bg-zinc-100 transition text-zinc-500"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold text-zinc-900 tracking-tight">
              Order #{order.orderNumber}
            </h1>
            <StatusBadge label={order.status} />
            <StatusBadge label={order.paymentStatus} />
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            {order.table ? `Table ${order.table.name} · ` : ""}
            {order.channel}
            {order.guestCount
              ? ` · ${order.guestCount} guest${order.guestCount !== 1 ? "s" : ""}`
              : ""}
          </p>
        </div>
      </div>

      {showOrderControls && (
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3.5 py-2 rounded-lg border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition"
          >
            Cancel Order
          </button>
          <button
            onClick={onVoid}
            className="px-3.5 py-2 rounded-lg border border-orange-200 text-orange-500 text-xs font-semibold hover:bg-orange-50 transition"
          >
            Void
          </button>
        </div>
      )}

      {isLocked && (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 bg-zinc-100 px-3 py-1.5 rounded-full">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
          Order locked
        </span>
      )}
    </div>
  );
}
