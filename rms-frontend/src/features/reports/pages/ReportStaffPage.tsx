// pages/report/StaffReportPage.tsx
import { useMemo, useState } from "react";
import {
  Users,
  ShoppingCart,
  TrendingUp,
  UserCheck,
  XCircle,
  Package,
  UtensilsCrossed,
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
import { useStaffReport } from "@/features/reports/hooks/report.hook";
import { mapStaffReport } from "@/lib/mappers/staff.mapper";
import type { Resolution } from "@/features/reports/types/staffReport";
import type {
  MappedStaffKPIs,
  MappedStaffRow,
} from "@/lib/mappers/staff.mapper";
import { exportReportExcel } from "@/lib/report.export";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];

const STAFF_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4"];

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
  key: keyof MappedStaffKPIs;
  label: string;
  icon: React.ElementType;
  color: string;
  format: (v: number) => string;
}[] = [
  {
    key: "totalStaff",
    label: "Total Staff",
    icon: Users,
    color: "bg-violet-500",
    format: String,
  },
  {
    key: "totalOrders",
    label: "Total Orders",
    icon: ShoppingCart,
    color: "bg-blue-500",
    format: String,
  },
  {
    key: "totalItemsSold",
    label: "Items Sold",
    icon: Package,
    color: "bg-emerald-500",
    format: String,
  },
  {
    key: "totalGuestsServed",
    label: "Guests Served",
    icon: UserCheck,
    color: "bg-cyan-500",
    format: String,
  },
  {
    key: "avgOrdersPerStaff",
    label: "Avg Orders / Staff",
    icon: TrendingUp,
    color: "bg-indigo-500",
    format: String,
  },
  {
    key: "totalCancelled",
    label: "Cancelled",
    icon: XCircle,
    color: "bg-rose-500",
    format: String,
  },
  {
    key: "totalVoided",
    label: "Voided",
    icon: XCircle,
    color: "bg-orange-500",
    format: String,
  },
  {
    key: "cancellationRate",
    label: "Cancel Rate",
    icon: UtensilsCrossed,
    color: "bg-amber-500",
    format: (v) => `${v}%`,
  },
];

function KPICards({ kpis }: { kpis: MappedStaffKPIs }) {
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

// ─── Staff Table ──────────────────────────────────────────────────────────────
function StaffTable({ data }: { data: MappedStaffRow[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm overflow-x-auto">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Staff breakdown
      </h3>
      <table className="w-full text-sm min-w-[800px]">
        <thead>
          <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
            <th className="pb-2 font-medium">Staff</th>
            <th className="pb-2 font-medium">Role</th>
            <th className="pb-2 font-medium text-right">Orders</th>
            <th className="pb-2 font-medium text-right">Completed</th>
            <th className="pb-2 font-medium text-right">Items Sold</th>
            <th className="pb-2 font-medium text-right">Guests</th>
            <th className="pb-2 font-medium text-right">Avg Items</th>
            <th className="pb-2 font-medium text-right">Fulfillment</th>
            <th className="pb-2 font-medium text-right">Cancel %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50 transition">
              <td className="py-2.5 font-medium text-slate-700">{s.name}</td>
              <td className="py-2.5">
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                  {s.role}
                </span>
              </td>
              <td className="py-2.5 text-right text-slate-600">
                {s.totalOrders}
              </td>
              <td className="py-2.5 text-right text-emerald-600 font-medium">
                {s.completedOrders}
              </td>
              <td className="py-2.5 text-right text-slate-600">
                {s.totalItemsSold}
              </td>
              <td className="py-2.5 text-right text-slate-600">
                {s.totalGuestsServed}
              </td>
              <td className="py-2.5 text-right text-slate-600">
                {s.avgItemsPerOrder}
              </td>
              <td className="py-2.5 text-right text-slate-600">
                {s.avgFulfillmentMinutes} min
              </td>
              <td
                className={`py-2.5 text-right font-medium ${s.cancellationRate > 10 ? "text-rose-500" : "text-emerald-500"}`}
              >
                {s.cancellationRate}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Channel Breakdown per Staff ──────────────────────────────────────────────
function ChannelBreakdown({ data }: { data: MappedStaffRow[] }) {
  const chartData = data.map((s) => ({
    name: s.name,
    "Dine In": s.dineInOrders,
    Takeaway: s.takeawayOrders,
    Delivery: s.deliveryOrders,
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Orders by channel per staff
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="Dine In"
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
            stackId="a"
          />
          <Bar
            dataKey="Takeaway"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            stackId="a"
          />
          <Bar
            dataKey="Delivery"
            fill="#f59e0b"
            radius={[4, 4, 0, 0]}
            stackId="a"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Timeline Chart (multi-staff) ─────────────────────────────────────────────
const RESOLUTIONS: Resolution[] = ["day", "week", "month"];

function TimelineChart({
  data,
  staffNames,
  resolution,
  onResolutionChange,
  isLoading,
}: {
  data: Record<string, number | string>[];
  staffNames: string[];
  resolution: Resolution;
  onResolutionChange: (r: Resolution) => void;
  isLoading: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">
          Orders over time by staff
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
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {staffNames.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={`${name}_orders`}
                name={name}
                stroke={STAFF_COLORS[i % STAFF_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StaffReportPage() {
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
  } = useStaffReport(kpiParams);
  const { data: chartData, isLoading: chartLoading } =
    useStaffReport(chartParams);

  const report = useMemo(() => {
    if (!kpiData) return null;
    return mapStaffReport(kpiData, "day");
  }, [kpiData]);

  const { timeline, staffNames } = useMemo(() => {
    if (!chartData) return { timeline: [], staffNames: [] };
    const mapped = mapStaffReport(chartData, resolution);
    return { timeline: mapped.timeline, staffNames: mapped.staffNames };
  }, [chartData, resolution]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportReportExcel(
        "staff",
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

  if (isError || !report) {
    return (
      <div className="p-6 text-red-500 font-semibold">
        Failed to load staff report.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Staff Performance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Order activity and fulfillment by staff member
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimelineChart
          data={timeline}
          staffNames={staffNames}
          resolution={resolution}
          onResolutionChange={setResolution}
          isLoading={chartLoading}
        />
        <ChannelBreakdown data={report.rows} />
      </div>

      <StaffTable data={report.rows} />
    </div>
  );
}
