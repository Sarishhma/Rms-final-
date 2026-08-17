import { useState } from "react";

import { Receipt } from "lucide-react";
import type { Refund } from "../types/refund.types";
import { useRefunds } from "../hook/useRefunds.hooks";
import { RefundsTable } from "../component/RefundsTable";
import { RefundDetailDrawer } from "../component/RefundsDetailDrawer";

export default function RefundsPage() {
  const [page, setPage] = useState(1);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);

  const { data, isLoading, isError } = useRefunds({ page });
  const refunds = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-2 bg-white">
      <div className="mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-100">
            <Receipt className="w-6 h-6 text-orange-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Refunds</h1>
            <p className="text-sm text-slate-500 mt-0.5">View and track all processed refunds</p>
          </div>
        </div>
      </div>

      <RefundsTable
        refunds={refunds}
        meta={meta}
        isLoading={isLoading}
        isError={isError}
        page={page}
        setPage={setPage}
       
      />

      <RefundDetailDrawer refund={selectedRefund} onClose={() => setSelectedRefund(null)} />
    </div>
  );
}