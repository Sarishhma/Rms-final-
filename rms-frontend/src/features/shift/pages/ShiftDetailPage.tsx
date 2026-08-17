import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Printer } from 'lucide-react';
import { useShiftById } from '../hooks/useGetService.hooks';
import { ShiftDetailCard } from '../components/Shiftdetailcard';

export default function ShiftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useShiftById(id);
  const shift = data?.data;

  return (
    <div className="p-2 bg-white">
      {/* ─── Page Header ──────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-[auto_1fr_auto] items-center gap-4 bg-white border border-slate-200/80 rounded-2xl px-5 py-4 shadow-sm">
        {/* Left: Back button */}
        <button
          onClick={() => navigate("/admin/shifts")}
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-orange-50 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-100"
          aria-label="Back to all shifts"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </button>

        {/* header*/}
        <div className="flex items-center justify-center gap-3 text-center">
          <div className="p-2 rounded-xl bg-orange-100 flex-shrink-0">
            <FileText className="w-6 h-6 text-orange-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {shift ? `Shift #${shift.shiftNumber}` : 'Shift Detail'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Full breakdown for this shift
            </p>
          </div>
        </div>

        {/* Right: Action Buttons (or empty spacer to keep title centered) */}
        <div className="flex justify-end">
          {shift?.status === 'CLOSED' && (
            <button
              onClick={() => navigate(`/admin/shifts/${shift.id}/z-report`)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-100 whitespace-nowrap"
            >
              <Printer className="h-4 w-4" strokeWidth={2} />
              View Z-Report
            </button>
          )}
        </div>
      </div>

      {/* ─── Detail Card ──────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-5 sm:p-6">
        <ShiftDetailCard
          shift={shift}
          isLoading={isLoading}
          isError={isError}
        />
      </div>
    </div>
  );
}