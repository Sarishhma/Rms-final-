import api from "@/lib/client";
import type {
  CreatePrinterPayload,
  PaginatedResponse,
  Printer,
  PrinterListParams,
} from "../types";

const BASE_URL = "/api/printers";

export const printerService = {
  getPrinters: async (
    params: PrinterListParams,
  ): Promise<PaginatedResponse<Printer>> => {
    const { data } = await api.get<PaginatedResponse<Printer>>(BASE_URL, {
      params,
    });
    return data;
  },

  createPrinter: async (payload: CreatePrinterPayload): Promise<Printer> => {
    const { data } = await api.post<Printer>(BASE_URL, payload);
    return data;
  },
};
