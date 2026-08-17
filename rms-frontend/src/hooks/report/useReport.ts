import { useQuery } from "@tanstack/react-query";
import {
  reportService,
  type ReportParams,
  type ReportType,
} from "@/features/reports/services/report.service";

export function useReport<T extends ReportType>(type: T, params: ReportParams) {
  return useQuery({
    queryKey: ["report", type, params],
    queryFn: () => reportService.getReport(type, params),
    enabled: !!params.from && !!params.to,
    staleTime: 1000 * 60 * 5,
  });
}
