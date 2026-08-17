// DashboardPage.tsx
import {
  ShoppingCart,
  TrendingUp,
  Clock,
  Percent,
  DollarSign,
  XCircle,
  Ban,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useOrder } from "@/features/orders/hooks/useGetOrders";
import type {
  Order,
  OrderStatus,
  PaymentStatus,
} from "@/features/orders/types";
import { useExecutiveDashboard } from "@/hooks/report/useExecutiveDashboard";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ─── Enums → display labels ───────────────────────────────────────────────────
const STATUS_LABEL: Record<OrderStatus, string> = {
  DRAFT: "Draft",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  VOIDED: "Voided",
  COMPLETED: "Completed",
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  COMPLETED: "COMPLETED",
  PENDING: "Pending",
  REFUNDED: "Refunded",
  FAILED: "FAILED",
  VOIDED: "VOIDED",
};

// ─── Style maps ───────────────────────────────────────────────────────────────
const statusStyles: Record<string, string> = {
  Draft: "bg-gray-50 text-gray-700",
  Confirmed: "bg-blue-50 text-blue-800",
  Cancelled: "bg-red-50 text-red-800",
  Voided: "bg-slate-100 text-slate-500",
  Completed: "bg-green-50 text-green-800",

  COMPLETED: "bg-emerald-50 text-emerald-800",
  PENDING: "bg-rose-50 text-rose-800",
  REFUNDED: "bg-blue-50 text-blue-800",
  FAILED: "bg-red-50 text-red-800",
  VOIDED: "bg-slate-100 text-slate-500",
};
const accentMap = {
  emerald: {
    bg: "bg-emerald-50",
    iconBg: "from-emerald-500 to-green-600",
    text: "text-emerald-600",
  },
  blue: {
    bg: "bg-blue-50",
    iconBg: "from-blue-500 to-indigo-600",
    text: "text-blue-600",
  },
  violet: {
    bg: "bg-violet-50",
    iconBg: "from-violet-500 to-purple-600",
    text: "text-violet-600",
  },
  red: {
    bg: "bg-red-50",
    iconBg: "from-red-500 to-rose-600",
    text: "text-red-600",
  },
  orange: {
    bg: "bg-orange-50",
    iconBg: "from-orange-500 to-amber-500",
    text: "text-orange-600",
  },
  cyan: {
    bg: "bg-cyan-50",
    iconBg: "from-cyan-500 to-sky-600",
    text: "text-cyan-600",
  },
  yellow: {
    bg: "bg-yellow-50",
    iconBg: "from-yellow-500 to-orange-500",
    text: "text-yellow-600",
  },
  pink: {
    bg: "bg-pink-50",
    iconBg: "from-pink-500 to-rose-600",
    text: "text-pink-600",
  },
  teal: {
    bg: "bg-teal-50",
    iconBg: "from-teal-500 to-cyan-600",
    text: "text-teal-600",
  },
} as const;

type Accent = keyof typeof accentMap;

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function OrderCardSkeleton() {
  return (
    <div className="border border-slate-200 rounded-2xl bg-white animate-pulse overflow-hidden">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="px-5 py-4 border-b border-slate-100 space-y-2">
          <div className="h-3 bg-slate-100 rounded w-1/3" />
          <div className="h-4 bg-slate-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

// ─── Order card ───────────────────────────────────────────────────────────────
function OrderCard({ order }: { order: Order }) {
  const navigate = useNavigate();
  const orderLabel = STATUS_LABEL[order.status];
  const paymentLabel = PAYMENT_LABEL[order.paymentStatus];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/orders/${order.id}`)}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/orders/${order.id}`)}
      className="border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden"
    >
      {/* Order number + time */}
      <div className="flex justify-between px-5 py-3 border-b border-slate-100">
        <div>
          <p className="text-[11px] uppercase text-slate-400 font-semibold">
            Order
          </p>
          <h3 className="text-base font-semibold text-slate-800">
            {order.orderNumber}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase text-slate-400 font-semibold">
            Time
          </p>
          <h3 className="text-sm font-medium text-slate-700">
            {new Date(order.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </h3>
        </div>
      </div>

      {/* Table + guests */}
      <div className="flex justify-between px-5 py-3 border-b border-slate-100">
        <div>
          <p className="text-[11px] uppercase text-slate-400">Table</p>
          <h3 className="text-sm text-slate-700">{order.table?.name ?? "—"}</h3>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase text-slate-400">Guests</p>
          <h3 className="text-sm text-slate-700">{order.guestCount}</h3>
        </div>
      </div>

      {/* Items */}
      <div className="px-5 py-3 border-b border-slate-100">
        <p className="text-[11px] uppercase text-slate-400 mb-2">Items</p>
        <div className="space-y-1">
          {order.items?.map((item, i) => (
            <p key={i} className="text-sm flex justify-between text-slate-600">
              <span>{item.menuItem?.name}</span>
              <span>× {item.quantity}</span>
            </p>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div className="px-5 py-3 border-b border-slate-100">
        <p className="text-[11px] uppercase text-slate-400">Amount</p>
        <h2 className="text-sm font-bold text-slate-800">
          NPR {order.grandTotal.toLocaleString()}
        </h2>
      </div>

      {/* Status badges */}
      <div className="flex justify-between px-5 py-3">
        <span
          className={`text-xs px-3 py-1 rounded-full ${statusStyles[orderLabel] ?? ""}`}
        >
          {orderLabel}
        </span>
        <span
          className={`text-xs px-3 py-1 rounded-full ${statusStyles[paymentLabel] ?? ""}`}
        >
          {paymentLabel}
        </span>
      </div>
    </div>
  );
}

// const today    = new Date().toISOString().split("T")[0];
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split("T")[0];
const toDate = new Date();
toDate.setHours(23, 59, 59, 999);

const toDateString = toDate.toISOString();
function DashboardPage() {
  const { data, isLoading, isError } = useOrder({ page: 1, limit: 6 });

  const { data: execData, isLoading: execLoading } = useExecutiveDashboard({
    from: thirtyDaysAgo,
    to: toDateString,
  });
  const orders: Order[] = data?.data ?? [];
  const summary = execData?.summary;
  const todayOrderData = execData?.summary.todayOrders;

  const chartData = (execData?.charts ?? []).map((c) => ({
    label: new Date(c.period).toLocaleDateString([], {
      month: "short",
      day: "numeric",
    }),
    revenue: c.net_bill_amount,
    orders: c.orders,
  }));

  const fmt = (n: number | undefined) => `NPR ${(n ?? 0).toLocaleString()}`;

  const SALES_STATS = [
    {
      title: "Total revenue",
      value: execLoading ? "—" : fmt(summary?.total_revenue),
      growth: summary?.margin_pct
        ? `${summary.margin_pct.toFixed(1)}% margin`
        : "",
      compare: "",
      icon: DollarSign,
      accent: "emerald" as Accent,
    },
    {
      title: "Total orders",
      value: execLoading ? "—" : String(summary?.total_orders ?? 0),
      growth: "",
      compare: "last 30 days",
      icon: ShoppingCart,
      accent: "blue" as Accent,
    },
    {
      title: "Avg order value",
      value: execLoading ? "—" : fmt(summary?.avg_order_value),
      growth: "",
      compare: "per order",
      icon: TrendingUp,
      accent: "violet" as Accent,
    },
    {
      title: "Gross profit",
      value: execLoading ? "—" : fmt(summary?.gross_profit),
      growth: summary?.margin_pct ? `${summary.margin_pct.toFixed(1)}%` : "",
      compare: "margin",
      icon: Percent,
      accent: "teal" as Accent,
    },
  ] as const;

  const ORDER_STATS = [
    {
      title: "Today's orders",
      value: todayOrderData?.all_orders,
      icon: ShoppingCart,
      accent: "orange" as Accent,
    },
    {
      title: "Active orders",
      value: todayOrderData?.active_orders,
      icon: Clock,
      accent: "cyan" as Accent,
    },
    {
      title: "Cancelled",
      value: todayOrderData?.cancelled_orders,
      icon: XCircle,
      accent: "red" as Accent,
    },
    {
      title: "Voided",
      value: todayOrderData?.voided_orders,
      icon: Ban,
      accent: "yellow" as Accent,
    },
  ] as const;

  return (
    <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <section className="py-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
          Dashboard
        </h1>
        <p className="text-sm text-slate-500">
          Restaurant performance overview
        </p>
      </section>

      {/* Sales stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {SALES_STATS.map(
          ({ title, value, growth, compare, icon: Icon, accent }) => {
            const a = accentMap[accent] ?? accentMap.blue;
            return (
              <div
                key={title}
                className={`${a.bg} rounded-3xl p-4 border border-white/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {title}
                    </p>
                    <h2
                      className={`text-lg font-bold text-slate-800 mt-3 ${
                        execLoading
                          ? "animate-pulse bg-slate-200 rounded w-24 h-6"
                          : ""
                      }`}
                    >
                      {execLoading ? "" : value}
                    </h2>
                  </div>
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${a.iconBg} flex items-center justify-center text-white shadow-md shrink-0`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 min-h-[24px] text-sm text-slate-500">
                  {growth && (
                    <>
                      <span className={`font-semibold ${a.text}`}>
                        {growth}
                      </span>{" "}
                    </>
                  )}
                  {compare}
                </div>
              </div>
            );
          },
        )}
      </section>

      {/* Revenue chart */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">
            Revenue trend · last 30 days
          </h2>
        </div>
        {execLoading ? (
          <div className="h-[220px] animate-pulse bg-slate-100 rounded-2xl" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value, name) => {
                  const v = Number(value ?? 0);

                  return [v, name];
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#revenueGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Order stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {ORDER_STATS.map(({ title, value, icon: Icon, accent }) => {
          const a = accentMap[accent];
          return (
            <div
              key={title}
              className={`${a.bg} rounded-3xl p-5 border border-white/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <p className="text-sm font-medium text-slate-500">{title}</p>
                  <h2 className="text-xl font-bold text-slate-800 mt-3">
                    {value}
                  </h2>
                </div>
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${a.iconBg} flex items-center justify-center text-white shadow-md shrink-0`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Recent orders */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-base font-semibold text-slate-800">
            Recent orders
          </h2>
          <Link
            to="/admin/orders"
            className="text-green-600 font-bold text-sm hover:text-green-700"
          >
            View all
          </Link>
        </div>

        {isError && (
          <p className="text-sm text-red-500 mb-4">
            Failed to load orders. Please try again.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading
            ? [...Array(6)].map((_, i) => <OrderCardSkeleton key={i} />)
            : orders.map((order) => <OrderCard key={order.id} order={order} />)}
        </div>
      </section>
    </main>
  );
}

export default DashboardPage;
