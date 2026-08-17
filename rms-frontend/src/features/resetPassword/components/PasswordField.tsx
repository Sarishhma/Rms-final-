import { useState } from "react";
import {  Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}

export function PasswordField({ value, onChange, placeholder }: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-5 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        tabIndex={-1}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
} 