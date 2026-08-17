// features/payments/types/index.ts

import type { CustomerFormData } from "@/zod/table.schema";


export type PaymentMethod = "CASH" | "CARD" | "QR" | "MIXED";

export interface PaymentPayload {
  billId: string;
  method: PaymentMethod;
  amount: number;
  reference: string;
  note: string;
}

export interface PaymentModalBill {
  id: string;
  billNumber?: string;
  rcptNumber?: string;
  subtotal: number;
  discount: number;
  tax?: number;
  grandTotal: number;
  due: number;
  paid?: number;
  status?: string;
  order?: {
    orderNumber?: string;
    table?: { name: string };
    items?: PaymentOrderItem[];
  };
}

export interface PaymentOrderItem {
  id: string;
  menuItem?: { name: string };
  quantity: number;
  unitPrice: number;
  total?: number;
}


export interface PaymentModalProps {
  // required
  bill: PaymentModalBill;
  onSubmit: (payload: PaymentPayload) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;

  // optional — cashier flow only
  showCustomerSection?: boolean;
  customerId?: string | null;
  customerForm?: CustomerFormData;
  showCustomerForm?: boolean;
  onCustomerFormToggle?: () => void;
  onCustomerFormChange?: (field: keyof CustomerFormData, value: string) => void;
  onCreateCustomer?: () => void;
}
