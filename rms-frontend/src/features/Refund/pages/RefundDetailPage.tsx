import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle, Receipt } from "lucide-react";
import { useRefundsById } from "../hook/useRefunds.hooks";


const statusStyles: Record<string, string> = {
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
};

export default function RefundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useRefundsById(id ?? "");
  const refund = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading refund...
      </div>
    );
  }

  if (isError || !refund) {
    return (
      <div className="flex items-center justify-center py-24 text-red-500 gap-2">
        <AlertCircle className="w-5 h-5" />
        Failed to load refund details
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 bg-white min-h-screen ">
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6 px-2 mt-4 p-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 px-3  rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 " />
        </button>
        <div className="p-2 rounded-xl bg-orange-100">
          <Receipt className="w-6 h-6 text-orange-600" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Refund — {refund.payment.bill.billNumber}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Processed {new Date(refund.createdAt).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <span
          className={`ml-auto inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
            statusStyles[refund.status] ?? "bg-slate-50 text-slate-600 border-slate-200"
          }`}
        >
          {refund.status}
        </span>
      </div>

      {/* ─── Summary cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 px-2">
        <SummaryCard label="Refund Amount" value={`Rs. ${Number(refund.amount).toLocaleString()}`} highlight />
        <SummaryCard label="Original Payment" value={`Rs. ${Number(refund.payment.amount).toLocaleString()}`} />
        <SummaryCard label="Method" value={refund.method} />
      </div>

      {/* ─── Details ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-2">
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Refund Information</h3>
          <div className="space-y-4">
            <DetailRow label="Reason" value={refund.reason} />
            <DetailRow label="Reference" value={refund.reference ?? "—"} />
            <DetailRow label="Processed By" value={refund.processedBy.name} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Linked Payment</h3>
          <div className="space-y-4">
            <DetailRow label="Bill Number" value={refund.payment.bill.billNumber} />
            <DetailRow label="Payment Amount" value={`Rs. ${Number(refund.payment.amount).toLocaleString()}`} />
            <DetailRow label="Payment Method" value={refund.payment.method} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5">
      <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${highlight ? "text-orange-600" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 pb-3 border-b border-slate-100 last:border-0">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <span className="text-sm text-slate-700">{value}</span>
    </div>
  );
}