import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inventoryUnitSchema } from "@/zod/table.schema";
import toast from "react-hot-toast";
import z from "zod";
import { useInventoryUnit } from "../hooks/useInventoryUnit";

export type InventoryUnitFormData = z.input<typeof inventoryUnitSchema>;

type InventoryUnitFormProps = {
  onClose?: () => void;
};

export default function InventoryUnitForm({ onClose }: InventoryUnitFormProps) {
  const { createInventoryUnit, loading } = useInventoryUnit();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryUnitFormData>({
    resolver: zodResolver(inventoryUnitSchema),
    defaultValues: {
      name: "",
      type: undefined,
      symbol: "",
      isBaseUnit: false,
    },
  });

  const onSubmit = async (data: InventoryUnitFormData) => {
    try {
      const payload = {
        ...data,
      };

      await createInventoryUnit(payload);
      reset();
      toast.success("Inventory unit created successfully");
      onClose?.();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create inventory unit");
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">
          Add Unit
        </h1>
        <p className="text-sm text-gray-500 mt-1.5">
          Create a new inventory measurement unit
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name (Full Width) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Unit Name
          </label>
          <input
            type="text"
            {...register("name")}
            className="w-full rounded-xl border border-orange-200 bg-white/80 px-4 py-2 outline-none focus:ring-2 focus:ring-orange-400 transition duration-200"
            placeholder="e.g. Kilogram"
          />
          {errors.name && (
            <p className="text-red-550 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Symbol
          </label>
          <input
            type="text"
            {...register("symbol")}
            className="w-full rounded-xl border border-orange-200 bg-white/80 px-4 py-2 outline-none focus:ring-2 focus:ring-orange-400 transition duration-200"
            placeholder="e.g. kg"
          />
          {errors.symbol && (
            <p className="text-red-550 text-sm mt-1">{errors.symbol.message}</p>
          )}
        </div>

        {/* Type Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Unit Type
          </label>
          <select
            {...register("type")}
            className="w-full rounded-xl border border-orange-200 bg-white/80 px-4 py-2 outline-none focus:ring-2 focus:ring-orange-400 transition duration-200"
          >
            <option value="">Select unit type</option>
            <option value="WEIGHT">Weight</option>
            <option value="VOLUME">Volume</option>
            <option value="COUNT">Count</option>
            <option value="PACKAGING">Packaging</option>
          </select>
          {errors.type && (
            <p className="text-red-550 text-sm mt-1">{errors.type.message}</p>
          )}
        </div>

        {/* Is Base Unit (Card Layout) */}
        <div className="flex items-center gap-3 p-3.5 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-gray-50 transition duration-200">
          <input
            type="checkbox"
            id="isBaseUnit"
            {...register("isBaseUnit")}
            className="h-5 w-5 rounded border-orange-200 text-green-600 focus:ring-orange-400 transition duration-200 cursor-pointer"
          />
          <label
            htmlFor="isBaseUnit"
            className="text-sm font-medium text-gray-700 cursor-pointer select-none"
          >
            Set as base unit
          </label>
        </div>

        {/* Action Buttons (Responsive flex layout) */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition duration-200 "
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-orange-600  text-white font-medium px-5 py-2 rounded-xl transition duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed "
          >
            {loading ? "Saving..." : "Create Unit"}
          </button>
        </div>
      </form>
    </div>
  );
}
