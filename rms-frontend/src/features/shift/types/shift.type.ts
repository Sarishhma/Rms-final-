export interface ShiftUser {
  id: string;
  name: string;
}

export type ShiftStatus = "OPEN" | "CLOSED";

export interface Shift {
  id: string;
  shiftNumber: string;
  status: ShiftStatus;
  openingCash: string;
  closingCash: string;
  expectedCash: string;
  variance: string;
  totalSales: string;
  totalRefunds: string;
  openedAt: string;
  closedAt: string | null;
  openedBy: ShiftUser;
  closedBy: ShiftUser | null;
}

export interface ShiftListParams {
  page?: number;
  limit?: number;
  status?: ShiftStatus;
  openedById?:string,
}


export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ShiftListResponse {
  success: boolean;
  data: Shift[];
  meta: PaginationMeta;
}
// shift.type.ts

export interface ShiftUserDetailed extends ShiftUser {
  email: string;
  role: string;
}

export interface CashEvent {
  id: string;
  companyId: string;
  shiftId: string;
  actorId: string;
  type: "PAY_IN" | "PAY_OUT";
  amount: string;
  reason: string;
  reference: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string;
  };
}
export type CurrentShift = ShiftDetail;

export interface CurrentShiftResponse {
  success: boolean;
  data: CurrentShift;
}
export interface ShiftDetailResponse {
  success: boolean;
  data: ShiftDetail;
}
export interface ShiftDetail {
  id: string;
  shiftNumber: string;
  status: ShiftStatus;
  openingCash: string;
  closingCash: string | null;
  expectedCash: string;
  variance: string | null;
  cashSales: string;
  qrSales: string;
  cardSales: string;
  mixedSales: string;
  totalSales: string;
  cashRefunds: string;
  qrRefunds: string;
  cardRefunds: string;
  mixedRefunds: string;
  totalRefunds: string;
  payIns: string;
  payOuts: string;
  paymentsCount: number;
  refundsCount: number;
  billsCount: number;
  openingNote: string | null;
  closingNote: string | null;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  openedBy: ShiftUserDetailed;
  closedBy: ShiftUserDetailed | null;
  cashEvents: CashEvent[];
}
// shift.type.ts additions

export interface ZReportShiftInfo {
  id: string;
  shiftNumber: string;
  openedAt: string;
  closedAt: string | null;
  openedBy: ShiftUserDetailed;
  closedBy: ShiftUserDetailed | null;
}

export interface ZReportCash {
  openingCash: string;
  cashSales: string;
  cashRefunds: string;
  payIns: string;
  payOuts: string;
  expectedCash: string;
  closingCash: string;
  variance: string;
}

export interface ZReportSalesByMethod {
  cash: string;
  qr: string;
  card: string;
  mixed: string;
  total: string;
}

export interface ZReportRefundsByMethod {
  cash: string;
  qr: string;
  card: string;
  mixed: string;
  total: string;
}

export interface ZReportCounts {
  bills: number;
  payments: number;
  refunds: number;
}

export interface ZReportNotes {
  opening: string | null;
  closing: string | null;
}

export interface ZReportData {
  shift: ZReportShiftInfo;
  cash: ZReportCash;
  salesByMethod: ZReportSalesByMethod;
  refundsByMethod: ZReportRefundsByMethod;
  counts: ZReportCounts;
  cashEvents: CashEvent[];
  notes: ZReportNotes;
}

export interface ZReportResponse {
  success: boolean;
  data: ZReportData;
}
export interface OpenShiftPayload {
  openingCash: number;
  openingNote?: string;
}

export interface OpenShiftResponse {
  success: boolean;
  data: CurrentShift;
}
export interface CloseShiftPayload {
  closingCash: number;
  closingNote?: string;
}

export interface CloseShiftResponse {
  success: boolean;
  data: ShiftDetail;
}
export interface CreateCashEventPayload {
  type: "PAY_IN" | "PAY_OUT";
  amount: number;
  reason: string;
  reference?: string;
}

export interface CreateCashEventResponse {
  success: boolean;
  data: CashEvent;
}