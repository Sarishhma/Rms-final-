import type { MenuAddon, MenuItemType, Variant } from "@/features/menu/types";
import type { PaymentMethod } from "@/features/payments/types";
import type { Table } from "@/features/tables/types";

export interface OrderFilters {
  status?: Order["status"];
  tableId?: string;
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export enum OrderStatus {
  DRAFT = "DRAFT",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  VOIDED = "VOIDED",
  COMPLETED = "COMPLETED",
}

export enum StockStatus {
  IN_STOCK = "IN STOCK",
  LOW_STOCK = "LOW STOCK",
  OUT_OF_STOCK = "OUT OF STOCK",
}

export enum OrderItemStatus {
  PENDING = "PENDING",
  CANCELLED = "CANCELLED",
  VOIDED = "VOIDED",
}
export const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.DRAFT,
  OrderStatus.CONFIRMED,
];

export enum BillStatus {
  OPEN = "OPEN",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  PAID = "PAID",
  VOIDED = "VOIDED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
  VOIDED = "VOIDED",
}

// ─── Order ────────────────────────────────────────────────────────────────────

export interface OrderItemAddon {
  id: string;
  orderItemId: string;
  addonId: string;
  addon: MenuAddon;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItem: {
    id: string;
    name: string;
    description: string | null;
    type: MenuItemType;
    basePrice: number;
    sku: string | null;
  };
  variant: Variant | null;
  quantity: number;
  unitPrice: number;
  addonTotal: number;
  lineSubtotal: number;
  specialInstructions: string | null;
  status: OrderItemStatus;
  addons: OrderItemAddon[];
  createdAt: string;
  updatedAt: string;
  total: number;
}

export interface Order {
  id: string;
  paymentStatus: PaymentStatus; // ADD THIS
  companyId: string;
  orderNumber: string;
  tableId: string | null;
  table: Table | null;
  createdById: string;
  status: OrderStatus;
  guestCount: number | null;
  specialInstructions: string | null;
  subtotal: number;
  discount: number;
  serviceCharge: number;
  vat: number;
  grandTotal: number;
  channel: OrderChannel;
  kitchenPrinterJobs: KitchenPrinterJob[];
  customer?: { id: string; name: string; phone: string; email?: string } | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  voidedAt: string | null;
  completedAt: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderState {
  orders: Order[];
}

export interface BillSplit {
  id: string;
  billId: string;
  label: string;
  amount: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  companyId: string;
  billId: string;
  receivedById: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  reference: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  menuItem: {
    id: string;
    variantId: string | null;
    name: string;
    price: number;
    category: string;
    description: string;
  };
  selectedAddOns: MenuAddon[];
  quantity: number;
  notes: string;
}

export interface CartState {
  items: CartItem[];
  table: Table | null;
  pendingItem: CartItem["menuItem"] | null;
}

export interface CreateOrderPayload {
  tableId?: string;
  guestCount?: number;
  specialInstructions?: string;
  customerId?: string;
  channel: OrderChannel;
  items: {
    menuItemId: string;
    variantId?: string;
    quantity: number;
    specialInstructions?: string;
    addonIds?: string[];
  }[];
}

export interface CreateBillPayload {
  orderId: string;
  discount?: number;
  discountReason?: string;
  splits?: { label: string; amount: number }[];
}

export interface CreatePaymentPayload {
  billId: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  note?: string;
}
export interface CreateMenuItemPayload {
  name: string;
  description?: string;
  categoryId: string;
  subcategoryId?: string;
  basePrice: number;
  sku?: string;
  trackStock: boolean;
  stockQuantity?: number;
  variants: { name: string; price: number }[];
  addons: { name: string; price: number }[];
  type: MenuItemType;
}
export interface TransferTablePayload {
  fromTableId: string;
  toTableId: string;
  reason: string;
}

export interface Bill {
  id: string;
  companyId: string;
  billNumber: string;
  orderId: string;
  order: Pick<
    Order,
    "id" | "orderNumber" | "tableId" | "table" | "items" | "createdAt"
  >;
  subtotal: number;
  discount: number;
  serviceCharge: number;
  vat: number;
  grandTotal: number;
  paid: number;
  due: number;
  status: BillStatus;
  splits: BillSplit[];
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}
export interface CreateBillPayload {
  orderId: string;
  discount?: number;
  discountReason?: string;
  splits?: { label: string; amount: number }[];
}
// ─── Kitchen Order Ticket (KOT) Types ─────────────────────────────────────────

export interface CreateCustomerPayload {
  name: string;
  phone: string;
  email?: string;
}
export interface UsePlaceOrderArgs {
  table?: Table | null;
  cart: CartItem[];
  total: number;
  guestCount?: number;
  channel: OrderChannel;
  customerId?: string;
  onSuccess?: (order: Order) => void;
}
export enum OrderChannel {
  DINE_IN = "DINE_IN",
  TAKE_AWAY = "TAKEAWAY",
  DELIVERY = "DELIVERY",
}

export interface KitchenPrinterJobItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface KitchenPrinterJob {
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

  items: KitchenPrinterJobItem[];
}
