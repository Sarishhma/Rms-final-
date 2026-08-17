import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useConfirm } from "@/providers/ConfirmProvider";
import { useInventoryStockOuts, usePostInventoryStockOut } from "../hooks/useInventoryStockOut";
import {
  StockOutStatus,
  STOCK_OUT_REASONS,
} from "../../types/inventory.type";
import type { StockOutReason } from "../../types/inventory.type";

export default function AllStockOutsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [reasonFilter, setReasonFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const navigate = useNavigate();
  const confirm = useConfirm();

  const { data: responseData, isLoading, refetch } = useInventoryStockOuts({
    page,
    limit,
    search: search || undefined,
    status: (statusFilter as StockOutStatus) || undefined,
    reason: (reasonFilter as StockOutReason) || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const { mutate: postStockOut, isPending: isPosting } = usePostInventoryStockOut();
  const [postingId, setPostingId] = useState<string | null>(null);

  const stockOuts = responseData?.data ?? [];
  const meta = responseData?.meta;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setReasonFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const getStatusBadgeClass = (status: StockOutStatus) => {
    switch (status) {
      case StockOutStatus.DRAFT:
        return "bg-blue-50 text-blue-700 border-blue-100";
      case StockOutStatus.POSTED:
        return "bg-green-50 text-green-700 border-green-100";
      case StockOutStatus.CANCELLED:
        return "bg-red-50 text-red-700 border-red-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const getReasonLabel = (reason: StockOutReason) =>
    STOCK_OUT_REASONS.find((r) => r.value === reason)?.label ?? reason;

  const handlePostStockOut = async (so: { id: string; stockOutNumber: string }) => {
    const confirmed = await confirm({
      title: "Post Stock Out Document",
      description: `WARNING: This action is IRREVERSIBLE. Posting stock out "${so.stockOutNumber}" will deduct the listed quantities from live inventory stock levels immediately. Do you wish to proceed?`,
      confirmText: "Post Stock Out",
      cancelText: "Review Before Posting",
      type: "warning",
    });

    if (!confirmed) {
      navigate(`/admin/inventory/stock-outs/${so.id}`);
      return;
    }

    setPostingId(so.id);
    postStockOut(so.id, {
      onSuccess: () => {
        toast.success(`Stock out ${so.stockOutNumber} posted — inventory updated.`);
        setPostingId(null);
        refetch();
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message ?? err?.message ?? "Failed to post stock out.";
        toast.error(msg);
        setPostingId(null);
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
           
              Inventory Stock Outs
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1">
              Record and track inventory usage, waste, and internal consumption.
            </p>
          </div>

          <Link
            to="/admin/inventory/stock-outs/create"
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-semibold transition duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            Record Stock Out
          </Link>
        </div>

        {/* Filters – all on one row, no wrapping of date group */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative w-full max-w-md flex-1 min-w-[160px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search stock out number..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl bg-white/80 outline-none focus:ring-2 focus:ring-orange-500 transition duration-200 shadow-sm text-sm"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full sm:w-48 px-5 py-3 border border-slate-200 rounded-2xl bg-white/80 outline-none focus:ring-2 focus:ring-orange-500 transition duration-200 shadow-sm text-sm cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="POSTED">Posted</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Reason filter */}
          <select
            value={reasonFilter}
            onChange={(e) => { setReasonFilter(e.target.value); setPage(1); }}
            className="w-full sm:w-48 px-5 py-3 border border-slate-200 rounded-2xl bg-white/80 outline-none focus:ring-2 focus:ring-orange-500 transition duration-200 shadow-sm text-sm cursor-pointer"
          >
            <option value="">All Reasons</option>
            {STOCK_OUT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          {/* Date range – kept together with nowrap */}
          <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
            <div className="relative w-40">
             
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="w-full pl-4 pr-4 py-3 border border-slate-200 rounded-2xl bg-white/80 outline-none focus:ring-2 focus:ring-orange-500 transition duration-200 shadow-sm text-sm cursor-pointer text-slate-700"
              />
            </div>
            <span className="text-slate-400 text-sm font-medium">—</span>
            <div className="relative w-40">
              
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="w-full pl-4 pr-4 py-3 border border-slate-200 rounded-2xl bg-white/80 outline-none focus:ring-2 focus:ring-orange-500 transition duration-200 shadow-sm text-sm cursor-pointer text-slate-700"
              />
            </div>
          </div>

          {/* Clear filters */}
          {(search || statusFilter || reasonFilter || dateFrom || dateTo) && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1 px-3 py-2"
            >
              <X size={14} />
              Clear Filters
            </button>
          )}
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500" />
          </div>
        ) : stockOuts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
            <p className="text-slate-400 text-sm">No stock outs found.</p>
            <Link
              to="/admin/inventory/stock-outs/create"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition"
            >
              <Plus size={16} /> Record First Stock Out
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden bg-white border border-slate-100 rounded-2xl shadow-sm transition-shadow duration-300 hover:shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-700 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Stock Out #</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 hidden md:table-cell">Issued To</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {stockOuts.map((so) => {
                    const isThisPosting = postingId === so.id && isPosting;
                    return (
                      <tr key={so.id} className="hover:bg-slate-50/60 transition-colors duration-200">
                        <td className="px-4 py-3 font-semibold text-slate-900 font-mono text-xs">
                          {so.stockOutNumber}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {getReasonLabel(so.reason)}
                          {so.customReason && (
                            <span className="text-slate-400 text-xs ml-1">({so.customReason})</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                          {new Date(so.stockOutDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-sm ${getStatusBadgeClass(so.status)}`}
                          >
                            {so.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                          {so.issuedTo ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/admin/inventory/stock-outs/${so.id}`}
                              className="px-4 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition duration-150 cursor-pointer whitespace-nowrap"
                            >
                              View Details
                            </Link>
                            {so.status === StockOutStatus.DRAFT && (
                              <button
                                onClick={() => handlePostStockOut({ id: so.id, stockOutNumber: so.stockOutNumber })}
                                disabled={isThisPosting}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs rounded-xl transition duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-60"
                              >
                                {isThisPosting ? (
                                  <><Loader2 size={13} className="animate-spin" /> Posting...</>
                                ) : (
                                  "Post Stock Out"
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {meta && meta.totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-sm font-semibold text-slate-600">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
                  disabled={page >= meta.totalPages}
                  className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}