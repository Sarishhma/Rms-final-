// CurrentShiftPage.tsx
import { useState } from "react";
import {
 
  Clock,
  Calendar,
  User,
  RefreshCw,
  Banknote,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { useCurrentShift } from "../hooks/useGetService.hooks";
import { CurrentShiftCard } from "../components/CurrentShiftCard";
import { OpenShiftForm } from "../components/OpenShiftForm";
import { CloseShiftModal } from "../components/CloseShiftModal";
import { CashEventModal } from "../components/CashEventModal";

function formatDuration(startIso: string) {
  const ms = Date.now() - new Date(startIso).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export default function CurrentShiftPage() {
  const { data, isLoading, isError, refetch } = useCurrentShift();
  const shift = data?.data;

  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [cashEventModalOpen, setCashEventModalOpen] = useState(false);

  // ── Loading State ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 border-t-orange-500" />
        </div>
        <p className="mt-5 text-sm text-slate-400 font-medium tracking-wide">
          Loading current shift
        </p>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <h3 className="text-base font-semibold text-slate-800 mb-1.5">
            Couldn't load the current shift
          </h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            Something went wrong retrieving shift data. Try again.
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-full transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── No Open Shift → Open Shift Form ─────────────────────────────
  if (!shift) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 py-4 bg-white ">
        <div className="w-full max-w-sm h-screen">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-orange-50 mb-4">
              <Clock className="w-5 h-5 text-orange-600" strokeWidth={1.75} />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
              No active shift
            </h2>
            <p className="text-slate-500 text-sm mt-1.5">
              Open a shift to start tracking sales and cash.
            </p>
          </div>
          <OpenShiftForm />
        </div>
      </div>
    );
  }

  // ── Shift Open → Full-width Dashboard ────────────────────────────
  return (
    <div className="w-full  h-screen bg-white p-6">
      {/* ── Header strip ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-7 mb-7 border-b border-slate-200/70 px-3">

            <div className="flex items-baseline gap-2.5">
              <h1 className="text-[1.7rem] font-semibold text-slate-900 tracking-tight leading-none">
                Current Shift
              </h1>
              
            </div>


        <div className="flex gap-2.5 flex-shrink-0">
          <button
            onClick={() => setCashEventModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl transition-all"
          >
            <Banknote className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
            Cash movement
          </button>
          <button
            onClick={() => setCloseModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition-all"
          >
            Close shift
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ── Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-200/70 border border-slate-200/70 rounded-2xl mb-7 overflow-hidden">
        <StatCell
          icon={User}
          label="Opened by"
          value={shift.openedBy.name}
        />
        <StatCell
          icon={Calendar}
          label="Opened at"
          value={new Date(shift.openedAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        />
        <StatCell
          icon={Clock}
          label="Duration"
          value={formatDuration(shift.openedAt)}
          accent="text-slate-900"
        />
        <StatCell
          icon={TrendingUp}
          label="Total sales"
          value={`Rs. ${Number(shift.totalSales).toLocaleString("en-NP")}`}
          accent="text-orange-600"
          last
        />
      </div>


      <CurrentShiftCard />

      {/* Modals */}
      <CloseShiftModal
        open={closeModalOpen}
        shift={shift}
        onClose={() => setCloseModalOpen(false)}
      />
      <CashEventModal
        open={cashEventModalOpen}
        id={shift.id}
        onClose={() => setCashEventModalOpen(false)}
      />
    </div>
  );
}

// ── Small internal component for the stat strip ──────────────────
function StatCell({
  icon: Icon,
  label,
  value,
  accent = "text-slate-800",
  last = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: string;
  last?: boolean;
}) {
  return (
    <div className={`px-5 py-4 ${last ? "" : ""}`}>
      <div className="flex items-center gap-1.5 text-slate-400 text-[0.7rem] font-medium uppercase tracking-wider mb-1.5">
        <Icon className="w-3 h-3" strokeWidth={2} />
        {label}
      </div>
      <p className={`text-[0.95rem] font-semibold ${accent} truncate`}>{value}</p>
    </div>
  );
}