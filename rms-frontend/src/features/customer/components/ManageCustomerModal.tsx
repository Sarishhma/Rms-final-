import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, UserCog, Loader2, Pencil, Trash2 } from "lucide-react";
import { useUpdateCustomer } from "../hooks/useUpdateCustomer.hook";
import { useDeleteCustomer } from "../hooks/useDeleteCustomer";
import { useConfirm } from "@/providers/ConfirmProvider";
import { customerFormSchema, type CustomerFormData } from "@/zod/table.schema";
import type { Customer } from "../types";

interface ManageCustomerModalProps {
  customer: Customer;
  onClose: () => void;
}

export function ManageCustomerModal({ customer, onClose }: ManageCustomerModalProps) {
  const confirm = useConfirm();
  const { mutate: updateCustomer, isPending: isUpdating } = useUpdateCustomer();
  const { mutate: deleteCustomer, isPending: isDeleting } = useDeleteCustomer();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? "",
    },
  });

  useEffect(() => {
    reset({
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? "",
    });
  }, [customer, reset]);

  const onSubmit = (data: CustomerFormData) => {
    // Strip empty email so backend receives undefined instead of ""
    const payload = {
      name: data.name,
      phone: data.phone,
      ...(data.email?.trim() ? { email: data.email.trim() } : {}),
    };
    updateCustomer(
      { id: customer.id, payload },
      { onSuccess: onClose }
    );
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete Customer",
      description: `Are you sure you want to delete "${customer.name}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });
    if (!confirmed) return;
    deleteCustomer(customer.id, { onSuccess: onClose });
  };

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2 transition duration-200 shadow-sm ${
      hasError
        ? "border-red-300 focus:ring-red-400 bg-red-50/30"
        : "border-slate-200 focus:ring-orange-500"
    }`;

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .drawer-slide {
          animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .drawer-fade {
          animation: fadeInOverlay 0.25s ease-out forwards;
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-xs drawer-fade"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-slate-50 shadow-2xl border-l border-slate-100 flex flex-col drawer-slide">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
              <UserCog size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Manage Customer</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{customer.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition duration-200 cursor-pointer"
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Card */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Current Info
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div>
                <p className="text-xs text-slate-400 font-semibold">Name</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{customer.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold">Phone</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{customer.phone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold">Email</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{customer.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold">Status</p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full border mt-1 ${
                    customer.isActive
                      ? "bg-green-50 text-green-700 border-green-100"
                      : "bg-red-50 text-red-700 border-red-100"
                  }`}
                >
                  {customer.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <form
            id="manage-customer-form"
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 space-y-4"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Pencil size={12} />
              Edit Details
            </h3>

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
                <span className="text-slate-400 font-normal text-xs">(optional)</span>
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
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 border-t border-slate-200 bg-white space-y-3">
          <button
            type="submit"
            form="manage-customer-form"
            disabled={isSubmitting || isUpdating || !isDirty}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl transition duration-200 shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transform"
          >
            {isSubmitting || isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Pencil size={15} />
            )}
            {isSubmitting || isUpdating ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full py-3 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-100 hover:border-red-600 font-bold text-sm rounded-xl transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transform"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 size={15} />
            )}
            {isDeleting ? "Deleting..." : "Delete Customer"}
          </button>
        </div>
      </div>
    </>
  );
}
