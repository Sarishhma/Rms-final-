import { VALIDATION } from "@/utils/constant";
import { type CustomerFormData } from "@/zod/table.schema";
import { useCreateCustomer } from "../hooks/useCreateCustomerhook";

interface CustomerFormProps {
  formData: CustomerFormData;
  onFieldChange: (field: keyof CustomerFormData, value: string) => void;
  errors?: Partial<Record<keyof CustomerFormData, string>>;
  onSuccess?: (customer: any) => void;
}
export function CustomerForm({
  formData,
  onFieldChange,
  errors = {},
}: CustomerFormProps) {
  const { mutateAsync, isPending } = useCreateCustomer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await mutateAsync(formData);

      // Reset form after successful creation
      onFieldChange("name", "");
      onFieldChange("phone", "");
      onFieldChange("email", "");
      onFieldChange("notes", "");
    } catch (error) {
      console.error("Customer creation failed:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        label="Full Name"
        placeholder="Enter customer name"
        value={formData.name}
        onChange={(value) => onFieldChange("name", value)}
        required
        maxLength={VALIDATION.MAX_NAME_LENGTH}
        error={errors.name}
      />

      <FormField
        label="Phone Number"
        placeholder="Enter phone number"
        value={formData.phone}
        onChange={(value) => {
          const sanitized = value.replace(/[^\d+\-()\s]/g, "");
          onFieldChange("phone", sanitized);
        }}
        type="tel"
        required
        error={errors.phone}
      />

      <FormField
        label="Email"
        placeholder="Enter email address"
        value={formData.email ?? ""}
        onChange={(value) => onFieldChange("email", value)}
        type="email"
        error={errors.email}
      />

      <FormField
        label="Notes"
        placeholder="Enter notes (optional)"
        value={formData.notes ?? ""}
        onChange={(value) => onFieldChange("notes", value)}
        as="textarea"
        rows={4}
        error={errors.notes}
      />

      <div className="pt-4">
        <button
          type="submit"
          disabled={isPending || !formData.name.trim()}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium px-5 py-3 rounded-xl transition duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed text-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          {isPending ? "Creating..." : "Create Customer"}
        </button>
      </div>
    </form>
  );
}

interface FormFieldProps {
  label?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel" | "number";
  as?: "input" | "textarea";
  required?: boolean;
  maxLength?: number;
  rows?: number;
  error?: string;
}

function FormField({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  as = "input",
  required = false,
  maxLength,
  rows,
  error,
}: FormFieldProps) {
  const commonClasses = `w-full rounded-xl border bg-white/80 px-4 py-3 outline-none focus:ring-2 transition duration-200 text-sm ${
    error
      ? "border-red-300 focus:ring-red-400 bg-red-50/30"
      : "border-slate-200 focus:ring-orange-400"
  }`;

  return (
    <div className="flex flex-col mb-4">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {as === "textarea" ? (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          rows={rows}
          maxLength={maxLength}
          className={commonClasses}
          aria-label={label || placeholder}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          maxLength={maxLength}
          className={commonClasses}
          aria-label={label || placeholder}
        />
      )}

      {error && <span className="mt-1 text-xs text-red-500">{error}</span>}
    </div>
  );
}
