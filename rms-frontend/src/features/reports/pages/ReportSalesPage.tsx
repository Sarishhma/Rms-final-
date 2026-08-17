// ReportSalesPage.tsx
import { useMemo, useState } from "react";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Tag,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useSalesReport } from "@/features/reports/hooks/report.hook";
import { mapSalesReport } from "@/lib/mappers/sales.mapper";
import type { Resolution } from "@/features/reports/types/salesReport";
import type {
  MappedKPIs,
  MappedGrowth,
  MappedStaff,
  MappedChartPoint,
} from "@/lib/mappers/sales.mapper";
import { exportReportExcel } from "@/lib/report.export";

const today = () => new Date().toISOString().split("T")[0];

function buildParams(from: string, to: string, resolution: Resolution) {
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);
  return {
    from: new Date(from).toISOString(),
    to: toDate.toISOString(),
    resolution,
  };
}

function fmt(n: number) {
  return `Rs ${n.toLocaleString()}`;
}

const KPI_CONFIG: {
  key: keyof MappedKPIs;
  label: string;
  icon: React.ElementType;
  color: string;
  format: (v: number) => string;
}[] = [
  {
    key: "revenue",
    label: "Net Revenue",
    icon: DollarSign,
    color: "bg-emerald-500",
    format: fmt,
  },
  {
    key: "orders",
    label: "Total Orders",
    icon: ShoppingCart,
    color: "bg-blue-500",
    format: (v) => String(v),
  },
  {
    key: "avg",
    label: "Avg Order",
    icon: TrendingUp,
    color: "bg-violet-500",
    format: fmt,
  },
  {
    key: "max",
    label: "Max Order",
    icon: ArrowUpRight,
    color: "bg-orange-500",
    format: fmt,
  },
  {
    key: "min",
    label: "Min Order",
    icon: ArrowDownRight,
    color: "bg-rose-500",
    format: fmt,
  },
  {
    key: "tax",
    label: "Tax Collected",
    icon: Receipt,
    color: "bg-indigo-500",
    format: fmt,
  },
  {
    key: "discount",
    label: "Discount",
    icon: Tag,
    color: "bg-amber-500",
    format: fmt,
  },
];

function KPICards({ kpis }: { kpis: MappedKPIs }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {KPI_CONFIG.map(({ key, label, icon: Icon, color, format }) => (
        <div
          key={key}
          className={`${color} text-white rounded-2xl p-4 flex justify-between items-center shadow-sm`}
        >
          <div>
            <p className="text-xs opacity-80 font-medium">{label}</p>
            <h2 className="text-lg font-bold mt-1">{format(kpis[key])}</h2>
          </div>
          <div className="bg-white/20 p-2.5 rounded-xl">
            <Icon className="w-5 h-5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function GrowthCards({ growth }: { growth: MappedGrowth }) {
  const items = [
    {
      label: "Revenue vs prev. period",
      change: growth.revenueChange,
      pct: growth.revenueChangePct,
      display: fmt(Math.abs(growth.revenueChange)),
    },
    {
      label: "Orders vs prev. period",
      change: growth.orderChange,
      pct: growth.orderChangePct,
      display: `${Math.abs(growth.orderChange)} orders`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map(({ label, change, pct, display }) => {
        const up = change >= 0;
        return (
          <div
            key={label}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{label}</p>
            <div className="flex items-center gap-2 mt-3">
              {up ? (
                <ArrowUpRight className="w-5 h-5 text-emerald-500" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-red-500" />
              )}
              <span className="text-lg font-bold text-slate-800">
                {display}
              </span>
              <span
                className={`text-sm font-semibold ${up ? "text-emerald-500" : "text-red-500"}`}
              >
                ({up ? "+" : "-"}
                {Math.abs(pct)}%)
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Staff Bar Chart ──────────────────────────────────────────────────────────
function StaffChart({ data }: { data: MappedStaff[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Revenue by staff
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value) => [
              `Rs. ${Number(value ?? 0).toFixed(2)}`,
              "Revenue",
            ]}
          />{" "}
          <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Timeline Chart ───────────────────────────────────────────────────────────
const RESOLUTIONS: Resolution[] = ["day", "week", "month"];

function TimelineChart({
  data,
  resolution,
  onResolutionChange,
  isLoading,
}: {
  data: MappedChartPoint[];
  resolution: Resolution;
  onResolutionChange: (r: Resolution) => void;
  isLoading: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">
          Sales over time
        </h3>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {RESOLUTIONS.map((r) => (
            <button
              key={r}
              onClick={() => onResolutionChange(r)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                resolution === r
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-[260px] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={data}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value) => [
                `Rs. ${Number(value ?? 0).toFixed(2)}`,
                "Revenue",
              ]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Date Filter ──────────────────────────────────────────────────────────────
function DateFilter({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500 font-medium">From</label>
        <input
          type="date"
          value={from}
          max={to}
          onChange={(e) => onChange(e.target.value, to)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500 font-medium">To</label>
        <input
          type="date"
          value={to}
          min={from}
          max={today()}
          onChange={(e) => onChange(from, e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SalesReportPage() {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [resolution, setResolution] = useState<Resolution>("day");
  const [exporting, setExporting] = useState(false);

  // KPI query — no resolution, fixed to date range
  const kpiParams = useMemo(
    () => buildParams(from, to, "day"), // resolution irrelevant for summary/rows/comparison
    [from, to],
  );

  // Chart query — resolution-aware, refetches on resolution change
  const chartParams = useMemo(
    () => buildParams(from, to, resolution),
    [from, to, resolution],
  );

  const {
    data: kpiData,
    isLoading: kpiLoading,
    isError: kpiError,
  } = useSalesReport(kpiParams);

  const { data: chartData, isLoading: chartLoading } =
    useSalesReport(chartParams);

  const report = useMemo(() => {
    if (!kpiData) return null;
    return mapSalesReport(kpiData, resolution);
  }, [kpiData, resolution]);

  const timeline = useMemo(() => {
    if (!chartData) return [];
    return mapSalesReport(chartData, resolution).timeline;
  }, [chartData, resolution]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportReportExcel(
        "sales",
        {
          from: kpiParams.from,
          to: kpiParams.to,
          resolution: "day",
        },
        `staff-report-${from}-${to}.xlsx`,
      );
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  if (kpiLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (kpiError || !report) {
    return (
      <div className="p-6 text-red-500 font-semibold">
        Failed to load sales report.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sales Report</h1>
          <p className="text-sm text-slate-500 mt-1">
            Revenue and order analytics
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting || kpiLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      {/* Date filter */}
      <DateFilter
        from={from}
        to={to}
        onChange={(f, t) => {
          setFrom(f);
          setTo(t);
        }}
      />

      {/* KPIs */}
      <KPICards kpis={report.kpis} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimelineChart
          data={timeline}
          resolution={resolution}
          onResolutionChange={setResolution}
          isLoading={chartLoading}
        />
        <StaffChart data={report.staff} />
      </div>

      {/* Growth */}
      <GrowthCards growth={report.growth} />
    </div>
  );
}
