import { X } from "lucide-react";
import { OpenShiftForm } from "./OpenShiftForm";

interface OpenShiftModalProps {
  open: boolean;
  onClose: () => void;
}

export function OpenShiftModal({ open, onClose }: OpenShiftModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 bg-white border border-slate-200 rounded-full p-1.5 shadow-md hover:bg-slate-50 transition-all"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
        <OpenShiftForm onSuccess={onClose} />
      </div>
    </div>
  );
}