// lib/staff.report.mapper.ts
import type { StaffReportData, StaffRow } from "@/features/reports/types/staffReport";
import type { Resolution } from "@/features/reports/types/resolution";

export interface MappedStaffKPIs {
  totalStaff: number;
  totalOrders: number;
  totalRevenue: number;
  avgOrdersPerStaff: number;
  avgRevenuePerStaff: number;
  highestStaffRevenue: number;
  lowestStaffRevenue: number;
  totalCancelled: number;
  totalVoided: number;
  cancellationRate: number;
  totalItemsSold: number;
  totalGuestsServed: number;
}

export interface MappedStaffRow {
  id: string;
  name: string;
  role: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  voidedOrders: number;
  cancellationRate: number;
  totalRevenue: number;
  avgOrderValue: number;
  maxOrderValue: number;
  minOrderValue: number;
  totalItemsSold: number;
  totalGuestsServed: number;
  avgItemsPerOrder: number;
  avgFulfillmentMinutes: number;
  dineInOrders: number;
  takeawayOrders: number;
  deliveryOrders: number;
}

export interface MappedStaffChartPoint {
  period: string;
  label: string;
  staffId: string;
  staffName: string;
  orders: number;
  revenue: number;
}

// Chart data grouped by period for multi-line rendering
export interface MappedTimelinePoint {
  label: string;
  [staffName: string]: number | string; // dynamic keys per staff member
}

export interface MappedStaffReport {
  kpis: MappedStaffKPIs;
  rows: MappedStaffRow[];
  chartRaw: MappedStaffChartPoint[];
  timeline: MappedTimelinePoint[];
  staffNames: string[];
}

function formatPeriodLabel(iso: string, resolution: Resolution): string {
  const date = new Date(iso);
  switch (resolution) {
    case "day":   return date.toLocaleDateString([], { month: "short", day: "numeric" });
    case "week":  return `W/o ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`;
    case "month": return date.toLocaleDateString([], { month: "short", year: "numeric" });
  }
}

function mapStaffRow(r: StaffRow): MappedStaffRow {
  return {
    id:                   r.staff_id,
    name:                 r.staff_name,
    role:                 r.staff_role,
    totalOrders:          r.total_orders,
    completedOrders:      r.completed_orders,
    cancelledOrders:      r.cancelled_orders,
    voidedOrders:         r.voided_orders,
    cancellationRate:     Math.round(r.cancellation_rate * 100),
    totalRevenue:         r.total_revenue          ?? 0,
    avgOrderValue:        Math.round(r.avg_order_value     ?? 0),
    maxOrderValue:        r.max_order_value         ?? 0,
    minOrderValue:        r.min_order_value         ?? 0,
    totalItemsSold:       r.total_items_sold,
    totalGuestsServed:    r.total_guests_served,
    avgItemsPerOrder:     Math.round((r.avg_items_per_order    ?? 0) * 10) / 10,
    avgFulfillmentMinutes:Math.round((r.avg_fulfillment_minutes ?? 0) * 10) / 10,
    dineInOrders:         r.dine_in_orders,
    takeawayOrders:       r.takeaway_orders,
    deliveryOrders:       r.delivery_orders,
  };
}

export function mapStaffReport(
  data: StaffReportData,
  resolution: Resolution
): MappedStaffReport {
  if (!data?.summary) throw new Error("Invalid staff report shape — summary missing");

  const s = data.summary;

  const chartRaw: MappedStaffChartPoint[] = (data.charts ?? []).map((c) => ({
    period:    c.period,
    label:     formatPeriodLabel(c.period, resolution),
    staffId:   c.staff_id,
    staffName: c.staff_name,
    orders:    c.orders,
    revenue:   c.revenue ?? 0,
  }));

  // Group chart points by period for recharts multi-line
  const staffNames = [...new Set(chartRaw.map((c) => c.staffName))];

  const byPeriod = new Map<string, MappedTimelinePoint>();
  for (const point of chartRaw) {
    if (!byPeriod.has(point.label)) {
      byPeriod.set(point.label, { label: point.label });
    }
    const entry = byPeriod.get(point.label)!;
    entry[`${point.staffName}_orders`]  = point.orders;
    entry[`${point.staffName}_revenue`] = point.revenue;
  }

  return {
    kpis: {
      totalStaff:          s.total_staff,
      totalOrders:         s.total_orders,
      totalRevenue:        s.total_revenue,
      avgOrdersPerStaff:   Math.round(s.avg_orders_per_staff * 10) / 10,
      avgRevenuePerStaff:  Math.round(s.avg_revenue_per_staff),
      highestStaffRevenue: s.highest_staff_revenue,
      lowestStaffRevenue:  s.lowest_staff_revenue,
      totalCancelled:      s.total_cancelled,
      totalVoided:         s.total_voided,
      cancellationRate:    Math.round(s.overall_cancellation_rate * 100),
      totalItemsSold:      s.total_items_sold,
      totalGuestsServed:   s.total_guests_served,
    },
    rows:      (data.rows ?? []).map(mapStaffRow),
    chartRaw,
    timeline:  [...byPeriod.values()],
    staffNames,
  };
}