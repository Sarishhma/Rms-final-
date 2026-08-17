import { ArrowRightLeft, Link2, Scissors, X } from "lucide-react";
import type { Table } from "@/features/tables/types";

interface TableActionMenuProps {
  table: Table;
  onTransfer: () => void;
  onCombine: () => void;
  onClose: () => void;
  onSplit: () => void;
  onViewOrder: () => void;
}

export default function TableActionMenu({
  table,
  onTransfer,
  onCombine,
  onClose,
  onSplit,
  onViewOrder,
}: TableActionMenuProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-xs mx-4 shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Occupied
            </p>
            <h2 className="text-lg font-bold text-gray-800">{table.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onViewOrder}
            className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition text-left"
          >
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <Scissors size={16} className="text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">View/edit Order</p>
              <p className="text-xs text-gray-400">
                View or edit the current order
              </p>
            </div>
          </button>
          <button
            onClick={onTransfer}
            className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition text-left"
          >
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <ArrowRightLeft size={16} className="text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Transfer Order</p>
              <p className="text-xs text-gray-400">
                Move order to another table
              </p>
            </div>
          </button>

          <button
            onClick={onCombine}
            className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition text-left"
          >
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <Link2 size={16} className="text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Combine Tables</p>
              <p className="text-xs text-gray-400">
                Extend order across multiple tables
              </p>
            </div>
          </button>
          <button
            onClick={onSplit}
            className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition text-left"
          >
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <Scissors size={16} className="text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Split Table</p>
              <p className="text-xs text-gray-400">
                Move specific items to another table
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
