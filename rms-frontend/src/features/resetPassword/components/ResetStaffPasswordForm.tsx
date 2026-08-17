import { useState } from "react";
import { Lock, Search, User as UserIcon, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import type { Staff } from "@/features/staff/services/staff.service";
import { useStaff } from "@/features/staff/hooks/useStaff";
import { useResetPassword } from "../hooks/useResetPassword";
import { resetPasswordSchema } from "../schema/Password.schema";
import { PasswordField } from "./PasswordField";

export function ResetStaffPasswordForm() {
  const { data: staffList } = useStaff();
  const resetPasswordMutation = useResetPassword();

  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<Staff | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const staffResults = (staffList ?? []).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setSearch("");
    setSelectedUser(null);
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
  };

  const handleSubmit = () => {
    if (!selectedUser) {
      setError("Please select a staff member");
      return;
    }

    const result = resetPasswordSchema.safeParse({ newPassword, confirmPassword });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    resetPasswordMutation.mutate(
      { userId: selectedUser.id, newPassword: result.data.newPassword },
      {
        onSuccess: () => {
          setError("");
          setSuccess(true);
          setTimeout(resetForm, 1500);
        },
        onError: (err: any) => {
          setError(err?.response?.data?.message || "Failed to reset password");
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mt-4 mb-3">
          <Lock className="w-4 h-4 text-teal-600" />
          Reset Staff Password
        </h2>
        <p className="text-sm text-slate-500">
          {!selectedUser
            ? "Search and select a staff member to reset their password"
            : `Resetting password for ${selectedUser.name}`}
        </p>
      </div>

      {!selectedUser ? (
        <>
          <div className="relative ">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
              autoFocus
            />
          </div>

          <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-1.5">
            {staffResults.length > 0 ? (
              staffResults.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedUser(s)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-teal-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    <UserIcon size={16} className="text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{s.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{s.role}</p>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">
                {search ? "No staff members found" : "Start typing to search"}
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-50 border border-red-200">
              <span className="text-red-500 text-sm">⚠</span>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-teal-50 border border-teal-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-200 flex items-center justify-center">
                <UserIcon size={18} className="text-teal-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">{selectedUser.name}</p>
                <p className="text-xs text-slate-500 capitalize">{selectedUser.role}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-teal-700 hover:bg-teal-200/50"
            >
              <ArrowLeft size={14} />
              Change
            </button>
          </div>

          <div className="space-y-3">
          <PasswordField value={newPassword} onChange={setNewPassword} placeholder="New password" />
<PasswordField value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm new password" />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-50 border border-red-200">
              <span className="text-red-500 text-sm">⚠</span>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-green-50 border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-700">Password reset successfully!</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={resetPasswordMutation.isPending || success}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white text-sm font-medium hover:from-teal-700 hover:to-teal-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-teal-500/30"
          >
            {resetPasswordMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Resetting...
              </span>
            ) : success ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Reset Complete
              </span>
            ) : (
              "Reset Password"
            )}
          </button>
        </>
      )}
    </div>
  );
}