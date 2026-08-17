import api from "@/lib/client";

export type ExportReportType =
  | "sales"
  | "items"
  | "orders"
  | "staff"
  | "payments";

export interface ExportParams {
  from: string;
  to: string;
  resolution?: string;
}

export async function exportReportExcel(
  type: ExportReportType,
  params: ExportParams,
  filename: string,
): Promise<void> {
  const res = await api.get(`/api/reports/${type}/export/excel`, {
    params,
    responseType: "blob",
  });

  const blob = new Blob([res.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}
