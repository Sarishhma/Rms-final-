import api from "@/lib/client";

export const inventoryUnitConversionService = {

  create: async (data: {
    fromUnitId: string;
    toUnitId: string;
    factor: number;
  }) => {
    const res = await api.post("/api/inventory/unit-conversions", data);
    return res.data.data;
  },

  remove: async (id: string) => {
    const res = await api.delete(`/api/inventory/unit-conversions/${id}`);
    return res.data.data;
  },

  adjust: async (
    id: string,
    data: {
      fromUnitId?: string;
      toUnitId?: string;
      factor?: number;
    },
  ) => {
    const res = await api.patch(`/api/inventory/unit-conversions/${id}`, data);
    return res.data.data;
  },
};
