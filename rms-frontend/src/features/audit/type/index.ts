export type AuditAction =
  | "TABLE_RELEASED"
  | "PAYMENT_CREATED"
  | "STOCK_ADJUSTED"
  | "TABLE_CREATED"
  | "TABLE_UPDATED"
  | "ORDER_CREATED"
  | "ORDER_CANCELLED";

export type AuditEntity =
  | "DiningTable"
  | "Payment"
  | "DailyStock"
  | "Order";

export interface AuditLog {
  id: string;
  companyId: string;
  actorId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;

  before: any;
  after: any;
  reason: string | null;

  createdAt: string;

  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface AuditMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuditResponse {
  success: boolean;
  data: AuditLog[];
  meta: AuditMeta;
}