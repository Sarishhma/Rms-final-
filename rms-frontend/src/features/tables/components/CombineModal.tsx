import { useState } from "react";
import type { Table, CombineTablePayload } from "@/features/tables/types";

import { Link2, X } from "lucide-react";
import { useCombineTable } from "../hooks/useCombineTable";

interface CombineModalProps {
  fromTable: Table;
  tables: Table[];
  onClose: () => void;
}

export default function CombineModal({
  fromTable,
  tables,
  onClose,
}: CombineModalProps) {
  const [selectedTables, setSelectedTables] = useState<Table[]>([]);
  const [reason, setReason] = useState("");
  const { mutate: combine, isPending } = useCombineTable();

  const getTableId = (table: Table): string => {
    return Array.isArray(table.id) ? table.id[0] : table.id;
  };
  const fromTableId = getTableId(fromTable);
  const availableTables = tables.filter((t) => getTableId(t) !== fromTableId);

  const toggleTable = (table: Table) => {
    const tableId = getTableId(table);
    setSelectedTables((prev) =>
      prev.find((t) => getTableId(t) === tableId)
        ? prev.filter((t) => getTableId(t) !== tableId)
        : [...prev, table],
    );
  };

  const handleConfirm = () => {
    if (!selectedTables.length || !reason.trim()) return;
    const fromTableId = Array.isArray(fromTable.id)
      ? fromTable.id
      : [fromTable.id];
    const selectedTableIds = selectedTables.flatMap((t) =>
      Array.isArray(t.id) ? t.id : [t.id],
    );

    const allTableIds = [...fromTableId, ...selectedTableIds];

    const payload: CombineTablePayload = {
      orderId: fromTable.activeOrderId!,
      tableIds: allTableIds,
      reason,
    };
    combine(payload, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <Link2 size={18} className="text-orange-500" />
            <h2 className="text-lg font-bold text-gray-800">Combine Tables</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Primary Table */}
        <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl">
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-400 mb-1">Primary Table</p>
            <p className="font-bold text-red-500">{fromTable.name}</p>
          </div>
          <Link2 size={18} className="text-gray-400 shrink-0" />
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-400 mb-1">Adding</p>
            <p className="font-bold text-orange-500">
              {selectedTables.length > 0
                ? selectedTables.map((t) => t.name).join(", ")
                : "—"}
            </p>
          </div>
        </div>

        {/* Available Tables */}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Select Tables to Combine
        </p>
        <div className="grid grid-cols-4 gap-2 mb-4 max-h-40 overflow-y-auto">
          {availableTables.map((t) => {
            const tId = getTableId(t);
            const isSelected = selectedTables.some(
              (s) => getTableId(s) === tId,
            );
            return (
              <button
                key={tId}
                onClick={() => toggleTable(t)}
                className={`py-2 px-1 rounded-xl border-2 text-xs font-bold transition ${
                  isSelected
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
          placeholder="Reason (required)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:border-orange-400"
        />

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={!selectedTables.length || !reason.trim() || isPending}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isPending ? "Combining..." : "Confirm Combine"}
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
