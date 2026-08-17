import {
  Clock, DollarSign, Receipt, Wallet, CreditCard, QrCode, Layers,
  AlertCircle, ArrowDownCircle, ArrowUpCircle, CheckCircle2, TrendingUp, TrendingDown, Banknote,
} from "lucide-react";
import type { ShiftDetail } from "../types/shift.type";

function formatCurrency(value: string | number | null) {
  if (value === null) return "—";
  return `Rs. ${Number(value).toLocaleString("en-NP")}`;
}

function formatDateTime(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ShiftDetailCardProps {
  shift: ShiftDetail | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function ShiftDetailCard({ shift, isLoading, isError }: ShiftDetailCardProps) {
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
        <span>Failed to load shift.</span>
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="text-center py-10 bg-white border border-slate-200/80 rounded-2xl">
        <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" strokeWidth={1.5} />
        <p className="text-slate-500 text-sm">Shift not found.</p>
      </div>
    );
  }

  const isClosed = shift.status === "CLOSED";
  const variance = shift.variance !== null ? Number(shift.variance) : null;

  const paymentMethods = [
    { label: "Cash", icon: Wallet, sales: shift.cashSales, refunds: shift.cashRefunds },
    { label: "QR", icon: QrCode, sales: shift.qrSales, refunds: shift.qrRefunds },
    { label: "Card", icon: CreditCard, sales: shift.cardSales, refunds: shift.cardRefunds },
    { label: "Mixed", icon: Layers, sales: shift.mixedSales, refunds: shift.mixedRefunds },
  ];

  return (
    <div className="space-y-4">
      {/* ─── Header Card ──────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm shadow-slate-200/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            {isClosed ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Closed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block ring-2 ring-amber-300/40" />
                Open
              </span>
            )}
          </div>
          <div className="sm:text-right text-xs text-slate-400">
            <p>Opened {formatDateTime(shift.openedAt)} by {shift.openedBy.name}</p>
            {isClosed && shift.closedAt && shift.closedBy && (
              <p>Closed {formatDateTime(shift.closedAt)} by {shift.closedBy.name}</p>
            )}
          </div>
        </div>

        {/* Cash summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/40 rounded-xl p-3.5 border border-purple-200/40">
            <div className="flex items-center gap-1.5 text-purple-600 text-xs font-semibold uppercase tracking-wide mb-1">
              <Banknote className="w-3.5 h-3.5" /> Opening Cash
            </div>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(shift.openingCash)}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100/40 rounded-xl p-3.5 border border-blue-200/40">
            <div className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold uppercase tracking-wide mb-1">
              <Banknote className="w-3.5 h-3.5" /> Closing Cash
            </div>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(shift.closingCash)}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100/60 rounded-xl p-3.5 border border-slate-200/60">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">
              <DollarSign className="w-3.5 h-3.5" /> Expected Cash
            </div>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(shift.expectedCash)}</p>
          </div>

          <div className={`rounded-xl p-3.5 border ${
            variance === null ? "bg-slate-50 border-slate-200/60"
              : variance < 0 ? "bg-gradient-to-br from-rose-50 to-rose-100/40 border-rose-200/40"
              : variance === 0 ? "bg-slate-50 border-slate-200/60"
              : "bg-gradient-to-br from-emerald-50 to-emerald-100/40 border-emerald-200/40"
          }`}>
            <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-1 ${
              variance === null ? "text-slate-400"
                : variance < 0 ? "text-rose-600"
                : variance === 0 ? "text-slate-500"
                : "text-emerald-600"
            }`}>
              <DollarSign className="w-3.5 h-3.5" /> Variance
            </div>
            <p className={`text-lg font-bold ${
              variance === null ? "text-slate-400"
                : variance < 0 ? "text-rose-600"
                : variance === 0 ? "text-slate-800"
                : "text-emerald-600"
            }`}>
              {variance !== null && variance > 0 ? "+" : ""}
              {formatCurrency(shift.variance)}
            </p>
          </div>
        </div>

        {/* Sales totals */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
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
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/40 rounded-xl p-3.5 border border-blue-200/40 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold uppercase tracking-wide mb-1">
              <Receipt className="w-3.5 h-3.5" /> Bills / Payments / Refunds
            </div>
            <p className="text-lg font-bold text-slate-800">
              {shift.billsCount} / {shift.paymentsCount} / {shift.refundsCount}
            </p>
          </div>
        </div>

        {/* Payment method breakdown */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-slate-200" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
              By Payment Method
            </p>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {paymentMethods.map(({ label, icon: Icon, sales, refunds }) => (
              <div key={label} className="group bg-white border border-slate-200/60 rounded-xl p-3.5 hover:border-orange-200/80 hover:shadow-md transition-all duration-200">
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

        {/* Pay-ins / Pay-outs */}
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

        {/* Notes */}
        {(shift.openingNote || shift.closingNote) && (
          <div className="mt-5 pt-5 border-t border-slate-200/60 space-y-2">
            {shift.openingNote && (
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-500">Opening note:</span> {shift.openingNote}
              </p>
            )}
            {shift.closingNote && (
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-500">Closing note:</span> {shift.closingNote}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ─── Cash Events ──────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm shadow-slate-200/40">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Cash Events
        </p>
        {shift.cashEvents.length === 0 ? (
          <p className="text-sm text-slate-400">No cash events recorded for this shift.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {shift.cashEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  {event.type === "PAY_IN" ? (
                    <ArrowDownCircle className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
                  ) : (
                    <ArrowUpCircle className="w-5 h-5 text-rose-500" strokeWidth={1.5} />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-700">{event.reason}</p>
                    <p className="text-xs text-slate-400">
                      {event.actor.name} · {formatDateTime(event.createdAt)}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${
                  event.type === "PAY_IN" ? "text-emerald-600" : "text-rose-600"
                }`}>
                  {event.type === "PAY_IN" ? "+" : "-"}{formatCurrency(event.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}