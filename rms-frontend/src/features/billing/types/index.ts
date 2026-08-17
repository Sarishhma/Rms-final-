
export type BillStatus = "OPEN" | "PARTIALLY_PAID" | "PAID" | "VOIDED";


export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  rate: number;
  discount: number;
  itemTotal: number;
  children?: OrderItem[]; // e.g. "Sugar Syrup" nested under "Iced Latte"
}

export interface Bill {
  id: string;
  billNumber: string;
  status: "OPEN" | "PARTIALLY_PAID" | "PAID" | "VOIDED";
  items: OrderItem[];
  itemTotal: string;
  discount: string;
  subtotal: string;
  taxableAmount: string;
  tax: string;
  grandTotal: string;
  paid: string;
  due: string;
  refunded: string;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    channel: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
    table?: { id: string; name: string };
  };
  customer?: { id: string; name: string };
}