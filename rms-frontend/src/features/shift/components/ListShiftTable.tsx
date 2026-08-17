import { useNavigate } from "react-router-dom";
import { CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, UserX, Clock, DollarSign, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Shift, ShiftStatus, PaginationMeta } from "../types/shift.type";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: string | number) {
  return `Rs. ${Number(value).toLocaleString("en-NP")}`;
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="overflow-hidden bg-white border border-slate-200/80 rounded-2xl shadow-lg shadow-slate-200/50">
      <div className="h-14 bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/60 animate-pulse" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-6 py-4 border-b border-slate-50 animate-pulse"
        >
          <div className="h-4 w-16 bg-slate-100 rounded-full" />
          <div className="h-7 w-24 bg-slate-100 rounded-full" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-100 rounded-full" />
            <div className="h-4 w-28 bg-slate-100 rounded-full" />
          </div>
          <div className="ml-auto h-4 w-32 bg-slate-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ShiftStatus }) {
  if (status === "CLOSED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm shadow-emerald-100/30">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Closed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 shadow-sm shadow-amber-100/30">
      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block ring-2 ring-amber-300/40" />
      Open
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ListShiftsTableProps {
  shifts: Shift[];
  meta?: PaginationMeta;
  isLoading: boolean;
  isError: boolean;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

export const ListShiftsTable = ({
  shifts,
  meta,
  isLoading,
  isError,
  page,
  setPage,
}: ListShiftsTableProps) => {
  const navigate = useNavigate();

  if (isLoading) return <TableSkeleton />;

  if (isError) {
    return (
      <div className="flex items-center gap-3 bg-red-50/80 border border-red-200/80 text-red-700 font-medium px-6 py-4 rounded-2xl shadow-sm backdrop-blur-sm">
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
        <span>Failed to load shifts. Please try again later.</span>
      </div>
    );
  }

  if (shifts.length === 0) {
    return (
      <div className="text-center py-24 bg-white border border-slate-200/80 rounded-2xl shadow-lg shadow-slate-200/40">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200/60 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
          <Clock className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-bold text-slate-800">No shifts yet</h3>
        <p className="text-slate-500 mt-1.5 text-sm max-w-xs mx-auto">
          Shifts will appear here once a register is opened.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white border border-slate-200/80 rounded-2xl shadow-lg shadow-slate-200/40 transition-all duration-200">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm border-collapse">
          {/* ── HEAD ─────────────────────────────────────────────────────── */}
          <thead className="bg-gradient-to-r from-slate-50/90 to-slate-100/70 border-b border-slate-200/60">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white">
                Shift #
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white">
                Status
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell bg-white">
                Opened By
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell bg-white">
                Closed By
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right hidden md:table-cell bg-white whitespace-nowrap">
                Opening Cash
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right hidden lg:table-cell bg-white whitespace-nowrap">
                Closing Cash
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right hidden lg:table-cell bg-white whitespace-nowrap">
                Expected Cash
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right hidden xl:table-cell bg-white whitespace-nowrap">
                Variance
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right bg-white whitespace-nowrap">
                Total Sales
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right bg-white whitespace-nowrap">
                Total Refunds
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell bg-white whitespace-nowrap">
                Opened At
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell bg-white whitespace-nowrap">
                Closed At
              </th>
            </tr>
          </thead>

          {/* ── BODY ─────────────────────────────────────────────────────── */}
          <tbody className="divide-y divide-slate-100/80">
            {shifts.map((shift, index) => {
              const variance = Number(shift.variance);
              const isClosed = shift.status === "CLOSED";

              return (
                <tr
                  key={shift.id}
                  onClick={() => navigate(`/admin/shifts/${shift.id}`)}
                  className={`cursor-pointer hover:bg-gradient-to-r hover:from-orange-50/40 hover:to-transparent transition-all duration-200 ${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                  }`}
                >
                  {/* Shift # */}
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-slate-800 tabular-nums whitespace-nowrap text-sm bg-slate-100/60 px-3 py-1 rounded-lg">
                      #{shift.shiftNumber}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge status={shift.status} />
                  </td>

                  {/* Opened By */}
                  <td className="px-6 py-4 hidden sm:table-cell whitespace-nowrap">
                    <span className="text-slate-700 font-medium text-sm">
                      {shift.openedBy?.name ?? "—"}
                    </span>
                  </td>

                  {/* Closed By */}
                  <td className="px-6 py-4 hidden md:table-cell whitespace-nowrap">
                    {shift.closedBy ? (
                      <span className="text-slate-600 font-medium text-sm">
                        {shift.closedBy.name}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400">
                        <UserX className="w-4 h-4" strokeWidth={1.5} />
                        <span className="text-sm">Not closed</span>
                      </div>
                    )}
                  </td>

                  {/* Opening Cash */}
                  <td className="px-6 py-4 text-right tabular-nums text-slate-700 whitespace-nowrap hidden md:table-cell font-medium">
                    <div className="flex items-center justify-end gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                      {formatCurrency(shift.openingCash)}
                    </div>
                  </td>

                  {/* Closing Cash */}
                  <td className="px-6 py-4 text-right tabular-nums text-slate-700 whitespace-nowrap hidden lg:table-cell font-medium">
                    {isClosed ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                        {formatCurrency(shift.closingCash)}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-sm">—</span>
                    )}
                  </td>

                  {/* Expected Cash */}
                  <td className="px-6 py-4 text-right tabular-nums text-slate-700 whitespace-nowrap hidden lg:table-cell font-medium">
                    {isClosed ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                        {formatCurrency(shift.expectedCash)}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-sm">—</span>
                    )}
                  </td>

                  {/* Variance */}
                  <td className="px-6 py-4 text-right whitespace-nowrap hidden xl:table-cell">
                    {isClosed ? (
                      <div className={`flex items-center justify-end gap-1.5 font-semibold tabular-nums ${
                        variance < 0
                          ? "text-rose-600"
                          : variance === 0
                          ? "text-slate-400"
                          : "text-emerald-600"
                      }`}>
                        {variance < 0 ? (
                          <TrendingDown className="w-4 h-4" strokeWidth={2} />
                        ) : variance > 0 ? (
                          <TrendingUp className="w-4 h-4" strokeWidth={2} />
                        ) : (
                          <Minus className="w-4 h-4" strokeWidth={2} />
                        )}
                        {variance > 0 ? "+" : ""}
                        {formatCurrency(variance)}
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Total Sales */}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <span className="font-bold tabular-nums text-slate-800 text-sm bg-gradient-to-r from-orange-50 to-orange-100/50 px-3 py-1.5 rounded-lg inline-block shadow-sm">
                      {formatCurrency(shift.totalSales)}
                    </span>
                  </td>

                  {/* Total Refunds */}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    {Number(shift.totalRefunds) > 0 ? (
                      <span className="font-semibold tabular-nums text-rose-600 text-sm">
                        {formatCurrency(shift.totalRefunds)}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-sm">—</span>
                    )}
                  </td>

                  {/* Opened At */}
                  <td className="px-6 py-4 text-slate-400 text-xs hidden xl:table-cell whitespace-nowrap font-mono">
                    {formatDate(shift.openedAt) ?? "—"}
                  </td>

                  {/* Closed At */}
                  <td className="px-6 py-4 text-slate-400 text-xs hidden xl:table-cell whitespace-nowrap font-mono">
                    {formatDate(shift.closedAt) ?? (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── FOOTER / PAGINATION INFO ──────────────────────────────────────── */}
      {meta && (
        <div className="flex items-center justify-between rounded-b-2xl border-t border-slate-200/60 bg-gradient-to-r from-slate-50/90 to-slate-100/70 px-6 py-4 backdrop-blur-sm">
          {/* Previous */}
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            className="group flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-sm px-5 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:border-orange-300/80 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100/50 hover:text-orange-700 hover:shadow-md hover:shadow-orange-100/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={2} />
            Previous
          </button>

          {/* Center */}
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-slate-600">
              Page{" "}
              <span className="font-bold text-orange-600 bg-orange-50/80 px-2 py-0.5 rounded-lg">
                {meta.page}
              </span>{" "}
              of{" "}
              <span className="font-bold text-orange-600 bg-orange-50/80 px-2 py-0.5 rounded-lg">
                {meta.totalPages}
              </span>
            </span>
            <span className="text-xs text-slate-400 mt-0.5">
              {meta.total} shift{meta.total !== 1 ? "s" : ""} total
            </span>
          </div>

          {/* Next */}
          <button
            disabled={page === meta.totalPages}
            onClick={() =>
              setPage((prev) =>
                prev < meta.totalPages ? prev + 1 : prev
              )
            }
            className="group flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-sm px-5 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:border-orange-300/80 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100/50 hover:text-orange-700 hover:shadow-md hover:shadow-orange-100/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none"
          >
            Next
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
};