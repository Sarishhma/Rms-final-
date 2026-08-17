import { useState } from "react";
import toast from "react-hot-toast";

interface CancelModalProps {
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function CancelModal({ onClose, onConfirm }: CancelModalProps) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900">Cancel Order</h2>
            <p className="text-xs text-zinc-500">
              This action cannot be undone.
            </p>
          </div>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for cancellation..."
          rows={3}
          className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition"
          >
            Keep Order
          </button>
          <button
            onClick={() => {
              if (!reason.trim()) {
                toast.error("Cancellation reason is required");
                return;
              }
              onConfirm(reason);
            }}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition"
          >
            Confirm Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
