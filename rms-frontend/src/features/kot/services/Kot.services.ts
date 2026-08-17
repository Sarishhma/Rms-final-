import { handleApiError } from "@/features/shared/errorhandle";
import api from "@/lib/client";
import type { Kot, KotListResponse, UpdateKotPayload } from "@/features/kot/types/index";

/**
 * Fetch a paginated list of Kitchen Order Tickets (KOT)
 */
export const fetchKots = async (params?: {
  page?: number;
  limit?: number;
}): Promise<KotListResponse> => {
  try {
    const res = await api.get("/api/kot", { params });
    return res.data;
  } catch (error) {
    handleApiError(error, "fetch KOT error");
    throw error;
  }
};

/**
 * Fetch details of a single KOT by ID (includes items)
 */
export const fetchKotById = async (id: string): Promise<Kot> => {
  try {
    const res = await api.get(`/api/kot/${id}`);
    return res.data.data;
  } catch (error) {
    handleApiError(error, "get KOT by id error");
    throw error;
  }
};


/**
 * Update KOT status or KOT item statuses (PATCH)
 */
export const updateKot = async (
  id: string,
  payload: UpdateKotPayload,
): Promise<Kot> => {
  try {
    const res = await api.patch(`/api/kot/${id}`, payload);
    return res.data.data;
  } catch (error) {
    handleApiError(error, "update KOT error");
    throw error;
  }
};


