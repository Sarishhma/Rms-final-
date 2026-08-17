// pages/report/OrderReportPage.tsx
import { useMemo, useState } from "react";
import {
  ShoppingCart,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Timer,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useOrderReport } from "@/features/reports/hooks/report.hook";
import { mapOrderReport } from "@/lib/mappers/order.mapper";
import type { Resolution } from "@/features/reports/types/orderReport";
import type {
  MappedOrderKPIs,
  MappedOrderChannel,
  MappedOrderChartPoint,
} from "@/lib/mappers/order.mapper";
import { exportReportExcel } from "@/lib/report.export";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];
const fmt = (n: number | null | undefined) => `Rs ${(n ?? 0).toLocaleString()}`;

function buildParams(from: string, to: string, resolution: Resolution) {
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);
  return {
    from: new Date(from).toISOString(),
    to: toDate.toISOString(),
    resolution,
  };
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
      {(["From", "To"] as const).map((label) => (
        <div key={label} className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-medium">{label}</label>
          <input
            type="date"
            value={label === "From" ? from : to}
            max={label === "From" ? to : today()}
            min={label === "To" ? from : undefined}
            onChange={(e) =>
              label === "From"
                ? onChange(e.target.value, to)
                : onChange(from, e.target.value)
            }
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        </div>
      ))}
    </div>
  );
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────
const KPI_CONFIG: {
  key: keyof MappedOrderKPIs;
  label: string;
  icon: React.ElementType;
  color: string;
  format: (v: number) => string;
}[] = [
  {
    key: "totalOrders",
    label: "Total Orders",
    icon: ShoppingCart,
    color: "bg-blue-500",
    format: String,
  },
  {
    key: "completedOrders",
    label: "Completed",
    icon: CheckCircle,
    color: "bg-emerald-500",
    format: String,
  },
  {
    key: "cancelledOrders",
    label: "Cancelled",
    icon: XCircle,
    color: "bg-rose-500",
    format: String,
  },
  {
    key: "pendingOrders",
    label: "Pending",
    icon: Clock,
    color: "bg-amber-500",
    format: String,
  },
  {
    key: "avgOrderValue",
    label: "Avg Order Value",
    icon: TrendingUp,
    color: "bg-violet-500",
    format: fmt,
  },
  {
    key: "avgGuestCount",
    label: "Avg Guests",
    icon: Users,
    color: "bg-cyan-500",
    format: String,
  },
  {
    key: "avgItemsPerOrder",
    label: "Avg Items / Order",
    icon: UtensilsCrossed,
    color: "bg-indigo-500",
    format: String,
  },
  {
    key: "fulfillmentAvgMin",
    label: "Avg Fulfillment",
    icon: Timer,
    color: "bg-orange-500",
    format: (v) => `${v} min`,
  },
];

function KPICards({ kpis }: { kpis: MappedOrderKPIs }) {
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

// ─── Fulfillment Card ─────────────────────────────────────────────────────────
function FulfillmentCard({ kpis }: { kpis: MappedOrderKPIs }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Fulfillment time
      </h3>
      <div className="grid grid-cols-3 divide-x divide-slate-100">
        {[
          { label: "Min", value: kpis.fulfillmentMinMin },
          { label: "Avg", value: kpis.fulfillmentAvgMin },
          { label: "Max", value: kpis.fulfillmentMaxMin },
        ].map(({ label, value }) => (
          <div key={label} className="px-4 text-center first:pl-0 last:pr-0">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{value}</p>
            <p className="text-xs text-slate-400">min</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Cancellation Card ────────────────────────────────────────────────────────
function CancellationCard({ kpis }: { kpis: MappedOrderKPIs }) {
  const bad = kpis.cancellationRate > 10;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Cancellation rate
      </h3>
      <div className="flex items-center gap-3">
        {bad ? (
          <ArrowUpRight className="w-6 h-6 text-rose-500" />
        ) : (
          <ArrowDownRight className="w-6 h-6 text-emerald-500" />
        )}
        <span
          className={`text-3xl font-bold ${bad ? "text-rose-500" : "text-emerald-500"}`}
        >
          {kpis.cancellationRate}%
        </span>
        <span className="text-xs text-slate-400">
          {kpis.cancelledOrders + kpis.voidedOrders} of {kpis.totalOrders}{" "}
          orders
        </span>
      </div>
    </div>
  );
}

// ─── Channel Table ────────────────────────────────────────────────────────────
function ChannelTable({ data }: { data: MappedOrderChannel[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Orders by channel
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
            <th className="pb-2 font-medium">Channel</th>
            <th className="pb-2 font-medium text-right">Orders</th>
            <th className="pb-2 font-medium text-right">Revenue</th>
            <th className="pb-2 font-medium text-right">Avg Value</th>
            <th className="pb-2 font-medium text-right">Cancel %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((row) => (
            <tr key={row.channel} className="hover:bg-slate-50 transition">
              <td className="py-2.5 font-medium text-slate-700">
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-md">
                  {row.channel}
                </span>
              </td>
              <td className="py-2.5 text-right text-slate-600">{row.orders}</td>
              <td className="py-2.5 text-right text-slate-600">
                {fmt(row.revenue)}
              </td>
              <td className="py-2.5 text-right text-slate-600">
                {fmt(row.avgValue)}
              </td>
              <td
                className={`py-2.5 text-right font-medium ${row.cancellationRate > 10 ? "text-rose-500" : "text-emerald-500"}`}
              >
                {row.cancellationRate}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
  data: MappedOrderChartPoint[];
  resolution: Resolution;
  onResolutionChange: (r: Resolution) => void;
  isLoading: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">
          Orders over time
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
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="orders"
              orientation="left"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="revenue"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value, name) => {
                const v = Number(value ?? 0);

                return [name === "revenue" ? fmt(v) : v, name];
              }}
            />{" "}
            <Legend />
            <Line
              yAxisId="orders"
              type="monotone"
              dataKey="orders"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              yAxisId="orders"
              type="monotone"
              dataKey="cancelled"
              stroke="#f43f5e"
              strokeWidth={2}
              dot={{ r: 3 }}
              strokeDasharray="4 4"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Cancellation Bar Chart ───────────────────────────────────────────────────
function CancellationChart({ data }: { data: MappedOrderChartPoint[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Cancellation rate over time
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            formatter={(value) => {
              const v = Number(value ?? 0);
              return [`${v}%`, "Cancellation rate"];
            }}
          />{" "}
          <Bar
            dataKey="cancellationRate"
            fill="#f43f5e"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OrderReportPage() {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [resolution, setResolution] = useState<Resolution>("day");
  const [exporting, setExporting] = useState(false);

  const kpiParams = useMemo(() => buildParams(from, to, "day"), [from, to]);

  const chartParams = useMemo(
    () => buildParams(from, to, resolution),
    [from, to, resolution],
  );

  const {
    data: kpiData,
    isLoading: kpiLoading,
    isError,
  } = useOrderReport(kpiParams);
  const { data: chartData, isLoading: chartLoading } =
    useOrderReport(chartParams);

  const report = useMemo(() => {
    if (!kpiData) return null;
    return mapOrderReport(kpiData, "day");
  }, [kpiData]);

  const timeline = useMemo(() => {
    if (!chartData) return [];
    return mapOrderReport(chartData, resolution).timeline;
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
        `order-report-${from}-${to}.xlsx`,
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

  if (isError || !report) {
    return (
      <div className="p-6 text-red-500 font-semibold">
        Failed to load order report.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Order Report</h1>
          <p className="text-sm text-slate-500 mt-1">
            Order volume, fulfillment, and cancellation analytics
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

      <DateFilter
        from={from}
        to={to}
        onChange={(f, t) => {
          setFrom(f);
          setTo(t);
        }}
      />

      <KPICards kpis={report.kpis} />

      {/* Fulfillment + Cancellation side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FulfillmentCard kpis={report.kpis} />
        <CancellationCard kpis={report.kpis} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimelineChart
          data={timeline}
          resolution={resolution}
          onResolutionChange={setResolution}
          isLoading={chartLoading}
        />
        <CancellationChart data={timeline} />
      </div>

      {/* Channel breakdown */}
      <ChannelTable data={report.channels} />
    </div>
  );
}
