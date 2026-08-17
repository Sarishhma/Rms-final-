// lib/order.report.mapper.ts
import type { OrderReportData } from "@/features/reports/types/orderReport";
import type { Resolution } from "@/features/reports/types/orderReport";

export interface MappedOrderKPIs {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  voidedOrders: number;
  pendingOrders: number;
  avgOrderValue: number;
  maxOrderValue: number;
  minOrderValue: number;
  avgGuestCount: number;
  avgItemsPerOrder: number;
  cancellationRate: number;
  fulfillmentAvgMin: number;
  fulfillmentMinMin: number;
  fulfillmentMaxMin: number;
}

export interface MappedOrderChannel {
  channel: string;
  orders: number;
  revenue: number;
  avgValue: number;
  cancellationRate: number;
}

export interface MappedOrderChartPoint {
  label: string;
  orders: number;
  revenue: number;
  cancelled: number;
  cancellationRate: number;
}

export interface MappedOrderReport {
  kpis: MappedOrderKPIs;
  channels: MappedOrderChannel[];
  timeline: MappedOrderChartPoint[];
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

function fmtMin(minutes: number | null): number {
  return Math.round((minutes ?? 0) * 10) / 10;
}

export function mapOrderReport(
  data: OrderReportData,
  resolution: Resolution,
): MappedOrderReport {
  const s = data.summary;

  return {
    kpis: {
      totalOrders: s.total_orders,
      completedOrders: s.completed_orders,
      cancelledOrders: s.cancelled_orders,
      voidedOrders: s.voided_orders,
      pendingOrders: s.pending_orders,
      avgOrderValue: Math.round(s.avg_order_value ?? 0),
      maxOrderValue: s.max_order_value ?? 0,
      minOrderValue: s.min_order_value ?? 0,
      avgGuestCount: Math.round(s.avg_guest_count ?? 0),
      avgItemsPerOrder: Math.round((s.avg_items_per_order ?? 0) * 10) / 10,
      cancellationRate: Math.round(s.cancellation_rate * 100),
      fulfillmentAvgMin: fmtMin(s.fulfillment.avg_minutes),
      fulfillmentMinMin: fmtMin(s.fulfillment.min_minutes),
      fulfillmentMaxMin: fmtMin(s.fulfillment.max_minutes),
    },

    channels: (data.rows ?? []).map((r) => ({
      channel: r.channel,
      orders: r.orders,
      revenue: r.revenue ?? 0,
      avgValue: Math.round(r.avg_value ?? 0),
      cancellationRate: Math.round(r.cancellation_rate * 100),
    })),

    timeline: (data.charts ?? []).map((c) => ({
      label: formatPeriodLabel(c.period, resolution),
      orders: c.orders,
      revenue: c.revenue ?? 0,
      cancelled: c.cancelled,
      cancellationRate: Math.round(c.cancellation_rate * 100),
    })),
  };
}
