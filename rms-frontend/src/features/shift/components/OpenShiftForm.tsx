import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign, Loader2 } from "lucide-react";

import { useOpenShift } from "../hooks/usePostService.hooks";
import { openShiftSchema, type OpenShiftFormValues } from "../schema/shift.schema";
import toast from "react-hot-toast";


export function OpenShiftForm({ onSuccess }: { onSuccess?: () => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OpenShiftFormValues>({
    resolver: zodResolver(openShiftSchema),
    defaultValues: { openingCash: undefined, openingNote: "" },
  });

  const { mutate: openShift, isPending } = useOpenShift();

  const onSubmit = (values: OpenShiftFormValues) => {
    openShift(values, {
      onSuccess: () => {
        toast.success("Shift opened successfully");
        reset();
        onSuccess?.();
      },
      onError: () => {
        toast.error("Failed to open shift");
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white border  border-slate-200/80 rounded-2xl shadow-lg shadow-slate-200/40 p-6 space-y-5"
    >
      <div>
        <h3 className="text-lg font-bold text-slate-800">Open New Shift</h3>
        <p className="text-sm text-slate-500 mt-1">
          Enter the starting cash amount for this register.
        </p>
      </div>

      {/* Opening Cash */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Opening Cash
        </label>
        <div className="relative">
          <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
          <input
            type="number"
            step="0.01"
            placeholder="1500"
            {...register("openingCash", { valueAsNumber: true })}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300/50 focus:border-orange-300 transition-all"
          />
        </div>
        {errors.openingCash && (
          <p className="text-xs text-rose-600 font-medium">{errors.openingCash.message}</p>
        )}
      </div>

      {/* Opening Note */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Opening Note (optional)
        </label>
        <textarea
          rows={2}
          placeholder="Any notes for this shift..."
          {...register("openingNote")}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300/50 focus:border-orange-300 transition-all resize-none"
        />
        {errors.openingNote && (
          <p className="text-xs text-rose-600 font-medium">{errors.openingNote.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-sm shadow-orange-200/60 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Opening...
          </>
        ) : (
          "Open Shift"
        )}
      </button>
    </form>
  );
}