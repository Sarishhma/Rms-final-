import api from "@/lib/client";
import { handleApiError } from "@/features/shared/errorhandle";
import type {
  ShiftListParams,
  ShiftListResponse,
  ShiftDetailResponse,
  ZReportResponse,
  OpenShiftPayload,
  OpenShiftResponse,
  CloseShiftPayload,
  CloseShiftResponse,
  CreateCashEventPayload,
  CreateCashEventResponse,
} from "../types/shift.type";

export const getshiftservice = {
  getShifts: async (
    params?: ShiftListParams
  ): Promise<ShiftListResponse> => {
    try {
      const res = await api.get<ShiftListResponse>("/api/shifts", { params });
      return res.data;
    } catch (error) {
      handleApiError(error, "Get shifts API error");
      throw error;
    }
  },

  getCurrentShift: async (): Promise<ShiftDetailResponse> => {
    try {
      const res = await api.get<ShiftDetailResponse>("/api/shifts/current");
      return res.data;
    } catch (error) {
      handleApiError(error, "Get current shift API error");
      throw error;
    }
  },

  getShiftById: async (id: string): Promise<ShiftDetailResponse> => {
    try {
      const res = await api.get<ShiftDetailResponse>(`/api/shifts/${id}`);
      return res.data;
    } catch (error) {
      handleApiError(error, "Get shift by ID API error");
      throw error;
    }
  },

  getZReport: async (id: string): Promise<ZReportResponse> => {
    try {
      const res = await api.get<ZReportResponse>(
        `/api/shifts/${id}/z-report`
      );
      return res.data;
    } catch (error) {
      handleApiError(error, "Get Z report API error");
      throw error;
    }
  },
};

export const postshiftservices = {
  openShift: async (
    payload: OpenShiftPayload
  ): Promise<OpenShiftResponse> => {
    try {
      const res = await api.post<OpenShiftResponse>(
        "/api/shifts/open",
        payload
      );
      return res.data;
    } catch (error) {
      handleApiError(error, "Open shift API error");
      throw error;
    }
  },

  closeShifts: async (
    id: string,
    payload: CloseShiftPayload,
    idempotencyKey: string
  ): Promise<CloseShiftResponse> => {
    try {
      const res = await api.post<CloseShiftResponse>(
        `/api/shifts/${id}/close`,
        payload,
        {
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
        }
      );
      return res.data;
    } catch (error) {
      handleApiError(error, "Close shift API error");
      throw error;
    }
  },

  createCashEvent: async (
    id: string,
    payload: CreateCashEventPayload,
    idempotencyKey: string
  ): Promise<CreateCashEventResponse> => {
    try {
      const res = await api.post<CreateCashEventResponse>(
        `/api/shifts/${id}/cash-events`,
        payload,
        {
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
        }
      );
      return res.data;
    } catch (error) {
      handleApiError(error, "Create cash event API error");
      throw error;
    }
  },
};