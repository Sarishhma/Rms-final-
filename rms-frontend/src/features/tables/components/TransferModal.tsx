import { useState } from "react";
import { TableStatus } from "@/features/tables/types";
import type { Table, TransferTablePayload } from "@/features/tables/types";

import { useTransferTable } from "../hooks/useTransferTable";
import { ArrowRight, X } from "lucide-react";

interface TransferModalProps {
  fromTable: Table;
  tables: Table[];
  onClose: () => void;
}

export default function TransferModal({
  fromTable,
  tables,
  onClose,
}: TransferModalProps) {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [reason, setReason] = useState("");
  const { mutate: transfer, isPending } = useTransferTable();
  const getTableId = (table: Table): string => {
    return Array.isArray(table.id) ? table.id[0] : table.id;
  };
  const fromTableId = getTableId(fromTable);

  const availableTables = tables.filter(
    (t) => t.status === TableStatus.AVAILABLE && getTableId(t) !== fromTableId,
  );

  const handleConfirm = () => {
    if (!selectedTable) return;
    const payload: TransferTablePayload = {
      fromTableId: getTableId(fromTable),
      toTableId: getTableId(selectedTable),
      reason: reason,
    };
    transfer(payload, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-gray-800">Transfer Order</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* From → To */}
        <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl">
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-400 mb-1">From</p>
            <p className="font-bold text-red-500">{fromTable.name}</p>
          </div>
          <ArrowRight size={18} className="text-gray-400 shrink-0" />
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-400 mb-1">To</p>
            <p className="font-bold text-green-500">
              {selectedTable?.name ?? "—"}
            </p>
          </div>
        </div>

        {/* Available Tables */}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Select Destination
        </p>
        <div className="grid grid-cols-4 gap-2 mb-4 max-h-40 overflow-y-auto">
          {availableTables.map((t) => {
            const tIds = getTableId(t);

            return (
              <button
                key={tIds}
                onClick={() => setSelectedTable(t)}
                className={`py-2 px-1 rounded-xl border-2 text-xs font-bold transition ${
                  selectedTable?.id === t.id
                    ? "border-orange-500 bg-orange-50 text-orange-600"
                    : "border-gray-200 text-gray-600 hover:border-orange-300"
                }`}
              >
                {t.name}
              </button>
            );
          })}
          {availableTables.length === 0 && (
            <p className="col-span-4 text-center text-gray-400 text-sm py-4">
              No available tables
            </p>
          )}
        </div>

        {/* Reason */}
        <input
          type="text"
          placeholder="Reason "
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:border-orange-400"
        />

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={!selectedTable || !reason || isPending}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isPending ? "Transferring..." : "Confirm Transfer"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
