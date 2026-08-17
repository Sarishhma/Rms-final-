import api from "@/lib/client";
import type { InventorySupplier } from "../../types/inventory.type";

export const inventorySupplierService = {
  create: async (data: any) => {
    const res = await api.post("/api/inventory/suppliers", data);
    return res.data.data;
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ success: boolean; data: InventorySupplier[]; meta: { page: number; limit: number; total: number; totalPages: number } }> => {
    const res = await api.get<{ success: boolean; data: InventorySupplier[]; meta: { page: number; limit: number; total: number; totalPages: number } }>(
      "/api/inventory/suppliers",
      { params }
    );
    return res.data;
  },

  getById: async (id: string): Promise<InventorySupplier> => {
    const res = await api.get<{ success: boolean; data: InventorySupplier }>(
      `/api/inventory/suppliers/${id}`,
    );
    return res.data.data;
  },

  adjust: async (id: string, data: any) => {
    const res = await api.patch(`/api/inventory/suppliers/${id}`, data);
    return res.data.data;
  },

  remove: async (id: string) => {
    const res = await api.delete(`/api/inventory/suppliers/${id}`);
    return res.data.data;
  },
};
