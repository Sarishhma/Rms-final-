import api from "@/lib/client";
import type {
  InventoryStockOut,
  CreateStockOutPayload,
  StockOutListParams,
} from "../../types/inventory.type";

export const inventoryStockOutService = {
  getAll: async (
    params?: StockOutListParams
  ): Promise<{
    success: boolean;
    data: InventoryStockOut[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> => {
    const res = await api.get<{
      success: boolean;
      data: InventoryStockOut[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>("/api/inventory/stock-outs", { params });
    return res.data;
  },

  getById: async (id: string): Promise<InventoryStockOut> => {
    const res = await api.get<{ success: boolean; data: InventoryStockOut }>(
      `/api/inventory/stock-outs/${id}`
    );
    return res.data.data;
  },

  create: async (payload: CreateStockOutPayload): Promise<InventoryStockOut> => {
    const res = await api.post<{ success: boolean; data: InventoryStockOut }>(
      "/api/inventory/stock-outs",
      payload
    );
    return res.data.data;
  },

  postStockOut: async (id: string): Promise<InventoryStockOut> => {
    const res = await api.post<{ success: boolean; data: InventoryStockOut }>(
      `/api/inventory/stock-outs/${id}/post`
    );
    return res.data.data;
  },

  
};
