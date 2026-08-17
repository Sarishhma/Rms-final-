import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login } from "@/features/auth/service/auth";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useRoleRedirect } from "@/utils/useRoleRedirect";
import { RBAC_PERMISSIONS } from "@/utils/rbac.permissions";
import { LoginSchema, type LoginTypeForm } from "@/features/auth/schema/auth.schema";

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const redirectByRole = useRoleRedirect();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginTypeForm>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginTypeForm) => {
    try {
      const res = await login(data);
      const accessToken = res.data.accessToken ?? res.accessToken;
      const user = res.data?.user ?? res.user;
      const refreshToken = res.data.refreshToken ?? res.refreshToken;

      // Permissions come from the hardcoded RBAC map, not the backend
      const role = user?.role as keyof typeof RBAC_PERMISSIONS;
      const permissions = RBAC_PERMISSIONS[role] ?? [];

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("User", JSON.stringify(user));
      localStorage.setItem("permissions", JSON.stringify(permissions));

      // ✅ Route to the correct home based on role
      redirectByRole(user);

    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Invalid email or password"
      );
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50/50 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

      {/* Left — image */}
      <div className="hidden lg:block w-1/2 h-screen sticky top-0 bg-white border-r border-gray-100">
        <img
          src="/login.jpeg"
          alt="restaurant"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Right — form */}
      <div className="w-full lg:w-1/2 bg-white flex justify-center items-center min-h-screen px-4 sm:px-6 relative z-10">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-[2rem] border border-gray-200/50 shadow-xl shadow-slate-200/30">
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md shadow-orange-500/10 text-base">
                🍴
              </div>
              <span className="font-extrabold text-lg tracking-wider text-gray-900">RMS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back</h1>
            <p className="text-gray-400 mt-1.5 text-sm font-medium">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email</label>
              <input
                {...register("Email")}
                type="email"
                placeholder="you@example.com"
                className={`w-full rounded-xl border px-4 py-3.5 text-sm outline-none transition bg-gray-50/50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 ${
                  errors.Email ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" : "border-gray-200"
                }`}
              />
              {errors.Email && (
                <p className="text-xs text-red-500 mt-0.5">{errors.Email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Password</label>
              <div className="relative">
                <input
                  {...register("Password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border px-4 py-3.5 text-sm outline-none transition bg-gray-50/50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 pr-10 ${
                    errors.Password ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" : "border-gray-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.Password && (
                <p className="text-xs text-red-500 mt-0.5">{errors.Password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 py-3.5 text-sm font-bold text-white transition hover:shadow-lg hover:shadow-orange-500/10 active:scale-[0.98] disabled:opacity-60 shadow-md shadow-orange-500/10 cursor-pointer text-center"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}