// lib/sales.mapper.ts
import type {
  SalesReportData,
  Resolution,
} from "@/features/reports/types/salesReport";

export interface MappedKPIs {
  revenue: number;
  orders: number;
  avg: number;
  max: number;
  min: number;
  tax: number;
  discount: number;
}

export interface MappedStaff {
  name: string;
  revenue: number;
  orders: number;
  avg: number;
}

export interface MappedChartPoint {
  label: string;
  revenue: number;
  orders: number;
  avg: number;
}

export interface MappedGrowth {
  revenueChange: number;
  revenueChangePct: number;
  orderChange: number;
  orderChangePct: number;
}

export interface MappedSalesReport {
  kpis: MappedKPIs;
  staff: MappedStaff[];
  timeline: MappedChartPoint[];
  growth: MappedGrowth;
}

function pct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function formatPeriodLabel(iso: string, resolution: Resolution): string {
  const date = new Date(iso);
  switch (resolution) {
    case "day":
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    case "week":
      return `W/o ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`;
    case "month":
      return date.toLocaleDateString([], { month: "short", year: "numeric" });
  }
}

export function mapSalesReport(
  data: SalesReportData,
  resolution: Resolution,
): MappedSalesReport {
  const { summary, rows, charts, comparison } = data;

  return {
    kpis: {
      revenue: summary.net_bill_amount,
      orders: summary.total_orders,
      avg: summary.avg_order_value,
      max: summary.max_order_value,
      min: summary.min_order_value,
      tax: summary.tax_collected ?? 0,
      discount: summary.discount,
    },

    staff: rows.map((r) => ({
      name: r.staff_name,
      revenue: r.net_bill_amount,
      orders: r.orders,
      avg: r.avg_value,
    })),

    timeline: charts.map((c) => ({
      label: formatPeriodLabel(c.period, resolution),
      revenue: c.net_bill_amount,
      orders: c.orders,
      avg: c.avg_value,
    })),

    growth: {
      revenueChange: comparison.current_revenue - comparison.previous_revenue,
      revenueChangePct: pct(
        comparison.current_revenue,
        comparison.previous_revenue,
      ),
      orderChange: comparison.current_orders - comparison.previous_orders,
      orderChangePct: pct(
        comparison.current_orders,
        comparison.previous_orders,
      ),
    },
  };
}
