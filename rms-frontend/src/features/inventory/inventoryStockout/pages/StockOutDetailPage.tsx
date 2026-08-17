import { useParams,Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  User,
  CheckCircle,
  AlertOctagon,
  Info,
  FileText,
} from "lucide-react";
import { useConfirm } from "@/providers/ConfirmProvider";
import {
  useInventoryStockOutDetail,
  usePostInventoryStockOut,
 
} from "../hooks/useInventoryStockOut";
import { StockOutStatus, STOCK_OUT_REASONS } from "../../types/inventory.type";
import type { StockOutReason } from "../../types/inventory.type";

const getReasonLabel = (reason: StockOutReason) =>
  STOCK_OUT_REASONS.find((r) => r.value === reason)?.label ?? reason;

export default function StockOutDetailPage() {
  const { id } = useParams<{ id: string }>();
  
  const confirm = useConfirm();

  const { data: stockOut, isLoading, isError, refetch } = useInventoryStockOutDetail(id);
  const { mutate: postStockOut, isPending: isPosting } = usePostInventoryStockOut();
  

  const handlePost = async () => {
    if (!stockOut?.id) return;

    const confirmed = await confirm({
      title: "Post Stock Out Document",
      description: `WARNING: This action is IRREVERSIBLE. Posting stock out "${stockOut.stockOutNumber}" will deduct the listed quantities from live inventory stock levels immediately. Do you wish to proceed?`,
      confirmText: "Post Stock Out",
      cancelText: "Cancel",
      type: "warning",
    });

    if (!confirmed) {
      // "Review Before Posting" — stay on detail page (already here)
      return;
    }

    postStockOut(stockOut.id, {
      onSuccess: () => {
        toast.success("Stock out posted — inventory stock updated successfully.");
        refetch();
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message ?? err?.message ?? "Failed to post stock out.";
        toast.error(msg);
      },
    });
  };

  // const handleCancel = async () => {
  //   if (!stockOut?.id) return;

  //   const confirmed = await confirm({
  //     title: "Cancel Stock Out Document",
  //     description: `Are you sure you want to cancel stock out "${stockOut.stockOutNumber}"? This action cannot be undone.`,
  //     confirmText: "Cancel Stock Out",
  //     cancelText: "Keep Draft",
  //     type: "warning",
  //   });

  //   if (!confirmed) return;

  //   cancelStockOut(stockOut.id, {
  //     onSuccess: () => {
  //       toast.success("Stock out has been cancelled.");
  //       refetch();
  //     },
  //     onError: (err: any) => {
  //       const msg = err?.response?.data?.message ?? err?.message ?? "Failed to cancel stock out.";
  //       toast.error(msg);
  //     },
  //   });
  // };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (isError || !stockOut) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center">
        <AlertOctagon className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Stock out document not found</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          The requested document could not be retrieved from the server.
        </p>
        <Link
          to="/admin/inventory/stock-outs"
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition shadow-sm"
        >
          Return to List
        </Link>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/inventory/stock-outs"
              className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                Stock Out Detail
                <span className="font-mono text-base font-normal text-slate-400">
                  ({stockOut.stockOutNumber})
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(stockOut.status)}`}>
                  {stockOut.status}
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Review the stock out record, items consumed, and current document status.
              </p>
            </div>
          </div>
        </div>

        {/* ── Status Banners ── */}
        {stockOut.status === StockOutStatus.POSTED && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            <div className="text-sm">
              <span className="font-bold text-green-900">Posted Document: </span>
              This stock out has been posted to inventory. Stock levels have been deducted and this document is now read-only.
            </div>
          </div>
        )}

        {stockOut.status === StockOutStatus.CANCELLED && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
            <AlertOctagon className="h-5 w-5 text-red-600 shrink-0" />
            <div className="text-sm">
              <span className="font-bold text-red-900">Cancelled Document: </span>
              This stock out document has been cancelled and has no effect on inventory stock counts.
            </div>
          </div>
        )}

        {stockOut.status === StockOutStatus.DRAFT && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
            <Info className="h-5 w-5 text-blue-600 shrink-0" />
            <div className="text-sm">
              <span className="font-bold text-blue-900">Draft Document: </span>
              This stock out is in draft status. Quantities will not affect live stock levels until posted.
            </div>
          </div>
        )}

        {/* ── Document Summary Card ── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1.5">
            Document Summary
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Reason */}
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Reason
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {getReasonLabel(stockOut.reason)}
                </span>
                {stockOut.customReason && (
                  <p className="text-xs text-slate-500 mt-0.5 italic">"{stockOut.customReason}"</p>
                )}
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Stock Out Date
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {new Date(stockOut.stockOutDate).toLocaleDateString(undefined, {
                    dateStyle: "long",
                  })}
                </span>
              </div>
            </div>

            {/* Issued To */}
            {stockOut.issuedTo && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Issued To
                  </span>
                  <span className="text-sm font-bold text-slate-800">{stockOut.issuedTo}</span>
                </div>
              </div>
            )}

            {/* Received By */}
            {stockOut.receivedBy && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Received By
                  </span>
                  <span className="text-sm font-bold text-slate-800">{stockOut.receivedBy}</span>
                </div>
              </div>
            )}
          </div>

          {/* Note */}
          {stockOut.note && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                Note
              </p>
              <p className="text-sm text-slate-700 italic">"{stockOut.note}"</p>
            </div>
          )}
        </div>

        {/* ── Line Items Table ── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1.5">
            Items ({stockOut.items?.length ?? 0})
          </h3>

          {!stockOut.items || stockOut.items.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No items on this stock out document.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="px-2.5 py-2">#</th>
                    <th className="px-2.5 py-2">Item</th>
                    <th className="px-2.5 py-2">Unit</th>
                    <th className="px-2.5 py-2">Quantity</th>
                    <th className="px-2.5 py-2 hidden sm:table-cell">Base Qty</th>
                    <th className="px-2.5 py-2 hidden md:table-cell">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {stockOut.items.map((line, idx) => (
                    <tr key={line.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-2.5 py-2 text-slate-400 font-semibold text-xs">{idx + 1}</td>
                      <td className="px-2.5 py-2 font-semibold text-slate-900">
                        {line.item?.name ?? "—"}
                        <span className="block text-xs text-slate-400 font-normal mt-0.5">
                          {line.item?.type?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-2.5 py-2 font-medium text-slate-700">
                        {line.unit?.name ?? "—"}
                        <span className="text-xs text-slate-400 ml-1">({line.unit?.symbol})</span>
                      </td>
                      <td className="px-2.5 py-2 font-bold text-slate-900">{line.quantity}</td>
                      <td className="px-2.5 py-2 text-slate-500 hidden sm:table-cell">
                        {line.baseQuantity}
                        <span className="text-xs text-slate-400 ml-1">
                          ({line.item?.baseUnitId ? line.unit?.symbol : "base"})
                        </span>
                      </td>
                      <td className="px-2.5 py-2 text-slate-500 italic text-xs hidden md:table-cell">
                        {line.note ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

       
        {stockOut.status === StockOutStatus.DRAFT && (
          <div className="flex justify-end gap-3.5 bg-white border border-slate-100 rounded-2xl p-3.5 shadow-sm">
            {/* <button
              onClick={handleCancel}
              disabled={isCancelling || isPosting}
              className="px-5 py-2 border border-slate-200 hover:bg-slate-50 text-red-600 hover:text-red-700 font-bold text-sm rounded-xl transition flex items-center gap-2 disabled:opacity-50"
            >
              {isCancelling && <Loader2 className="h-4 w-4 animate-spin" />}
              Cancel Stock Out
            </button> */}
            <button
              onClick={handlePost}
              disabled={isPosting}
              className="px-6 py-2 bg-orange-600 text-white hover:bg-orange-700 font-bold text-sm rounded-xl shadow-sm hover:shadow transition flex items-center gap-2 disabled:opacity-50"
            >
              {isPosting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPosting ? "Posting..." : "Post Stock Out"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}