export type Resolution = "day" | "week" | "month";

export interface ItemReportResponse {
  success: boolean;
  data: ItemReportData;
}

export interface ItemReportData {
  meta: ItemReportMeta;
  summary: ItemSummary;
  rows: ItemRow[];
  charts: ItemChartPoint[];
  comparison: ItemComparison;
}

export interface ItemReportMeta {
  reportKey: string;
  companyId: string;
  from: string;
  to: string;
  timezone: string;
  generatedAt: string;
  filters: {
    from: string;
    to: string;
    resolution: string;
    companyId: string;
    limit: number;
  };
}

export interface ItemSummary {
  total_quantity: number;
  unique_items: number;
  total_sales: number;
  avg_item_price: number;
}

export interface ItemRow {
  item_id: string;
  item_name: string;
  quantity: number;
  sales: number;
  order_count: number;
}

export interface ItemChartPoint {
  period: string;
  quantity: number;
  sales: number;
}

export interface ItemComparison {
  bottomItems:  ItemRow[]          | undefined;
  neverOrdered: NeverOrderedItem[] | undefined;
  byCategory:   CategoryStat[]     | undefined;
}

export interface NeverOrderedItem {
  item_id: string;
  item_name: string;
  category_name: string;
  base_price: number;
}

export interface CategoryStat {
  category_id: string;
  category_name: string;
  quantity: number;
  sales: number;
  item_count: number;
}