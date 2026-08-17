// useGetService.hooks.ts
import { useQuery } from "@tanstack/react-query"
import type { ShiftListParams } from "../types/shift.type";
import { getshiftservice } from "../service/shift.service";

export function useshifts(params?: ShiftListParams) {
  return useQuery({
    queryKey: ["shifts", params],
    queryFn: () => getshiftservice.getShifts(params),
  });
}

export function useCurrentShift() {
  return useQuery({
    queryKey: ["shifts", "current"],
    queryFn: () => getshiftservice.getCurrentShift(),
  });
}

export function useShiftById(id: string | undefined) {
  return useQuery({
    queryKey: ["shifts", id],
    queryFn: () => getshiftservice.getShiftById(id!),
    enabled: !!id,
  });
  
}
export function useZReport(id: string | undefined) {
  return useQuery({
    queryKey: ["shifts", id, "z-report"],
    queryFn: () => getshiftservice.getZReport(id!),
    enabled: !!id,
  });
}