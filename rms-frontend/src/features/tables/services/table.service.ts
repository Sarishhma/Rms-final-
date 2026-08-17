import { handleApiError } from "@/features/shared/errorhandle";
import type {
  CombineTablePayload,
  CombineTableResponse,
  SplitTablePayload,
  SplitTableResponse,
  Table,
  TransferTablePayload,
  TransferTableResponse,
} from "@/features/tables/types";
import api from "@/lib/client";
import toast from "react-hot-toast";

export const fetchTables = async (): Promise<Table[]> => {
  try {
    const res = await api.get("/api/tables");
    return res.data.data;
  } catch (error) {
    toast.error("Failed to load menu");
    throw error;
  }
};
//for table swap
export const transferTable = async (
  payload: TransferTablePayload,
): Promise<TransferTableResponse> => {
  try {
    const res = await api.post("/api/tables/swap", payload);
    return res.data.data;
  } catch (error) {
    handleApiError(error, "transfer table");
    throw error;
  }
};
//table combine
export const combineTable = async (
  payload: CombineTablePayload,
): Promise<CombineTableResponse> => {
  try {
    const res = await api.post("/api/tables/combine", payload);
    return res.data.data;
  } catch (error) {
    handleApiError(error, "combine error");
    throw error;
  }
};

export const splitTable = async (
  payload: SplitTablePayload,
): Promise<SplitTableResponse> => {
  try {
    const res = await api.post("/api/tables/split", payload);
    return res.data.data;
  } catch (error) {
    handleApiError(error, "splitTableError");
    throw error;
  }
};

export const getTables = async (): Promise<Table[]> => {
  const res = await api.get("/api/tables");
  return res.data.data;
};

export const updateTable = async (table: Table): Promise<Table> => {
  const res = await api.patch(`/api/tables/${table.id}`, table);

  return res.data.data;
};

export const tableService = {
  release: async (tableId: string) => {
    const response = await api.post(`/api/tables/${tableId}/release`);
    return response.data;
  },
  create: async (payload: Partial<Table>) => {
    const res = await api.post("/api/tables", payload);
    return res.data;
  },

  deleteTable: async (id: string) => {
    const res = await api.delete(`/api/tables/${id}`);
    return res.data;
  },
};
