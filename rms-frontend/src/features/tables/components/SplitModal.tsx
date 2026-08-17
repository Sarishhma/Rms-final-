import { useState } from "react";
import { TableStatus } from "@/features/tables/types/index";
import type { Table, SplitTablePayload } from "@/features/tables/types/index";

import { useSplitTable } from "../hooks/useSplitTable";

import { Scissors, X, Plus, Minus } from "lucide-react";
import { useOrdersById } from "../../orders/hooks/useGetOrdersId";

interface SplitModalProps {
  fromTable: Table;
  tables: Table[];
  onClose: () => void;
}

export default function SplitModal({
  fromTable,
  tables,
  onClose,
}: SplitModalProps) {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [reason, setReason] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>(
    {},
  );
  const { mutate: split, isPending } = useSplitTable();
  const { data: order, isLoading } = useOrdersById(fromTable.activeOrderId);

  const getTableId = (table: Table): string => {
    return Array.isArray(table.id) ? table.id[0] : table.id;
  };
  const fromTableId = getTableId(fromTable);

  const availableTables = tables.filter(
    (t) => t.status === TableStatus.AVAILABLE && getTableId(t) !== fromTableId,
  );

  const handleQuantityChange = (
    itemId: string,
    max: number,
    type: "increase" | "decrease",
  ) => {
    setSelectedItems((prev) => {
      const current = prev[itemId] ?? 0;
      if (type === "increase" && current < max)
        return { ...prev, [itemId]: current + 1 };
      if (type === "decrease" && current > 0)
        return { ...prev, [itemId]: current - 1 };
      return prev;
    });
  };

  const handleConfirm = () => {
    if (!selectedTable || !reason.trim()) return;
    const items = Object.entries(selectedItems)
      .filter(([, qty]) => qty > 0)
      .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
    if (!items.length) return;

    const payload: SplitTablePayload = {
      sourceOrderId: order?.id!,
      fromTableId: getTableId(fromTable),
      toTableId: getTableId(selectedTable),
      items,
      reason,
    };
    split(payload, { onSuccess: onClose });
  };

  const hasSelectedItems = Object.values(selectedItems).some((q) => q > 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <Scissors size={18} className="text-orange-500" />
            <h2 className="text-lg font-bold text-gray-800">Split Table</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* From Table */}
        <div className="p-3 bg-gray-50 rounded-xl mb-5">
          <p className="text-xs text-gray-400 mb-1">Splitting from</p>
          <p className="font-bold text-red-500">{fromTable.name}</p>
        </div>

        {/* Order Items */}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Select Items to Split
        </p>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {order?.items?.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {item.menuItem?.name}
                  </p>
                  <p className="text-xs text-orange-500 font-bold">
                    Rs.{item.unitPrice}
                  </p>
                  <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() =>
                      handleQuantityChange(item.id, item.quantity, "decrease")
                    }
                    className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 cursor-pointer"
                  >
                    <Minus size={10} />
                  </button>
                  <span className="text-xs font-bold w-4 text-center">
                    {selectedItems[item.id] ?? 0}
                  </span>
                  <button
                    onClick={() =>
                      handleQuantityChange(item.id, item.quantity, "increase")
                    }
                    className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 cursor-pointer"
                  >
                    <Plus size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Target Table */}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Select Target Table
        </p>
        <div className="grid grid-cols-4 gap-2 mb-4 max-h-32 overflow-y-auto">
          {availableTables.map((t) => {
            const tIds = getTableId(t);

            return (
              <button
                key={tIds}
                onClick={() => setSelectedTable(t)}
                className={`py-2 px-1 rounded-xl border-2 text-xs font-bold transition ${
                  selectedTable?.id[0] === t.id[0]
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
            disabled={
              !selectedTable ||
              !reason.trim() ||
              !hasSelectedItems ||
              isPending ||
              isLoading ||
              !order?.id
            }
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isPending ? "Splitting..." : "Confirm Split"}
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
