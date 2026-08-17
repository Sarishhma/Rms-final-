import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { useCreateCashEvent } from "../hooks/usePostService.hooks";
import { cashEventSchema, type CashEventFormValues } from "../schema/shift.schema";
import toast from "react-hot-toast";

export function CashEventForm({
  id,
  onSuccess,
}: {
  id: string;
  onSuccess?: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CashEventFormValues>({
    resolver: zodResolver(cashEventSchema),
    defaultValues: { type: "PAY_IN" },
  });

  const type = watch("type");
  const { mutate: createCashEvent, isPending } = useCreateCashEvent();
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const onSubmit = (values: CashEventFormValues) => {
    createCashEvent(
      { id, payload: values, idempotencyKey: idempotencyKeyRef.current },
      {
        onSuccess: () => {
          toast.success(`${values.type === "PAY_IN" ? "Pay in" : "Pay out"} recorded`);
          onSuccess?.();
        },
        onError: () => toast.error("Failed to record cash event"),
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white border border-slate-200/80 rounded-2xl shadow-lg shadow-slate-200/40 p-6 space-y-5"
    >
      <div>
        <h3 className="text-lg font-bold text-slate-800">Cash Movement</h3>
        <p className="text-sm text-slate-500 mt-1">Record a pay-in or pay-out for this shift.</p>
      </div>

      {/* Toggle */}
      <div className="flex bg-slate-100 rounded-xl p-1">
        <button
          type="button"
          onClick={() => setValue("type", "PAY_IN")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            type === "PAY_IN" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500"
          }`}
        >
          Pay In
        </button>
        <button
          type="button"
          onClick={() => setValue("type", "PAY_OUT")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            type === "PAY_OUT" ? "bg-rose-600 text-white shadow-sm" : "text-slate-500"
          }`}
        >
          Pay Out
        </button>
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Amount
        </label>
        <input
          type="number"
          step="0.01"
          {...register("amount", { valueAsNumber: true })}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300/50 focus:border-orange-300 transition-all"
        />
        {errors.amount && <p className="text-xs text-rose-600 font-medium">{errors.amount.message}</p>}
      </div>

      {/* Reason */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Reason
        </label>
        <input
          {...register("reason")}
          placeholder="e.g. Change float top-up"
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300/50 focus:border-orange-300 transition-all"
        />
        {errors.reason && <p className="text-xs text-rose-600 font-medium">{errors.reason.message}</p>}
      </div>

      {/* Reference (optional) */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Reference (optional)
        </label>
        <input
          {...register("reference")}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300/50 focus:border-orange-300 transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={`w-full flex items-center justify-center gap-2 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-60 ${
          type === "PAY_IN"
            ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/60"
            : "bg-rose-600 hover:bg-rose-700 shadow-rose-200/60"
        }`}
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : `Record ${type === "PAY_IN" ? "Pay In" : "Pay Out"}`}
      </button>
    </form>
  );
}