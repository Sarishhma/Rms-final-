import api from "@/lib/client";
import type { InventoryUnit } from "../../types/inventory.type";

export const inventoryUnitService = {
  create: async (data: any) => {

    const res = await api.post("/api/inventory/units", data);
    return res.data.data;
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
  }): Promise<{ success: boolean; data: InventoryUnit[]; meta: { page: number; limit: number; total: number; totalPages: number } }> => {
    const res = await api.get<{ success: boolean; data: InventoryUnit[]; meta: { page: number; limit: number; total: number; totalPages: number } }>(
      "/api/inventory/units",
      { params }
    );
    
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get(`/api/inventory/units/${id}`);
    return res.data.data;
  },

  adjust: async (id: string, data: any) => {
    const res = await api.patch(`/api/inventory/units/${id}`, data);
    return res.data.data;
  },

  remove: async (id: string) => {
    const res = await api.delete(`/api/inventory/units/${id}`);
    return res.data.data;
  },

  
};
