import api from "@/lib/client";
import type { CreateInventoryItemPayload } from "../../types/inventory.type";

export const getInventoryItems = async (params?: Record<string, unknown>) => {
  const res = await api.get("/api/inventory/items", { params });
  return res.data;
};

export const createInventoryItem = async (payload: CreateInventoryItemPayload) => {
  const res = await api.post("/api/inventory/items", payload);
  return res.data;
};

export const adjustInventoryItem = async (id: string, data: Partial<CreateInventoryItemPayload>) => {
  const res = await api.patch(`/api/inventory/items/${id}`, data);
  return res.data.data;
};

export const removeInventoryItem = async (id: string) => {
  const res = await api.delete(`/api/inventory/items/${id}`);
  return res.data.data;
};