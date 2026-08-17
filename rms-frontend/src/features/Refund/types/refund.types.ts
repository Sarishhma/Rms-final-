import type { PaymentMethod } from "@/features/payments/types";

export type RefundStatus = "PENDING" | "COMPLETED" | "FAILED";
export interface RefundBill {
  id: string;
  billNumber: string;
}

export interface RefundPayment {
  id: string;
  billId: string;
  method: PaymentMethod;
  amount: string;
  bill: RefundBill;
}

export interface RefundProcessedBy {
  id: string;
  name: string;
}

export interface Refund {
  id: string;
  paymentId: string;
  method: PaymentMethod;
  amount: string;
  reason: string;
  status: RefundStatus;
  reference: string | null;
  createdAt: string;
  payment: RefundPayment;
  processedBy: RefundProcessedBy;
}

export interface RefundListResponse {
  success: boolean;
  data: Refund[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RefundQueryParams {
  page?: number;
  status?: RefundStatus;
  paymentId?: string;
}