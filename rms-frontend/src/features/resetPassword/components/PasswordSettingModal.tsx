import { useState, type Dispatch, type SetStateAction } from "react";
import { Lock, KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { ResetStaffPasswordForm } from "./ResetStaffPasswordForm";

type Tab = "change" | "reset";

interface PasswordSettingsModalProps {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  canResetStaff?: boolean;
}

export default function PasswordSettingsModal({
  open,
  onOpenChange,
  canResetStaff,
}: PasswordSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("change");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-auto my-auto p-0 overflow-hidden rounded-2xl border-0 shadow-2xl bg-white max-h-[85vh] flex flex-col">
        <div className="h-1 bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600" />

        <DialogHeader className="px-8 pt-8 pb-5">
          <DialogTitle className="text-xl  font-semibold text-slate-800">
            Password Settings
          </DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex gap-2 px-6 pb-2">
          <button
            onClick={() => setActiveTab("change")}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-all ${
              activeTab === "change"
                ? "bg-slate-900 text-white"
                : "bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600"
            }`}
          >
            <Lock className="w-3.5 h-3.5" strokeWidth={1.75} />
            Change Mine
          </button>

          {canResetStaff && (
            <button
              onClick={() => setActiveTab("reset")}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                activeTab === "reset"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" strokeWidth={1.75} />
              Reset Staff
            </button>
          )}
        </div>

        <div className="px-6 pb-6 overflow-y-auto">
          {activeTab === "change" || !canResetStaff ? (
            <ChangePasswordForm open={open} />
          ) : (
            <ResetStaffPasswordForm />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}