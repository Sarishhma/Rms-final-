// pages/report/ItemReportPage.tsx
import { useMemo, useState } from "react";
import {
  Package,
  ShoppingBag,
  DollarSign,
  BarChart2,
  ArrowUpRight,
  AlertCircle,
  TrendingDown,
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
import { useItemReport } from "@/features/reports/hooks/report.hook";
import { mapItemReport } from "@/lib/mappers/item.mapper";
import type { Resolution } from "@/features/reports/types/itemsReport";
import type {
  MappedItemKPIs,
  MappedItemRow,
  MappedCategoryStat,
  MappedNeverOrdered,
  MappedChartPoint,
} from "@/lib/mappers/item.mapper";
import { exportReportExcel } from "@/lib/report.export";

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
      {(["From", "To"] as const).map((label) => {
        const value = label === "From" ? from : to;
        return (
          <div key={label} className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 font-medium">
              {label}
            </label>
            <input
              type="date"
              value={value}
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
        );
      })}
    </div>
  );
}

const KPI_CONFIG: {
  key: keyof MappedItemKPIs;
  label: string;
  icon: React.ElementType;
  color: string;
  format: (v: number) => string;
}[] = [
  {
    key: "totalSales",
    label: "Total Sales",
    icon: DollarSign,
    color: "bg-emerald-500",
    format: fmt,
  },
  {
    key: "totalQuantity",
    label: "Items Sold",
    icon: ShoppingBag,
    color: "bg-blue-500",
    format: String,
  },
  {
    key: "uniqueItems",
    label: "Unique Items",
    icon: Package,
    color: "bg-violet-500",
    format: String,
  },
  {
    key: "avgItemPrice",
    label: "Avg Item Price",
    icon: BarChart2,
    color: "bg-orange-500",
    format: fmt,
  },
];

function KPICards({ kpis }: { kpis: MappedItemKPIs }) {
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
          Sales & quantity over time
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
              yAxisId="sales"
              orientation="left"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="quantity"
              orientation="right"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value, name) => {
                const v = Number(value ?? 0);

                return [name === "sales" ? fmt(v) : v, name];
              }}
            />
            <Legend />
            <Line
              yAxisId="sales"
              type="monotone"
              dataKey="sales"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              yAxisId="quantity"
              type="monotone"
              dataKey="quantity"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function CategoryChart({ data }: { data: MappedCategoryStat[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Sales by category
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value, name) => {
              const v = Number(value ?? 0);

              return [name === "sales" ? fmt(v) : v, name];
            }}
          />{" "}
          <Bar dataKey="sales" fill="#f59e0b" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ItemsTable({
  title,
  data,
  icon: Icon,
  iconColor,
}: {
  title: string;
  data: MappedItemRow[];
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
            <th className="pb-2 font-medium">Item</th>
            <th className="pb-2 font-medium text-right">Qty</th>
            <th className="pb-2 font-medium text-right">Orders</th>
            <th className="pb-2 font-medium text-right">Sales</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50 transition">
              <td className="py-2.5 font-medium text-slate-700">{item.name}</td>
              <td className="py-2.5 text-right text-slate-500">
                {item.quantity}
              </td>
              <td className="py-2.5 text-right text-slate-500">
                {item.orderCount}
              </td>
              <td className="py-2.5 text-right font-medium text-slate-700">
                {fmt(item.sales)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Never Ordered ────────────────────────────────────────────────────────────
function NeverOrderedSection({ data }: { data: MappedNeverOrdered[] }) {
  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-rose-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-4 h-4 text-rose-400" />
        <h3 className="text-sm font-semibold text-slate-700">Never ordered</h3>
        <span className="ml-auto text-xs bg-rose-50 text-rose-500 font-medium px-2 py-0.5 rounded-full">
          {data.length} items
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
          >
            <div>
              <p className="text-sm font-medium text-slate-700">{item.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {item.categoryName}
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 shrink-0 ml-2">
              {fmt(item.basePrice)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ItemReportPage() {
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
  } = useItemReport(kpiParams);
  const { data: chartData, isLoading: chartLoading } =
    useItemReport(chartParams);

  const report = useMemo(() => {
    if (!kpiData) return null;
    return mapItemReport(kpiData, resolution);
  }, [kpiData, resolution]);

  const timeline = useMemo(() => {
    if (!chartData) return [];
    return mapItemReport(chartData, resolution).timeline;
  }, [chartData, resolution]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportReportExcel(
        "items",
        {
          from: kpiParams.from,
          to: kpiParams.to,
          resolution: "day",
        },
        `items-report-${from}-${to}.xlsx`,
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
        Failed to load item report.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Item Performance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Menu item analytics and dead stock
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
          resolution={resolution}
          onResolutionChange={setResolution}
          isLoading={chartLoading}
        />
        <CategoryChart data={report.byCategory} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ItemsTable
          title="Top performing items"
          data={report.topItems}
          icon={ArrowUpRight}
          iconColor="text-emerald-500"
        />
        <ItemsTable
          title="Bottom performing items"
          data={report.bottomItems}
          icon={TrendingDown}
          iconColor="text-rose-500"
        />
      </div>

      <NeverOrderedSection data={report.neverOrdered} />
    </div>
  );
}
