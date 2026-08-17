import { handleApiError } from "@/features/shared/errorhandle";
import api from "@/lib/client";
import type { CreateBillPayload } from "@/features/orders/types";
import type { Bill } from "../types";

export const createBill = async (payload: CreateBillPayload): Promise<Bill> => {
  try {
    const res = await api.post("/api/billing", payload);
    return res.data.data;
  } catch (error) {
    handleApiError(error, "Billing erro");
    throw error;
  }
};
export const fetchBills = async (): Promise<Bill[]> => {
  try {
    const res = await api.get("/api/billing");
    return res.data.data;
  } catch (error) {
    handleApiError(error, "fetch billing error");
    throw error;
  }
};
export const fetchBillById = async (id: string): Promise<Bill[]> => {
  try {
    const res = await api.get(`/api/billing/${id}`);
    return res.data.data;
  } catch (error) {
    handleApiError(error, "get bill by id error");
    throw error;
  }
};



export type BillResponse = {
  data: Bill[];
  meta: {
    page: number;
    totalPages: number;
    total: number;
  };
};

export const billingService = {
  generate: async (payload: {
    orderId: string;
    discount?: number;
    discountReason?: string;
    splits?: any[];
  }) => {
    const res = await api.post(`/api/billing/`, payload);
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get(`/api/billing/${id}`);
    return res.data;
  },
};

export const getBills = async (
  page = 1,
  limit = 20,
  status?: string,
): Promise<BillResponse> => {
  const res = await api.get("/api/billing", {
    params: { page, limit, status },
  });

  return res.data;
};

export const getBillById = async (id: string) => {
  const res = await api.get(`/api/billing/${id}`);
  return res.data;
};
