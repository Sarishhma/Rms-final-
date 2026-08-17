import type { PaymentMethod } from "@prisma/client";

export type PaymentInput = {
  billId: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  note?: string;
};
