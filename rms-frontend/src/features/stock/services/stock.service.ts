import api from "@/lib/client";
import type { StockItem } from "@/features/stock/types/stock.type";

export const stockService = {
  create: async (data: any) => {
    const res = await api.post("/api/stock/open", data);
    return res.data.data;
  },

  getAll: async (): Promise<StockItem[]> => {
    const res = await api.get<{ success: boolean; data: StockItem[] }>(
      "/api/stock",
    );
    return res.data.data;
  },

  getById: async (id: string) => {
    const res = await api.get(`/api/stock/${id}`);
    return res.data.data;
  },

  adjust: async (
    id: string,
    data: { remainingQty: number; reason: string },
  ): Promise<StockItem> => {
    const res = await api.patch<{ success: boolean; data: StockItem }>(
      `/api/stock/${id}/adjust`,
      data,
    );
    return res.data.data;
  },
};
