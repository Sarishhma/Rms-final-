import api from "@/lib/client";
import type { AuditResponse } from "@/features/audit/type";

export const fetchAuditLogs = async (params?: {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  search?: string;
}) => {
  const cleanParams: any = {
    page: params?.page,
    limit: params?.limit,
  };

  if (params?.action) cleanParams.action = params.action;
  if (params?.entity) cleanParams.entity = params.entity;
  if (params?.search) cleanParams.search = params.search;

  const res = await api.get<AuditResponse>("/api/audit-logs", {
    params: cleanParams,
  });

  return res.data;
};
