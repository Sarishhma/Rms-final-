import { Loader2, AlertCircle, Receipt } from "lucide-react";
import type { Refund } from "../types/refund.types";
import { useNavigate } from "react-router-dom";

interface RefundsTableProps {
  refunds: Refund[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
  isLoading: boolean;
  isError: boolean;
  page: number;
  setPage: (page: number) => void;

}

const statusStyles: Record<string, string> = {
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
};

export function RefundsTable({
  refunds,
  meta,
  isLoading,
  isError,
  page,
  setPage,
}: RefundsTableProps) {
  const navigate = useNavigate()
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading refunds...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-16 text-red-500 gap-2">
        <AlertCircle className="w-5 h-5" />
        Failed to load refunds
      </div>
    );
  }

  if (refunds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <Receipt className="w-8 h-8 mb-2" strokeWidth={1.5} />
        No refunds found
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-medium text-slate-500">
              <th className="px-4 py-3">Bill No.</th>
              <th className="px-4 py-3">Refund Amount</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Processed By</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {refunds.map((refund) => (
              <tr
                key={refund.id}
                onClick={() =>  navigate(`/admin/refunds/${refund.id}`)}
                className="border-b border-slate-100 last:border-0 hover:bg-orange-100/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 font-medium text-slate-700">
                  {refund.payment.bill.billNumber}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  Rs. {Number(refund.amount).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-slate-500">{refund.method}</td>
                <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">
                  {refund.reason}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                      statusStyles[refund.status] ?? "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    {refund.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{refund.processedBy.name}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {new Date(refund.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="items-center px-4 py-3 border-t border-slate-200 text-sm">
         
          <div className="gap-2 grid grid-cols-3  items-center">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="justify-self-start px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Previous
            </button>
             <span className="text-slate-500 text-center">
            Page {meta.page} of {meta.totalPages} · {meta.total} total
          </span>
            <button
              disabled={page >= meta.totalPages}
              onClick={() => setPage(page + 1)}
              className=" justify-self-end px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}