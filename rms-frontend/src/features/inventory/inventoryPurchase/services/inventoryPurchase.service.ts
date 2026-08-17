import api from "@/lib/client";
import type {
  InventoryPurchase,
  CreateInventoryPurchasePayload,
  InventoryPurchaseListParams,
  UpdateInventoryPurchasePayload,
} from "../../types/inventory.type";

export const inventoryPurchaseService = {
  getAll: async (params?: InventoryPurchaseListParams): Promise<{
    success: boolean;
    data: InventoryPurchase[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> => {
    const res = await api.get<{
      success: boolean;
      data: InventoryPurchase[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>("/api/inventory/purchases", { params });
    return res.data;
  },

  getById: async (id: string): Promise<InventoryPurchase> => {
    const res = await api.get<{ success: boolean; data: InventoryPurchase }>(
      `/api/inventory/purchases/${id}`
    );
    return res.data.data;
  },

  create: async (payload: CreateInventoryPurchasePayload): Promise<InventoryPurchase> => {
    const res = await api.post<{ success: boolean; data: InventoryPurchase }>(
      "/api/inventory/purchases",
      payload
    );
  
    return res.data.data;
  },

  postPurchase: async (id: string): Promise<InventoryPurchase> => {
    const res = await api.post<{ success: boolean; data: InventoryPurchase }>(
      `/api/inventory/purchases/${id}/post`
    );
    return res.data.data;
  },

  updatePurchase: async (id: string, data: Partial<UpdateInventoryPurchasePayload>) => {
  const res = await api.patch(`/api/inventory/purchases/${id}`, data);
  return res.data.data;
},
};
