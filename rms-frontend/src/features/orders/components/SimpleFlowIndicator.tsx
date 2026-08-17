interface SimpleFlowIndicatorProps {
  flowStep: "editing" | "bill_ready" | "payment_open" | "paid";
}

export function SimpleFlowIndicator({ flowStep }: SimpleFlowIndicatorProps) {
  const statusMap: Record<
    "editing" | "bill_ready" | "payment_open" | "paid",
    { label: string; description: string; icon: string }
  > = {
    editing: {
      label: "Editing",
      description: "Add items, update quantities, and save changes",
      icon: "edit",
    },
    bill_ready: {
      label: "Bill Ready",
      description: "Review bill details, print or proceed to payment",
      icon: "document",
    },
    payment_open: {
      label: "Payment",
      description: "Enter payment details and complete the transaction",
      icon: "payment",
    },
    paid: {
      label: "Complete",
      description: "Order has been successfully paid",
      icon: "check",
    },
  };

  const current = statusMap[flowStep];

  return (
    <div className="bg-white border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              flowStep === "paid"
                ? "bg-emerald-500 text-white"
                : "bg-zinc-900 text-white"
            }`}
          >
            {flowStep === "paid" ? (
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <span>
                {flowStep === "editing"
                  ? "1"
                  : flowStep === "bill_ready"
                    ? "2"
                    : "3"}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              {current.label}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">{current.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
