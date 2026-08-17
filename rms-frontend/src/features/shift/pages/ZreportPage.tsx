import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import { useZReport } from '../hooks/useGetService.hooks';
import { ZReportCard } from '../components/ZreportCard';

export default function ZReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useZReport(id);

  return (
    <div className="p-2 bg-white">
      {/* ─── Page Header ──────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-[auto_1fr_auto] items-center gap-4 bg-white border border-slate-200/80 rounded-2xl px-5 py-4 shadow-sm">
        {/* Left: Back button */}
        <button
          onClick={() => navigate(`/admin/shifts/${id}`)}
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-orange-50 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-100"
          aria-label="Back to shift details"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </button>

        {/* Center: Icon + Title (always centered) */}
        <div className="flex items-center justify-center gap-3 text-center">
          <div className="p-2 rounded-xl bg-orange-100 flex-shrink-0">
            <Printer className="w-6 h-6 text-orange-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Z-Report
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              End-of-shift reconciliation summary
            </p>
          </div>
        </div>

        {/* Right: Print Button (or empty spacer to keep title centered) */}
        {/* <div className="flex justify-end">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-100 whitespace-nowrap"
          >
            <Printer className="h-4 w-4" strokeWidth={2} />
            Print Report
          </button>
        </div> */}
      </div>

      {/* ─── Report Card ──────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-5 sm:p-6">
        <ZReportCard
          report={data?.data}
          isLoading={isLoading}
          isError={isError}
        />
      </div>
    </div>
  );
}