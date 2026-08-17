import type {
  ItemReportData,
  ItemRow,
  Resolution,
} from "@/features/reports/types/itemsReport";

export interface MappedItemKPIs {
  totalQuantity: number;
  uniqueItems: number;
  totalSales: number;
  avgItemPrice: number;
}

export interface MappedItemRow {
  id: string;
  name: string;
  quantity: number;
  sales: number;
  orderCount: number;
}

export interface MappedChartPoint {
  label: string;
  quantity: number;
  sales: number;
}

export interface MappedCategoryStat {
  name: string;
  quantity: number;
  sales: number;
  itemCount: number;
}

export interface MappedNeverOrdered {
  id: string;
  name: string;
  categoryName: string;
  basePrice: number;
}

export interface MappedItemReport {
  kpis: MappedItemKPIs;
  topItems: MappedItemRow[];
  bottomItems: MappedItemRow[];
  neverOrdered: MappedNeverOrdered[];
  byCategory: MappedCategoryStat[];
  timeline: MappedChartPoint[];
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

function mapItemRow(r: ItemRow): MappedItemRow {
  return {
    id: r.item_id,
    name: r.item_name,
    quantity: r.quantity,
    sales: r.sales,
    orderCount: r.order_count,
  };
}

export function mapItemReport(
  data: ItemReportData,
  resolution: Resolution,
): MappedItemReport {
  return {
    kpis: {
      totalQuantity: data.summary.total_quantity,
      uniqueItems: data.summary.unique_items,
      totalSales: data.summary.total_sales,
      avgItemPrice: data.summary.avg_item_price,
    },

    topItems: (data.rows ?? []).map(mapItemRow),
    bottomItems: (data.comparison?.bottomItems ?? []).map(mapItemRow),
    neverOrdered: (data.comparison?.neverOrdered ?? []).map((i) => ({
      id: i.item_id,
      name: i.item_name,
      categoryName: i.category_name,
      basePrice: i.base_price,
    })),

    byCategory: (data.comparison?.byCategory ?? []).map((c) => ({
      name: c.category_name,
      quantity: c.quantity,
      sales: c.sales,
      itemCount: c.item_count,
    })),

    timeline: (data.charts ?? []).map((c) => ({
      label: formatPeriodLabel(c.period, resolution),
      quantity: c.quantity,
      sales: c.sales,
    })),
  };
}
