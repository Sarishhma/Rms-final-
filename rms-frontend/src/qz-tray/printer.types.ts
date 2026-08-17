export interface PrinterConnection {
  host: string;
  port: number;
}

export interface KotItem {
  productId: string;
  productName: string;
  quantity: number;
  specialInstructions?: string;
}
export interface KitchenRoute {
  kitchenStationId: string;
  kitchenStationName: string;

  printerIp: string | null;
  printerPort: number | null;

  orderId: string;
  orderNumber: string;

  table: string | null;
  customer: string | null;
  staff: string;

  createdAt: string;

  notes: string | null;

  items: {
    productId: string;
    productName: string;
    quantity: number;
  }[];
}

export interface ReceiptPrintRequest {
  printerName: string;
  html: string;
}

export interface KitchenPrintRequest {
  host: string;
  port: number;
  payload: string[];
}

export enum PrintType {
  KOT = "KOT",
  BILL = "BILL",
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ReceiptData {
  businessName: string;
  businessAddress: string;
  taxRegistrationNumber?: string;
  currency?: string;

  billNumber?: string;
  receiptNumber?: string;

  date: string;
  orderNumber: string;
  channel?: string;
  table?: string;

  items: ReceiptItem[];

  subtotal: number;
  discount: number;
  vat?: number;
  billTotal: number;
  paid?: number;
  due?: number;

  invoiceFooter?: string | null;
}
