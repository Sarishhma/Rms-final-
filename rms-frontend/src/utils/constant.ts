import type { CustomerFormData } from "@/zod/table.schema";
import type { PaymentMethod } from "@/features/payments/types";

/**
 * Payment Methods Configuration
 */
export const PAYMENT_METHODS: Array<{
  key: PaymentMethod;
  label: string;
  color: string;
}> = [
  { key: "CASH", label: "Cash", color: "bg-green-600" },
  { key: "CARD", label: "Card", color: "bg-blue-600" },
  { key: "QR", label: "QR Pay", color: "bg-purple-600" },
  { key: "MIXED", label: "Mixed", color: "bg-orange-500" },
];

/**
 * Initial Customer Form State
 */
export const INITIAL_CUSTOMER_FORM: CustomerFormData = {
  name: "",
  phone: "",
  email:"",
  notes:""
};

/**
 * UI Constants
 */
export const UI = {
  MODAL_MAX_WIDTH: "max-w-2xl",
  ITEMS_MAX_HEIGHT: "max-h-40",
  TOAST_DURATION: 3000,
} as const;

/**
 * Validation Constants
 */
export const VALIDATION = {
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 100,
  MIN_PHONE_LENGTH: 10,
  MAX_PHONE_LENGTH: 20,
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  BILL_GENERATION_FAILED: "Bill generation failed",
  BILL_NOT_FOUND: "Bill not found",
  CUSTOMER_CREATION_FAILED: "Customer creation failed",
  CUSTOMER_NAME_REQUIRED: "Please enter at least a customer name",
  PAYMENT_FAILED: "Payment failed",
  INVALID_FORM: "Please fill in all required fields",
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  BILL_GENERATED: "Bill generated successfully",
  CUSTOMER_CREATED: "Customer created successfully",
  PAYMENT_SUCCESSFUL: "Payment successful",
} as const;