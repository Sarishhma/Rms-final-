// hooks/report/useReports.ts
import { useQuery } from "@tanstack/react-query";
import {
  reportService,
  type ReportParams,
} from "@/features/reports/services/report.service";

export const useSalesReport = (params: ReportParams) =>
  useQuery({
    queryKey: ["report", "sales", params],
    queryFn: () => reportService.getSales(params),
    enabled: !!params.from && !!params.to,
    staleTime: 1000 * 60 * 5,
  });

export const useItemReport = (params: ReportParams) =>
  useQuery({
    queryKey: ["report", "item-performance", params],
    queryFn: () => reportService.getItems(params),
    enabled: !!params.from && !!params.to,
    staleTime: 1000 * 60 * 5,
  });

export const useOrderReport = (params: ReportParams) =>
  useQuery({
    queryKey: ["report", "orders", params],
    queryFn: () => reportService.getOrders(params),
    enabled: !!params.from && !!params.to,
    staleTime: 1000 * 60 * 5,
  });

export const useStaffReport = (params: ReportParams) =>
  useQuery({
    queryKey: ["report", "staff-performance", params],
    queryFn: () => reportService.getStaff(params),
    enabled: !!params.from && !!params.to,
    staleTime: 1000 * 60 * 5,
  });

export const usePaymentReport = (params: ReportParams) =>
  useQuery({
    queryKey: ["report", "payments", params],
    queryFn: () => reportService.getPayments(params),
    enabled: !!params.from && !!params.to,
    staleTime: 1000 * 60 * 5,
  });
