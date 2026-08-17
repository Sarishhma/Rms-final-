export interface ReportFilters {
  companyId: string;
  from: Date;
  to: Date;
  resolution?: "hour" | "day" | "week" | "month";
  staffId?: string;
  cashierId?: string;
  waiterId?: string;
  categoryId?: string;
  subcategoryId?: string;
  menuItemId?: string;
  channel?: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  shiftId?: string;
  tableId?: string;
  paymentMethod?: "CASH" | "QR" | "CARD" | "MIXED";
  status?: string;
  limit?: number;
}

export interface ReportResponse<T = any, U = any, V = any, W = any> {
  meta: {
    reportKey: string;
    companyId: string;
    from: string;
    to: string;
    timezone: string;
    generatedAt: string;
    filters: Record<string, unknown>;
  };
  summary: T;
  rows: U[];
  charts?: V[];
  comparison?: W;
}
