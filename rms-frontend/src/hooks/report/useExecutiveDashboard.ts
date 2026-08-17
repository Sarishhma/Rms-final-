// hooks/report/useExecutiveDashboard.ts
import { useQuery } from "@tanstack/react-query";
import {
  reportService,
  type ReportParams,
} from "@/features/reports/services/report.service";

export const useExecutiveDashboard = (params: ReportParams) =>
  useQuery({
    queryKey: ["report", "dashboard", params],
    queryFn: () => reportService.getDashboard(params),

    enabled: !!params.from && !!params.to,

    staleTime: 1000 * 60 * 5, // 5 min (data considered fresh)

    refetchInterval: 1000 * 60 * 5, // 🔁 refetch every 5 minutes
    refetchIntervalInBackground: true, // optional: also refetch when tab is not focused
  });
