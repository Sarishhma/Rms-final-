// hooks/usePrinters.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreatePrinterPayload, PrinterListParams } from "../types";
import { printerService } from "../service/printerService";

export const PRINTERS_QUERY_KEY = "printers";

export function usePrinters(params: PrinterListParams) {
  return useQuery({
    queryKey: [PRINTERS_QUERY_KEY, params],
    queryFn: () => printerService.getPrinters(params),
    placeholderData: (prev) => prev, // keep old page data while fetching next
  });
}

export function useCreatePrinter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePrinterPayload) =>
      printerService.createPrinter(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRINTERS_QUERY_KEY] });
    },
  });
}