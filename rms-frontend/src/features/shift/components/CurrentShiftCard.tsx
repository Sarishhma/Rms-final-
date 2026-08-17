import { useCurrentShift } from "../hooks/useGetService.hooks";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Receipt,
  Wallet,
  CreditCard,
  QrCode,
  Layers,
  AlertCircle,
  Banknote,
} from "lucide-react";

function formatCurrency(value: string | number) {
  return `Rs. ${Number(value).toLocaleString("en-NP")}`;
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CurrentShiftCard() {
  const { data, isLoading, isError } = useCurrentShift();
  const shift = data?.data;

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm animate-pulse">
        <div className="h-4 w-32 bg-slate-100 rounded-full mb-3" />
        <div className="h-8 w-48 bg-slate-100 rounded-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-3 bg-red-50/80 border border-red-200/80 text-red-700 font-medium px-6 py-4 rounded-2xl">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>Failed to load current shift.</span>
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="text-center py-10 bg-white border border-slate-200/80 rounded-2xl">
        <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" strokeWidth={1.5} />
        <p className="text-slate-500 text-sm">No shift is currently open.</p>
      </div>
    );
  }

  const paymentMethods = [
    { label: "Cash", icon: Wallet, sales: shift.cashSales, refunds: shift.cashRefunds },
    { label: "QR", icon: QrCode, sales: shift.qrSales, refunds: shift.qrRefunds },
    { label: "Card", icon: CreditCard, sales: shift.cardSales, refunds: shift.cardRefunds },
    { label: "Mixed", icon: Layers, sales: shift.mixedSales, refunds: shift.mixedRefunds },
  ];

  return (
    <div className="w-full bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-300/30" />
          <h3 className="font-bold text-slate-800 text-lg tracking-tight">
            Shift #{shift.shiftNumber}
          </h3>
          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200/60">
            Active
          </span>
        </div>
        <span className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200/60 w-fit">
          Opened {formatTime(shift.openedAt)} by {shift.openedBy.name}
        </span>
      </div>

      {/* Top-line totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/40 rounded-xl p-3.5 border border-amber-200/40">
          <div className="flex items-center gap-1.5 text-amber-600 text-xs font-semibold uppercase tracking-wide mb-1">
            <TrendingUp className="w-3.5 h-3.5" /> Total Sales
          </div>
          <p className="text-lg font-bold text-slate-800">{formatCurrency(shift.totalSales)}</p>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-rose-100/40 rounded-xl p-3.5 border border-rose-200/40">
          <div className="flex items-center gap-1.5 text-rose-600 text-xs font-semibold uppercase tracking-wide mb-1">
            <TrendingDown className="w-3.5 h-3.5" /> Total Refunds
          </div>
          <p className="text-lg font-bold text-rose-600">{formatCurrency(shift.totalRefunds)}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100/40 rounded-xl p-3.5 border border-blue-200/40">
          <div className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold uppercase tracking-wide mb-1">
            <Receipt className="w-3.5 h-3.5" /> Bills
          </div>
          <p className="text-lg font-bold text-slate-800">{shift.billsCount}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100/40 rounded-xl p-3.5 border border-purple-200/40">
          <div className="flex items-center gap-1.5 text-purple-600 text-xs font-semibold uppercase tracking-wide mb-1">
            <Banknote className="w-3.5 h-3.5" /> Opening Cash
          </div>
          <p className="text-lg font-bold text-slate-800">{formatCurrency(shift.openingCash)}</p>
        </div>
      </div>

      {/* Payment method breakdown */}
      <div className="mb-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-slate-200" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
            By Payment Method
          </p>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {paymentMethods.map(({ label, icon: Icon, sales, refunds }) => (
            <div
              key={label}
              className="group bg-white border border-slate-200/60 rounded-xl p-3.5 hover:border-orange-200/80 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1.5">
                <div className="p-1.5 rounded-lg bg-slate-100/80 group-hover:bg-orange-100/80 group-hover:text-orange-600 transition-colors">
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                </div>
                {label}
              </div>
              <p className="text-sm font-bold text-slate-800">{formatCurrency(sales)}</p>
              {Number(refunds) > 0 && (
                <p className="text-xs text-rose-500 mt-0.5 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-rose-400" />
                  -{formatCurrency(refunds)} refunded
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pay-ins / Pay-outs, only shown if non-zero */}
      {(Number(shift.payIns) > 0 || Number(shift.payOuts) > 0) && (
        <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t border-slate-200/60">
          {Number(shift.payIns) > 0 && (
            <div className="bg-emerald-50/60 px-4 py-2 rounded-xl border border-emerald-200/40">
              <p className="text-xs text-emerald-600 font-medium">Pay-ins</p>
              <p className="text-sm font-bold text-emerald-700">{formatCurrency(shift.payIns)}</p>
            </div>
          )}
          {Number(shift.payOuts) > 0 && (
            <div className="bg-rose-50/60 px-4 py-2 rounded-xl border border-rose-200/40">
              <p className="text-xs text-rose-600 font-medium">Pay-outs</p>
              <p className="text-sm font-bold text-rose-700">{formatCurrency(shift.payOuts)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}