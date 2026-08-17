import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, UserPlus, Loader2 } from "lucide-react";
import { useCreateCustomer } from "../hooks/useCreateCustomerhook";
import { customerFormSchema, type CustomerFormData } from "@/zod/table.schema";
import toast from "react-hot-toast";

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (customerId: string) => void;
}

export function AddCustomerModal({ isOpen, onClose, onSuccess }: AddCustomerModalProps) {
  const { mutate: createCustomer, isPending } = useCreateCustomer();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: { name: "", phone: "", email: "" },
  });

  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data: CustomerFormData) => {
    createCustomer(data, {
      onSuccess: (newCustomer) => {
        reset();
        onSuccess?.(newCustomer.id);
        onClose();
      },
      onError: (err: any) => {
        toast.error(err?.message ?? "Failed to create customer");
      },
    });
  };

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2 transition duration-200 shadow-sm ${
      hasError
        ? "border-red-300 focus:ring-red-400 bg-red-50/30"
        : "border-slate-200 focus:ring-orange-500"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 transform transition-all duration-200 scale-100">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors duration-200 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
            <UserPlus size={22} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              Add Customer
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Fill in the customer details below.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name")}
              placeholder="Enter customer name"
              className={inputClass(!!errors.name)}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              {...register("phone")}
              placeholder="98XXXXXXXX"
              type="tel"
              className={inputClass(!!errors.phone)}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email{" "}
            
            </label>
            <input
              {...register("email")}
              placeholder="customer@example.com"
              type="email"
              className={inputClass(!!errors.email)}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:flex-1 px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl transition duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isPending}
              className="w-full sm:flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition duration-200 shadow-sm hover:shadow flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting || isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus size={16} />
              )}
              {isSubmitting || isPending ? "Creating..." : "Add Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}