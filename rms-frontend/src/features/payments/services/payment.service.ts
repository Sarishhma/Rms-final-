import api from "@/lib/client";

export const paymentService = {
  create: async (payload: {
    billId: string;
    method: "CASH" | "CARD" | "QR" | "MIXED";
    amount: number;
    reference?: string;
    note?: string;
  }) => {
    const res = await api.post(`/api/payments/`, payload);
    return res.data;
  },
};
