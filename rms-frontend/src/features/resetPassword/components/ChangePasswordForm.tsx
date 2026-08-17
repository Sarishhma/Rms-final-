import { useEffect, useState } from "react";
import { Lock, CheckCircle, Loader2 } from "lucide-react";
import { useChangePassword } from "../hooks/useChangePassword";
import { changePasswordSchema } from "../schema/Password.schema";
import { PasswordField } from "./PasswordField";
import { useLogOutAll } from "@/features/auth/hook/useLogOutAll";

interface ChangePasswordFormProps {
  open: boolean;
}
export function ChangePasswordForm({open}:ChangePasswordFormProps) {
  const changePasswordMutation = useChangePassword();
const logoutAllMutation = useLogOutAll()
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
  };
   useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleSubmit = () => {
    const result = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    changePasswordMutation.mutate(
      {
        currentPassword: result.data.currentPassword,
        newPassword: result.data.newPassword,
      },
      {
        onSuccess: () => {
          setError("");
          setSuccess(true);
         logoutAllMutation.mutate(undefined,{
          onSettled:()=>{
            setTimeout(()=>{
              window.location.href=("/")
            },1500)
          }
         })
        },
        onError: (err: any) => {
          setError(err?.response?.data?.message || "Failed to change password");
        },
      }
    );
  };

  return (
    <div className="space-y-4 mt-6 ">
      <div>
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Lock className="w-4 h-4 text-teal-600" />
          Change My Password
        </h2>
        <p className="text-sm text-slate-500 mt-2">Update your own account password</p>
      </div>
      
        
   <PasswordField value={currentPassword} onChange={setCurrentPassword} placeholder="Current password" />
      <PasswordField value={newPassword} onChange={setNewPassword} placeholder="New password" />
      <PasswordField value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm new password" />

      

     

      {error && (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-50 border border-red-200">
          <span className="text-red-500 text-sm">⚠</span>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-green-50 border border-green-200">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm font-medium text-green-700">Password changed successfully!</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={changePasswordMutation.isPending || success}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white text-sm font-medium hover:from-teal-700 hover:to-teal-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-teal-500/30"
      >
        {changePasswordMutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Changing...
          </span>
        ) : success ? (
          <span className="flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Changed
          </span>
        ) : (
          "Change Password"
        )}
      </button>
    </div>
  );
}

