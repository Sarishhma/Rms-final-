import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { Plus, Scale, Loader2, Pencil } from "lucide-react";
import { useInventoryUnit } from "../hooks/useInventoryUnit";
import { inventoryUnitConversionSchema } from "@/zod/table.schema";
import type { InventoryUnit } from "../../types/inventory.type";

type ConversionFormData = z.infer<typeof inventoryUnitConversionSchema>;

interface ManageConversionsModalProps {
  unit: InventoryUnit;
  allUnits: InventoryUnit[];
  onClose: () => void;
}

export default function ManageConversionsModal({
  unit,
  allUnits,
  onClose,
}: ManageConversionsModalProps) {
  const { createConversion, adjustConversion, adjustConversionLoading } = useInventoryUnit();
  const [editingConversion, setEditingConversion] = useState<any | null>(null);



  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConversionFormData>({
    resolver: zodResolver(inventoryUnitConversionSchema),
    defaultValues: {
      fromUnitId: unit?.id,
      toUnitId: "",
      factor: "" as any,
    },
  });

  if (!unit || !unit.id) {
    return null;
  }

  // Filter units of the same measurement type, excluding the current unit
  const compatibleUnits =
    allUnits?.filter(
      (u) => u && u.type === unit.type && u.id !== unit.id && !u.isDeleted,
    ) || [];

  const onSubmit = async (data: ConversionFormData) => {
    try {
      // Make sure factor is a number when sending to the server
      const payload = {
        ...data,
        factor: Number(data.factor),
      };
      
      if (editingConversion) {
        await adjustConversion({ id: editingConversion.id, data: payload });
        toast.success("Conversion updated successfully");
        setEditingConversion(null);
      } else {
        await createConversion(payload);
        toast.success("Conversion added successfully");
      }
      
      reset({ fromUnitId: unit.id, toUnitId: "", factor: "" as any });
      onClose?.();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save conversion");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 transform transition-all duration-200 scale-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors duration-200"
          aria-label="Close modal"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
            <Scale size={22} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              Manage Conversions
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Conversions starting from{" "}
              <span className="font-semibold text-slate-800">{unit.name}</span>
            </p>
          </div>
        </div>

        {/* Active Conversions List */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Conversions
          </h3>

          {!unit.fromConversions || unit.fromConversions.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-sm text-slate-400">
                No conversions configured starting from this unit.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/30 max-h-48 overflow-y-auto">
              {unit.fromConversions.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition duration-150"
                >
                  <div className="flex items-center gap-2.5 text-sm text-slate-800">
                    <span className="font-bold text-slate-900">
                      1 {unit.name}
                    </span>
                    <span className="text-slate-400 font-medium">=</span>
                    <span className="font-mono text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-lg text-xs font-bold border border-orange-100 shadow-sm">
                      {conv.factor}
                    </span>
                    <span className="font-bold text-slate-800">
                      {conv.toUnit?.name ?? "units"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingConversion(conv);
                      reset({
                        fromUnitId: unit.id,
                        toUnitId: conv.toUnitId,
                        factor: conv.factor as any,
                      });
                    }}
                    className="p-1.5 text-orange-655 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition duration-150"
                    title="Edit conversion"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Conversion Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 border-t border-slate-100 pt-6"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {editingConversion ? "Edit Relationship" : "Add New Relationship"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Unit Dropdown */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Target Unit
              </label>
              <select
                {...register("toUnitId")}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 transition duration-200 shadow-sm"
              >
                <option value="">
                  Select target unit ({(unit.type || "").toLowerCase()})
                </option>
                {compatibleUnits?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              {errors.toUnitId && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.toUnitId.message}
                </p>
              )}
            </div>

            {/* Factor Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Conversion Factor
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 1000"
                {...register("factor")}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 transition duration-200 shadow-sm"
              />
              {errors.factor && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.factor.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            {editingConversion ? (
              <button
                type="button"
                onClick={() => {
                  setEditingConversion(null);
                  reset({ fromUnitId: unit.id, toUnitId: "", factor: "" as any });
                }}
                className="w-full sm:flex-1 px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl transition duration-200"
              >
                Cancel Edit
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl transition duration-200"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || adjustConversionLoading}
              className="w-full sm:flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition duration-200 shadow-sm hover:shadow flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {isSubmitting || adjustConversionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              {isSubmitting || adjustConversionLoading
                ? "Saving..."
                : editingConversion
                ? "Update Relationship"
                : "Add Conversion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
