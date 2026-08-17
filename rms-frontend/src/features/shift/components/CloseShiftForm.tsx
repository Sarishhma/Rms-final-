import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign, Loader2 } from "lucide-react";

import { useCloseShift } from "../hooks/usePostService.hooks";
import { closeShiftSchema, type CloseShiftFormValues } from "../schema/shift.schema";
import type { CurrentShift } from "../types/shift.type";
import toast from "react-hot-toast";

export function CloseShiftForm({
  shift,
  onSuccess,
}: {
  shift: CurrentShift;
  onSuccess?: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CloseShiftFormValues>({
    resolver: zodResolver(closeShiftSchema),
  });

  const { mutate: closeShift, isPending } = useCloseShift();

  // stable idempotency key for this close attempt, survives retries
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const onSubmit = (values: CloseShiftFormValues) => {
    closeShift(
      { id: shift.id, payload: values, idempotencyKey: idempotencyKeyRef.current },
      {
        onSuccess: () => {
          toast.success("Shift closed successfully");
          onSuccess?.();
        },
        onError: () => toast.error("Failed to close shift"),
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white border border-slate-200/80 rounded-2xl shadow-lg shadow-slate-200/40 p-6 space-y-5"
    >
      <div>
        <h3 className="text-lg font-bold text-slate-800">Close Shift {shift.shiftNumber}</h3>
        <p className="text-sm text-slate-500 mt-1">
          Expected cash: <span className="font-semibold text-slate-700">Rs. {shift.expectedCash}</span>
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Closing Cash
        </label>
        <div className="relative">
          <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
          <input
            type="number"
            step="0.01"
            placeholder="Actual cash counted"
            {...register("closingCash", { valueAsNumber: true })}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300/50 focus:border-orange-300 transition-all"
          />
        </div>
        {errors.closingCash && (
          <p className="text-xs text-rose-600 font-medium">{errors.closingCash.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Closing Note (optional)
        </label>
        <textarea
          rows={2}
          {...register("closingNote")}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300/50 focus:border-orange-300 transition-all resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-sm shadow-orange-200/60 disabled:opacity-60"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Close Shift"}
      </button>
    </form>
  );
}