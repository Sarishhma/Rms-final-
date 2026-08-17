import { useState } from "react";
import { useBills } from "@/features/billing/hooks/billing.hook";
import { DataTable } from "@/features/billing/components/data-table";
import { BillDetailsModal } from "@/features/billing/components/BillDetailsModal";
import { type SortingState } from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Bill } from "../types";
import { columns } from "../components/bill-columns";

function BillListPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [sorting, setSorting] = useState<SortingState>([]);

  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data } = useBills(page, 20, status);

  const bills = data?.data || [];
  const meta = data?.meta;

  const handleView = (bill: Bill) => {
    setSelectedBill(bill);
    setModalOpen(true);
  };

  return (
    <div className="p-6 space-y-4">
      {/* HEADER */}
      <div className="flex justify-between">
        <h1 className="text-xl font-semibold">Bills</h1>

        {/* STATUS FILTER */}
        <Select
          onValueChange={(val) => {
            setStatus(val === "ALL" ? undefined : val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>

          <SelectContent
            position="popper"
            className="z-50 bg-white text-zinc-900"
          >
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="VOIDED">Voided</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TABLE */}
      <DataTable
        columns={columns(handleView)}
        data={bills}
        sorting={sorting}
        setSorting={setSorting}
      />

      {/* PAGINATION */}
      <div className="flex justify-between items-center">
        <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </Button>

        <div className="text-sm">
          Page {meta?.page} of {meta?.totalPages}
        </div>

        <Button
          disabled={page === meta?.totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>

      {/* BILL DETAILS MODAL */}
      <BillDetailsModal
        bill={selectedBill}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}

export default BillListPage;