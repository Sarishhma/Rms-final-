// pages/PrintersPage.tsx
import { useState } from "react";
import type { PrinterListParams } from "../types";
import { usePrinters } from "../hook/usePrinters";
import { PrinterList } from "../component/PrinterList";
import { AddPrinterDialog } from "../component/AddPrinterDialog";

export default function PrintersPage() {
  const [params, setParams] = useState<PrinterListParams>({
    page: 1,
    limit: 20,
  });
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data, isLoading } = usePrinters({
    ...params,
    search: search || undefined,
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Printers</h1>
        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 rounded-md bg-blue-600 text-white"
        >
          + Add Printer
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setParams((p) => ({ ...p, page: 1 }));
          }}
          placeholder="Search by name..."
          className="border rounded-md px-3 py-2 w-64"
        />

        <select
          className="border rounded-md px-3 py-2"
          onChange={(e) =>
            setParams((p) => ({
              ...p,
              page: 1,
              isKitchen:
                e.target.value === "all"
                  ? undefined
                  : e.target.value === "true",
            }))
          }
        >
          <option value="all">All Types</option>
          <option value="true">Kitchen Only</option>
          <option value="false">Non-Kitchen Only</option>
        </select>

        <select
          className="border rounded-md px-3 py-2"
          onChange={(e) =>
            setParams((p) => ({
              ...p,
              page: 1,
              isEnabled:
                e.target.value === "all"
                  ? undefined
                  : e.target.value === "true",
            }))
          }
        >
          <option value="all">All Status</option>
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <PrinterList printers={data?.data ?? []} isLoading={isLoading} />
      </div>

      {data && data.total > (params.limit ?? 20) && (
        <div className="flex justify-end gap-2 mt-4">
          <button
            disabled={(params.page ?? 1) <= 1}
            onClick={() =>
              setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))
            }
            className="px-3 py-1 border rounded-md disabled:opacity-40"
          >
            Prev
          </button>
          <button
            disabled={(params.page ?? 1) * (params.limit ?? 20) >= data.total}
            onClick={() =>
              setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))
            }
            className="px-3 py-1 border rounded-md disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <AddPrinterDialog open={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  );
}
