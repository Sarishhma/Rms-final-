import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { useInventorySupplier } from "../hooks/useInventorySupplier";
import { inventorySupplierSchema } from "@/zod/table.schema";

type InventorySupplierFormData = z.infer<typeof inventorySupplierSchema>;

interface InventorySupplierFormProps {
  onClose: () => void;
}

export default function InventorySupplierForm({ onClose }: InventorySupplierFormProps) {
  const { createSupplier, createLoading } = useInventorySupplier();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventorySupplierFormData>({
    resolver: zodResolver(inventorySupplierSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      panNumber: "",
      vatNumber: "",
      
    },
  });

  const onSubmit = async (data: InventorySupplierFormData) => {
    try {
      await createSupplier(data);
      reset();
      toast.success("Supplier created successfully");
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create supplier");
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">Add Supplier</h1>
        <p className="text-sm text-gray-500 mt-1.5">
          Register a new inventory vendor or supplier
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name and Contact Person (Responsive Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Supplier Name
            </label>
            <input
              type="text"
              {...register("name")}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-400 transition duration-200 text-sm"
              placeholder="e.g. Acme Distributors"
            />
            {errors.name && (
              <p className="text-red-550 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          
        </div>

        {/* Phone and Email (Responsive Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone Number
            </label>
            <input
              type="text"
              {...register("phone")}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-400 transition duration-200 text-sm"
              placeholder="e.g. +977-9812345678"
            />
            {errors.phone && (
              <p className="text-red-555 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              {...register("email")}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-400 transition duration-200 text-sm"
              placeholder="e.g. info@acme.com"
            />
            {errors.email && (
              <p className="text-red-555 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Address
          </label>
          <input
            type="text"
            {...register("address")}
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-400 transition duration-200 text-sm"
            placeholder="e.g. Kathmandu, Nepal"
          />
          {errors.address && (
            <p className="text-red-555 text-sm mt-1">{errors.address.message}</p>
          )}
        </div>

        {/* PAN and VAT (Responsive Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              PAN Number
            </label>
            <input
              type="text"
              {...register("panNumber")}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-400 transition duration-200 text-sm"
              placeholder="e.g. 123456789"
            />
            {errors.panNumber && (
              <p className="text-red-555 text-sm mt-1">{errors.panNumber.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              VAT Number
            </label>
            <input
              type="text"
              {...register("vatNumber")}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-400 transition duration-200 text-sm"
              placeholder="e.g. 987654321"
            />
            {errors.vatNumber && (
              <p className="text-red-555 text-sm mt-1">{errors.vatNumber.message}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition duration-200"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={createLoading}
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-medium px-5 py-2 rounded-xl transition duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createLoading ? "Saving..." : "Create Supplier"}
          </button>
        </div>
      </form>
    </div>
  );
}
