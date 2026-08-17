import { X } from "lucide-react";
import type { Refund } from "../types/refund.types";

interface RefundDetailDrawerProps {
  refund: Refund | null;
  onClose: () => void;
}

export function RefundDetailDrawer({ refund, onClose }: RefundDetailDrawerProps) {
  if (!refund) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="relative w-full sm:w-[420px] bg-white h-full shadow-xl p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800">Refund Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="space-y-4">
          <DetailRow label="Bill Number" value={refund.payment.bill.billNumber} />
          <DetailRow label="Refund Amount" value={`Rs. ${Number(refund.amount).toLocaleString()}`} />
          <DetailRow label="Original Payment" value={`Rs. ${Number(refund.payment.amount).toLocaleString()}`} />
          <DetailRow label="Method" value={refund.method} />
          <DetailRow label="Status" value={refund.status} />
          <DetailRow label="Reason" value={refund.reason} />
          <DetailRow label="Reference" value={refund.reference ?? "—"} />
          <DetailRow label="Processed By" value={refund.processedBy.name} />
          <DetailRow
            label="Date"
            value={new Date(refund.createdAt).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 pb-3 border-b border-slate-100 last:border-0">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <span className="text-sm text-slate-700">{value}</span>
    </div>
  );
}