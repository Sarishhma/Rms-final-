import { useState, useMemo } from "react";
import {
  CreditCard,
  QrCode,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  Users,
  BarChart2,
  ChevronDown,
  Download,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import type {
  PaymentMethodRow,
  PaymentStaffBreakdown,
} from "@/features/reports/types/paymentReport";

import { usePaymentReport } from "@/features/reports/hooks/report.hook";
import Loader from "@/features/shared/LottieLoader";
import type { Resolution } from "@/features/reports/types/resolution";
import { exportReportExcel } from "@/lib/report.export";

function formatDate(
  iso: string,
  style: "short" | "datetime" = "short",
): string {
  const d = new Date(iso);
  if (style === "datetime") {
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short" });
}

function getDateRange(resolution: Resolution): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString();
  const from = new Date(now);

  if (resolution === "day") {
    from.setHours(0, 0, 0, 0);
  } else if (resolution === "week") {
    from.setDate(now.getDate() - 7);
  } else {
    from.setMonth(now.getMonth() - 1);
  }

  return { from: from.toISOString(), to };
}

const METHOD_COLORS: Record<string, string> = {
  CARD: "#6366f1",
  QR: "#f59e0b",
  CASH: "#10b981",
  Mixed: "#3b82f6",
  DEFAULT: "#94a3b8",
};

const METHOD_ICONS: Record<string, React.ElementType> = {
  CARD: CreditCard,
  QR: QrCode,
};

const RESOLUTION_OPTIONS = [
  { label: "Today", value: "day" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  icon: Icon,
  gradient,
  light,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  gradient: string;
  light: string;
}) {
  return (
    <div
      className={`${light} rounded-2xl p-5 border border-white/60 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          {sub && <p className="text-xs text-slate-400">{sub}</p>}
        </div>
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const color = METHOD_COLORS[method] ?? METHOD_COLORS.DEFAULT;
  const Icon = METHOD_ICONS[method];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: `${color}18`, color }}
    >
      {Icon && <Icon size={11} />}
      {method}
    </span>
  );
}

function MethodBreakdownTable({ rows }: { rows: PaymentMethodRow[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b">
        <h3 className="font-semibold text-slate-700">
          Payment Method Breakdown
        </h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <th className="px-5 py-3 text-left">Method</th>
            <th className="px-5 py-3 text-right">Transactions</th>
            <th className="px-5 py-3 text-right">Amount</th>
            <th className="px-5 py-3 text-right">Share</th>
            <th className="px-5 py-3 text-right">Bar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((row) => {
            const color = METHOD_COLORS[row.method] ?? METHOD_COLORS.DEFAULT;
            return (
              <tr
                key={row.method}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-5 py-3">
                  <MethodBadge method={row.method} />
                </td>
                <td className="px-5 py-3 text-right font-medium text-slate-700">
                  {row.count}
                </td>
                <td className="px-5 py-3 text-right font-semibold text-slate-800">
                  Rs. {row.amount.toLocaleString()}
                </td>
                <td className="px-5 py-3 text-right text-slate-500">
                  {row.percentage.toFixed(1)}%
                </td>
                <td className="px-5 py-3 w-28">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${row.percentage}%`, background: color }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StaffTable({ staff }: { staff: PaymentStaffBreakdown[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center gap-2">
        <Users size={16} className="text-violet-500" />
        <h3 className="font-semibold text-slate-700">Staff Performance</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <th className="px-5 py-3 text-left">Staff</th>
            <th className="px-5 py-3 text-right">Transactions</th>
            <th className="px-5 py-3 text-right">Total Collected</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {staff.map((s) => (
            <tr
              key={s.staff_id}
              className="hover:bg-slate-50 transition-colors"
            >
              <td className="px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold">
                    {s.staff_name.charAt(0)}
                  </div>
                  <span className="font-medium text-slate-700">
                    {s.staff_name}
                  </span>
                </div>
              </td>
              <td className="px-5 py-3 text-right text-slate-600">{s.count}</td>
              <td className="px-5 py-3 text-right font-semibold text-slate-800">
                Rs. {s.amount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border shadow-lg rounded-xl px-4 py-3 text-sm">
      <p className="text-slate-500 mb-1">{label}</p>
      <p className="font-bold text-slate-800">
        Rs. {Number(payload[0]?.value).toLocaleString()}
      </p>
      <p className="text-slate-400 text-xs">{payload[1]?.value} transactions</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PaymentReportPage() {
  const [resolution, setResolution] = useState<Resolution>("day");
  const [resolutionOpen, setResolutionOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  // ✅ Derive from/to from resolution — no undefined variables
  const { from, to } = useMemo(() => getDateRange(resolution), [resolution]);

  // ✅ Pass complete ReportParams — satisfies from + to + resolution
  const {
    data: report,
    isLoading,
    refetch,
  } = usePaymentReport({ from, to, resolution });

  const chartData = useMemo(() => {
    if (!report?.charts) return [];
    return report.charts.map((point) => ({
      label: formatDate(point.period, "short"),
      amount: point.amount,
      count: point.count,
    }));
  }, [report]);

  const pieData = useMemo(() => {
    if (!report?.rows) return [];
    return report.rows.map((row) => ({
      name: row.method,
      value: row.amount,
      color: METHOD_COLORS[row.method] ?? METHOD_COLORS.DEFAULT,
    }));
  }, [report]);

  if (isLoading) return <Loader />;
  if (!report) return null;

  const { summary, rows, comparison } = report;

  const summaryCards = [
    {
      label: "Net Revenue",
      value: `Rs. ${summary.net_revenue.toLocaleString()}`,
      sub: `${summary.total_payments} transactions`,
      icon: DollarSign,
      gradient: "from-violet-500 to-purple-600",
      light: "bg-violet-50",
    },
    {
      label: "Total Received",
      value: `Rs. ${summary.total_received.toLocaleString()}`,
      sub: "Gross collection",
      icon: TrendingUp,
      gradient: "from-emerald-500 to-green-600",
      light: "bg-emerald-50",
    },
    {
      label: "Avg. Payment",
      value: `Rs. ${summary.avg_payment.toLocaleString()}`,
      sub: "Per transaction",
      icon: BarChart2,
      gradient: "from-sky-500 to-blue-600",
      light: "bg-sky-50",
    },
    {
      label: "Total Refunded",
      value: `Rs. ${summary.total_refunded.toLocaleString()}`,
      sub: `${summary.total_refunds} refund${summary.total_refunds !== 1 ? "s" : ""}`,
      icon: TrendingDown,
      gradient: "from-rose-500 to-red-600",
      light: "bg-rose-50",
    },
  ];

  const activeLabel =
    RESOLUTION_OPTIONS.find((o) => o.value === resolution)?.label ?? "Today";

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportReportExcel(
        "payments",
        { from, to, resolution },
        `payment-report-${from.slice(0, 10)}-${to.slice(0, 10)}.xlsx`,
      );
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Payment Report
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Generated {formatDate(report.meta.generatedAt, "datetime")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Resolution Picker */}
          <div className="relative">
            <button
              onClick={() => setResolutionOpen((p) => !p)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white text-sm text-slate-600 hover:bg-slate-50 transition"
            >
              {activeLabel}
              <ChevronDown size={14} />
            </button>
            {resolutionOpen && (
              <div className="absolute right-0 top-10 bg-white border shadow-lg rounded-xl w-36 z-10 overflow-hidden">
                {RESOLUTION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setResolution(opt.value);
                      setResolutionOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-slate-50 ${
                      resolution === opt.value
                        ? "text-violet-600 font-semibold"
                        : "text-slate-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white text-sm text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
          >
            <Download size={14} />
            {exporting ? "Exporting..." : "Export"}
          </button>

          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 transition"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area Chart — 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">Revenue Over Time</h3>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full capitalize">
              {resolution}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="paymentGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#paymentGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart — 1/3 width */}
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Method Split</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-slate-600">{value}</span>
                  )}
                />
                <Tooltip
                  formatter={(value) => [
                    `Rs. ${Number(value ?? 0).toFixed(2)}`,
                    "Amount",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-300 text-sm">
              No data
            </div>
          )}
        </div>
      </div>

      {/* ── Tables Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MethodBreakdownTable rows={rows} />
        <StaffTable staff={comparison.byStaff} />
      </div>
    </div>
  );
}
