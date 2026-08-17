import { useQuery } from "@tanstack/react-query";
import { fetchAuditLogs } from "@/features/audit/services/audit.service";
import type { AuditResponse } from "@/features/audit/type";

export const useAuditLogs = (params?: {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  search?: string;
}) => {
  return useQuery<AuditResponse>({
    queryKey: ["audit-logs", params],
    queryFn: () => fetchAuditLogs(params),
  });
};