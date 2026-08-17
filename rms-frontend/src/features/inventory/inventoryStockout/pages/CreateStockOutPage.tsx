import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Trash2, Loader2, ArrowLeft, AlertTriangle } from "lucide-react";
import { useCreateInventoryStockOut } from "../hooks/useInventoryStockOut";
import { useInventoryItems } from "../../inventoryItem/hooks/useinventoryitem.hook";
import { useInventoryUnit } from "../../inventoryUnit/hooks/useInventoryUnit";
import { STOCK_OUT_REASONS } from "../../types/inventory.type";
import type { InventoryItem, StockOutReason } from "../../types/inventory.type";

interface LineItemRow {
  key: string;
  itemId: string;
  unitId: string;
  quantity: number | "";
  note: string;
}

const NEEDS_ISSUED_TO: StockOutReason[] = [
  "KITCHEN_USE",
  "BAR_USE",
  "STAFF_MEAL",
  "EVENT_USE",
  "COMPLIMENTARY",
  "INTERNAL_USE",
];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-slate-500 mb-0.5">
      {children}
    </label>
  );
}

export default function CreateStockOutPage() {
  const navigate = useNavigate();
  const { mutate: createStockOut, isPending } = useCreateInventoryStockOut();

  const { data: itemsData, isLoading: itemsLoading } = useInventoryItems();
  const allItems: InventoryItem[] = itemsData?.data ?? [];

  const { inventoryUnits, loading: unitsLoading } = useInventoryUnit();

  const stockedItems = useMemo(
    () => allItems.filter((i) => i.isActive && i.stockBalance !== null),
    [allItems]
  );

  const [reason, setReason] = useState<StockOutReason>("KITCHEN_USE");
  const [customReason, setCustomReason] = useState("");
  const [stockOutDate, setStockOutDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [issuedTo, setIssuedTo] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [note, setNote] = useState("");

  const showCustomReason = reason === "OTHER";
  const showIssuedTo = NEEDS_ISSUED_TO.includes(reason);

  const [lineItems, setLineItems] = useState<LineItemRow[]>([
    { key: crypto.randomUUID(), itemId: "", unitId: "", quantity: "", note: "" },
  ]);

  const getCompatibleUnits = (itemId: string) => {
    if (!itemId) return [];
    const allUnits = inventoryUnits ?? [];
    const selectedItem = stockedItems.find((i) => i.id === itemId);
    if (!selectedItem) return allUnits.filter((u) => u.isActive);

    const baseUnitId = selectedItem.baseUnitId;
    const hasConversionData = allUnits.some(
      (u) => (u.fromConversions?.length ?? 0) > 0 || (u.toConversions?.length ?? 0) > 0
    );

    if (hasConversionData) {
      return allUnits.filter((unit) => {
        if (!unit.isActive) return false;
        if (unit.id === baseUnitId) return true;
        const hasConversionToBase = unit.fromConversions?.some((c) => c.toUnitId === baseUnitId);
        if (hasConversionToBase) return true;
        const baseUnit = allUnits.find((u) => u.id === baseUnitId);
        const hasConversionFromBase = baseUnit?.fromConversions?.some((c) => c.toUnitId === unit.id);
        return !!hasConversionFromBase;
      });
    }

    return allUnits.filter((u) => u.isActive);
  };

  const handleAddRow = () => {
    setLineItems((prev) => [
      ...prev,
      { key: crypto.randomUUID(), itemId: "", unitId: "", quantity: "", note: "" },
    ]);
  };

  const handleRemoveRow = (key: string) => {
    setLineItems((prev) => prev.filter((row) => row.key !== key));
  };

  const handleRowChange = (key: string, field: keyof LineItemRow, value: any) => {
    setLineItems((prev) =>
      prev.map((row) => {
        if (row.key !== key) return row;
        const updated = { ...row, [field]: value };
        if (field === "itemId") {
          const item = stockedItems.find((i) => i.id === value);
          updated.unitId = item ? item.baseUnitId : "";
          updated.quantity = "";
          updated.note = "";
        }
        return updated;
      })
    );
  };

  const handleSubmit = () => {
    if (!stockOutDate) {
      toast.error("Stock out date is required.");
      return;
    }
    if (showCustomReason && !customReason.trim()) {
      toast.error("Please specify a custom reason when 'Other' is selected.");
      return;
    }

    for (let i = 0; i < lineItems.length; i++) {
      const row = lineItems[i];
      const lineNum = i + 1;

      if (!row.itemId) {
        toast.error(`Line ${lineNum}: Select an item.`);
        return;
      }
      if (!row.unitId) {
        toast.error(`Line ${lineNum}: Select a unit.`);
        return;
      }
      const qty = Number(row.quantity);
      if (!qty || qty <= 0) {
        toast.error(`Line ${lineNum}: Quantity must be greater than 0.`);
        return;
      }

      const item = stockedItems.find((it) => it.id === row.itemId);
      if (item) {
        const available = Number(item.stockBalance?.quantityOnHand ?? 0);
        if (row.unitId === item.baseUnitId && qty > available) {
          toast.error(
            `Line ${lineNum}: Quantity (${qty} ${item.baseUnit?.symbol}) exceeds available stock (${available} ${item.baseUnit?.symbol}).`
          );
          return;
        }
      }
    }

    const payload = {
      reason,
      ...(showCustomReason && customReason.trim() ? { customReason: customReason.trim() } : {}),
      stockOutDate,
      ...(issuedTo.trim() ? { issuedTo: issuedTo.trim() } : {}),
      ...(receivedBy.trim() ? { receivedBy: receivedBy.trim() } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
      items: lineItems.map((row) => ({
        itemId: row.itemId,
        unitId: row.unitId,
        quantity: Number(row.quantity),
        ...(row.note.trim() ? { note: row.note.trim() } : {}),
      })),
    };

    createStockOut(payload, {
      onSuccess: (data) => {
        toast.success(`Stock out ${data.stockOutNumber} created as draft.`);
        navigate(`/admin/inventory/stock-outs/${data.id}`);
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message ?? err?.message ?? "Failed to create stock out.";
        toast.error(msg);
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <Link
            to="/admin/inventory/stock-outs"
            className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Record Stock Out
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Document consumption, waste, or internal usage. Saved as a draft — post to update stock.
            </p>
          </div>
        </div>

        {/* ── No stock warning ── */}
        {!itemsLoading && stockedItems.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex gap-3 text-amber-800 shadow-sm">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-sm">
              <span className="font-bold text-amber-900">No stock available:</span>
              <p className="text-xs">
                No items with stock balance found. Purchase inventory first before creating a stock out.
              </p>
            </div>
          </div>
        )}

        {/* ── Header Information Card ── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-1.5">
            Header Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Reason */}
            <div className="space-y-1">
              <Label>Reason <span className="text-orange-500">*</span></Label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as StockOutReason)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-orange-500 transition text-sm cursor-pointer"
              >
                {STOCK_OUT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Custom Reason */}
            {showCustomReason && (
              <div className="space-y-1">
                <Label>Custom Reason <span className="text-orange-500">*</span></Label>
                <input
                  type="text"
                  placeholder="Describe the reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                />
              </div>
            )}

            {/* Stock Out Date */}
            <div className="space-y-1">
              <Label>Stock Out Date <span className="text-orange-500">*</span></Label>
              <input
                type="date"
                value={stockOutDate}
                onChange={(e) => setStockOutDate(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-orange-500 transition text-sm text-slate-700"
              />
            </div>

            {/* Issued To */}
            {showIssuedTo && (
              <div className="space-y-1">
                <Label>Issued To</Label>
                <input
                  type="text"
                  placeholder={reason === "STAFF_MEAL" ? "Staff name..." : "Section / department..."}
                  value={issuedTo}
                  onChange={(e) => setIssuedTo(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                />
              </div>
            )}

            {/* Received By */}
            {showIssuedTo && (
              <div className="space-y-1">
                <Label>Received By</Label>
                <input
                  type="text"
                  placeholder="Person receiving..."
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                />
              </div>
            )}

            {/* Note */}
            <div className={`space-y-1 ${!showIssuedTo ? "md:col-span-2" : ""}`}>
              <Label>Note</Label>
              <input
                type="text"
                placeholder="Optional notes..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
              />
            </div>
          </div>
        </div>

        {/* ── Line Items Card ── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3.5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Items ({lineItems.length})
            </h2>
            <button
              onClick={handleAddRow}
              className="text-xs font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 px-3.5 py-1.5 rounded-xl border border-orange-200 transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Item
            </button>
          </div>

          <div className="overflow-x-auto min-h-[160px]">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-600 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="px-2.5 py-2 w-64">Item</th>
                  <th className="px-2.5 py-2 w-36">Unit</th>
                  <th className="px-2.5 py-2 w-28">Quantity</th>
                  <th className="px-2.5 py-2 w-32 hidden md:table-cell">Available</th>
                  <th className="px-2.5 py-2 w-40 hidden lg:table-cell">Line Note</th>
                  <th className="px-2.5 py-2 w-10"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-slate-600">
                {lineItems.map((row) => {
                  const compatibleUnits = getCompatibleUnits(row.itemId);
                  const selectedItem = stockedItems.find((i) => i.id === row.itemId);
                  const availableStock = selectedItem?.stockBalance?.quantityOnHand;
                  const isOverStock =
                    selectedItem &&
                    row.unitId === selectedItem.baseUnitId &&
                    Number(row.quantity) > Number(availableStock ?? 0);

                  return (
                    <tr key={row.key} className="align-top">
                      <td className="px-2 py-2">
                        <select
                          value={row.itemId}
                          disabled={itemsLoading}
                          onChange={(e) => handleRowChange(row.key, "itemId", e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500 text-sm cursor-pointer"
                        >
                          <option value="">
                            {itemsLoading ? "Loading items..." : "Select item..."}
                          </option>
                          {stockedItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} [{item.type.replace("_", " ")}]
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-2 py-2">
                        <select
                          value={row.unitId}
                          disabled={!row.itemId || unitsLoading}
                          onChange={(e) => handleRowChange(row.key, "unitId", e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500 text-sm cursor-pointer"
                        >
                          <option value="">
                            {unitsLoading ? "Loading..." : "Select..."}
                          </option>
                          {compatibleUnits.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.symbol})
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={0.01}
                          step="any"
                          placeholder="0"
                          value={row.quantity}
                          onChange={(e) =>
                            handleRowChange(
                              row.key,
                              "quantity",
                              e.target.value === "" ? "" : parseFloat(e.target.value) || 0
                            )
                          }
                          className={`w-full px-3 py-1.5 border rounded-xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold ${
                            isOverStock ? "border-red-300 bg-red-50/50" : "border-slate-200"
                          }`}
                        />
                        {isOverStock && (
                          <p className="text-xs text-red-500 mt-0.5 font-semibold">Exceeds stock</p>
                        )}
                      </td>

                      <td className="px-2 py-2 hidden md:table-cell">
                        {selectedItem && availableStock !== undefined ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              Number(availableStock) > 0
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-600 border-rose-200"
                            }`}
                          >
                            {availableStock} {selectedItem.baseUnit?.symbol}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-2 py-2 hidden lg:table-cell">
                        <input
                          type="text"
                          placeholder="Optional..."
                          value={row.note}
                          onChange={(e) => handleRowChange(row.key, "note", e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        />
                      </td>

                      <td className="px-2 py-2 text-right">
                        <button
                          onClick={() => handleRemoveRow(row.key)}
                          disabled={lineItems.length <= 1}
                          className="p-1.5 border border-slate-100 hover:border-red-200 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Footer Actions ── */}
        <div className="flex justify-end gap-3.5 bg-white border border-slate-100 rounded-2xl p-3.5 shadow-sm">
          <Link
            to="/admin/inventory/stock-outs"
            className="px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition flex items-center justify-center cursor-pointer"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={isPending || stockedItems.length === 0}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow transition flex items-center justify-center disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save as Draft"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}