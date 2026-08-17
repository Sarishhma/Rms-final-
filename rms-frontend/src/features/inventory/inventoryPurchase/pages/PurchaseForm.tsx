// src/features/inventory/purchases/components/PurchaseForm.tsx
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useInventorySupplier } from "../../inventorySupplier/hooks/useInventorySupplier";
import { useInventoryItems } from "../../inventoryItem/hooks/useinventoryitem.hook";
import { useInventoryUnit } from "../../inventoryUnit/hooks/useInventoryUnit";
import type {
  CreateInventoryPurchaseLinePayload,
  CreateInventoryPurchasePayload,
  InventoryItem,
} from "../../types/inventory.type";

// ── Local types ───────────────────────────────────────────────────────────────
interface LineItemRow {
  key: string;
  itemId: string;
  unitId: string;
  quantity: number | "";
  unitCost: number | "";
  batchNumber: string;
  manufacturedDate: string;
  expiryDate: string;
}

export interface PurchaseFormValues {
  supplierId: string;
  purchaseDate: string;
  invoiceNumber: string;
  discountAmount: number | "";
  discountPercentage: number | "";
  vatRate: number | "";
  note: string;
  lineItems: LineItemRow[];
}

// ── Label helper ──────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-slate-500 mb-1">
      {children}
    </label>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
interface PurchaseFormProps {
  initialValues: PurchaseFormValues;
  onSubmit: (payload: CreateInventoryPurchasePayload) => void;
  isSubmitting: boolean;
  submitLabel: string;
}

export function PurchaseForm({
  initialValues,
  onSubmit,
  isSubmitting,
  submitLabel,
}: PurchaseFormProps) {
  // ── Data fetching ───────────────────────────────────────────────────────────
  const { inventorySuppliers, loading: suppliersLoading } =
    useInventorySupplier();

  const { data: itemsData, isLoading: itemsLoading } = useInventoryItems();
  const allItems: InventoryItem[] = itemsData?.data ?? [];

  const { inventoryUnits, loading: unitsLoading } = useInventoryUnit({
    page: 1,
    limit: 50,
  });

  const activeItems = useMemo(
    () => allItems.filter((i) => i.isActive),
    [allItems],
  );

  const activeSuppliers = useMemo(
    () => (inventorySuppliers ?? []).filter((s) => s.isActive),
    [inventorySuppliers],
  );

  // ── Header state ────────────────────────────────────────────────────────────
  const [supplierId, setSupplierId] = useState(initialValues.supplierId);
  const [purchaseDate, setPurchaseDate] = useState(initialValues.purchaseDate);
  const [invoiceNumber, setInvoiceNumber] = useState(initialValues.invoiceNumber);
  const [discountAmount, setDiscountAmount] = useState<number | "">(
    initialValues.discountAmount
  );
  const [discountPercentage, setDiscountPercentage] = useState<number | "">(
    initialValues.discountPercentage
  );
  const [vatRate, setVatRate] = useState<number | "">(initialValues.vatRate);
  const [note, setNote] = useState(initialValues.note);

  // ── Line items state ────────────────────────────────────────────────────────
  const [lineItems, setLineItems] = useState<LineItemRow[]>(
    initialValues.lineItems.length > 0
      ? initialValues.lineItems
      : [
          {
            key: crypto.randomUUID(),
            itemId: "",
            unitId: "",
            quantity: "",
            unitCost: "",
            batchNumber: "",
            manufacturedDate: "",
            expiryDate: "",
          },
        ]
  );

  // ── Discount handlers (mutual exclusivity) ────────────────────────────────
  const handleDiscountAmountChange = (value: number | "") => {
    setDiscountAmount(value);
    if (typeof value === "number" && value > 0) {
      setDiscountPercentage(0);
    }
  };

  const handleDiscountPercentageChange = (value: number | "") => {
    setDiscountPercentage(value);
    if (typeof value === "number" && value > 0) {
      setDiscountAmount(0);
    }
  };

  // ── Derived totals ──────────────────────────────────────────────────────────
  const subtotal = useMemo(
    () =>
      lineItems.reduce(
        (sum, row) =>
          sum + (Number(row.quantity) || 0) * (Number(row.unitCost) || 0),
        0
      ),
    [lineItems]
  );

  const discountVal = useMemo(() => {
    const amount = Number(discountAmount) || 0;
    const percent = Number(discountPercentage) || 0;
    if (amount > 0) return amount;
    if (percent > 0) return subtotal * (percent / 100);
    return 0;
  }, [discountAmount, discountPercentage, subtotal]);

  const vatRateVal = Number(vatRate) || 0;
  const vatAmount = useMemo(() => {
    const base = Math.max(subtotal - discountVal, 0);
    return base * (vatRateVal / 100);
  }, [subtotal, discountVal, vatRateVal]);

  const grandTotal = useMemo(
    () => Math.max(subtotal - discountVal, 0) + vatAmount,
    [subtotal, discountVal, vatAmount]
  );

  // ── Compatible units helper ─────────────────────────────────────────────────
  const getCompatibleUnits = (itemId: string) => {
    if (!itemId) return [];
    const allUnits = inventoryUnits ?? [];
    const selectedItem = activeItems.find((i) => i.id === itemId);
    if (!selectedItem) return allUnits.filter((u) => u.isActive);

    const baseUnitId = selectedItem.baseUnitId;
    const hasConversionData = allUnits.some(
      (u) =>
        (u.fromConversions?.length ?? 0) > 0 ||
        (u.toConversions?.length ?? 0) > 0
    );

    if (hasConversionData) {
      return allUnits.filter((unit) => {
        if (!unit.isActive) return false;
        if (unit.id === baseUnitId) return true;
        const hasConversionToBase = unit.fromConversions?.some(
          (c) => c.toUnitId === baseUnitId
        );
        if (hasConversionToBase) return true;
        const baseUnit = allUnits.find((u) => u.id === baseUnitId);
        const hasConversionFromBase = baseUnit?.fromConversions?.some(
          (c) => c.toUnitId === unit.id
        );
        return !!hasConversionFromBase;
      });
    }
    return allUnits.filter((u) => u.isActive);
  };

  // ── Row handlers ────────────────────────────────────────────────────────────
  const handleAddRow = () => {
    setLineItems((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        itemId: "",
        unitId: "",
        quantity: "",
        unitCost: "",
        batchNumber: "",
        manufacturedDate: "",
        expiryDate: "",
      },
    ]);
  };

  const handleRemoveRow = (key: string) => {
    setLineItems((prev) => prev.filter((row) => row.key !== key));
  };

  const handleRowChange = (
    key: string,
    field: keyof LineItemRow,
    value: any
  ) => {
    setLineItems((prev) =>
      prev.map((row) => {
        if (row.key !== key) return row;

        const updated = { ...row, [field]: value };

        if (field === "itemId") {
          const item = activeItems.find((i) => i.id === value);
          if (item) {
            updated.unitId = item.baseUnitId;
            updated.unitCost = item.defaultPurchasePrice
              ? parseFloat(item.defaultPurchasePrice)
              : "";
          } else {
            updated.unitId = "";
            updated.unitCost = "";
          }
          updated.batchNumber = "";
          updated.manufacturedDate = "";
          updated.expiryDate = "";
        }

        return updated;
      })
    );
  };

  // ── Warnings ────────────────────────────────────────────────────────────────
  const warnings = useMemo(() => {
    const list: string[] = [];
    const todayStr = new Date().toISOString().split("T")[0];

    if (purchaseDate && purchaseDate > todayStr)
      list.push("Purchase date is set in the future.");
    if (vatRateVal !== 13)
      list.push("VAT rate deviates from the standard Nepalese rate of 13%.");
    if (discountVal > subtotal && subtotal > 0)
      list.push("Discount exceeds the current subtotal amount.");
    if (grandTotal === 0 && lineItems.some((r) => r.itemId))
      list.push("Grand total is Rs. 0.00 — verify quantities and costs.");

    const seenKeys = new Set<string>();
    lineItems.forEach((row, idx) => {
      if (!row.itemId) return;
      const item = activeItems.find((i) => i.id === row.itemId);
      if (!item) return;

      const cost = Number(row.unitCost) || 0;
      const defaultPrice = parseFloat(item.defaultPurchasePrice || "0") || 0;
      if (defaultPrice > 0 && cost > 0) {
        const diff = Math.abs(cost - defaultPrice) / defaultPrice;
        if (diff >= 0.3) {
          list.push(
            `Line ${idx + 1}: Unit cost (Rs. ${cost.toFixed(2)}) differs more than 30% from default (Rs. ${defaultPrice.toFixed(2)}).`
          );
        }
      }

      if (row.itemId && row.unitId) {
        const dupeKey = `${row.itemId}-${row.unitId}-${row.batchNumber || "no-batch"}`;
        if (seenKeys.has(dupeKey)) {
          list.push(
            `Line ${idx + 1}: Duplicate item, unit, and batch — verify this is intentional.`
          );
        } else {
          seenKeys.add(dupeKey);
        }
      }

      if (row.itemId && getCompatibleUnits(row.itemId).length === 0) {
        list.push(
          `Line ${idx + 1}: No compatible units for "${item.name}" — set up unit conversions first.`
        );
      }
    });

    const amount = Number(discountAmount) || 0;
    const percent = Number(discountPercentage) || 0;
    if (amount > 0 && percent > 0) {
      list.push(
        "Both discount amount and percentage are set – this is not allowed."
      );
    }

    return list;
  }, [
    purchaseDate,
    vatRateVal,
    discountVal,
    subtotal,
    grandTotal,
    lineItems,
    activeItems,
    discountAmount,
    discountPercentage,
  ]);

  // ── Save handler ────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!purchaseDate) {
      toast.error("Purchase date is required");
      return;
    }

    const amount = Number(discountAmount) || 0;
    const percent = Number(discountPercentage) || 0;
    if (amount > 0 && percent > 0) {
      toast.error("Cannot set both discount amount and percentage");
      return;
    }
    if (discountVal < 0) {
      toast.error("Discount cannot be negative");
      return;
    }
    if (discountVal > subtotal) {
      toast.error("Discount cannot exceed subtotal");
      return;
    }
    if (vatRateVal < 0) {
      toast.error("VAT rate cannot be negative");
      return;
    }
    if (lineItems.length === 0) {
      toast.error("At least one line item is required");
      return;
    }

    const payloadLines: CreateInventoryPurchaseLinePayload[] = [];

    for (let idx = 0; idx < lineItems.length; idx++) {
      const row = lineItems[idx];
      const lineNum = idx + 1;

      if (!row.itemId) {
        toast.error(`Line ${lineNum}: Item is required`);
        return;
      }
      if (!row.unitId) {
        toast.error(`Line ${lineNum}: Unit is required`);
        return;
      }

      const qty = Number(row.quantity);
      if (!qty || qty <= 0) {
        toast.error(`Line ${lineNum}: Quantity must be greater than 0`);
        return;
      }

      const cost = Number(row.unitCost);
      if (!cost || cost <= 0) {
        toast.error(`Line ${lineNum}: Unit cost must be greater than 0`);
        return;
      }

      const selectedItem = activeItems.find((i) => i.id === row.itemId);
      if (!selectedItem) {
        toast.error(`Line ${lineNum}: Selected item not found`);
        return;
      }

      if (selectedItem.trackExpiry) {
        if (!row.expiryDate) {
          toast.error(
            `Line ${lineNum}: Expiry date is required for "${selectedItem.name}"`
          );
          return;
        }
        const todayStr = new Date().toISOString().split("T")[0];
        if (row.expiryDate <= todayStr) {
          toast.error(`Line ${lineNum}: Expiry date must be in the future`);
          return;
        }
      }

      if (
        row.manufacturedDate &&
        row.expiryDate &&
        row.manufacturedDate >= row.expiryDate
      ) {
        toast.error(
          `Line ${lineNum}: Manufactured date must be before expiry date`
        );
        return;
      }

      payloadLines.push({
        itemId: row.itemId,
        unitId: row.unitId,
        quantity: qty,
        unitCost: cost,
        batchNumber: row.batchNumber,
        manufacturedDate: row.manufacturedDate || null,
        expiryDate: row.expiryDate || null,
      });
    }

    const payload: CreateInventoryPurchasePayload = {
      supplierId: supplierId || undefined,
      supplierInvoiceNumber: invoiceNumber || undefined,
      purchaseDate,
      discountAmount: amount || 0,
      discountPercentage: percent || 0,
      vatRate: vatRateVal,
      note: note || undefined,
      items: payloadLines,
    };

    onSubmit(payload);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-sm">
            <span className="font-bold text-amber-900">
              Procurement warnings:
            </span>
            <ul className="list-disc pl-4 space-y-1 text-xs">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Section 1: Header ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
          Invoice Header
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Supplier */}
          <div className="space-y-1.5">
            <Label>Supplier</Label>
            <select
              value={supplierId}
              disabled={suppliersLoading}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500 transition text-sm cursor-pointer"
            >
              <option value="">
                {suppliersLoading
                  ? "Loading suppliers..."
                  : "Select supplier (recommended)"}
              </option>
              {activeSuppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Purchase Date */}
          <div className="space-y-1.5">
            <Label>
              Purchase Date <span className="text-orange-500">*</span>
            </Label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-orange-500 transition text-sm text-slate-700"
            />
          </div>

          {/* Invoice Number */}
          <div className="space-y-1.5">
            <Label>Supplier Invoice Number</Label>
            <input
              type="text"
              placeholder="e.g. INV-109283"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
            />
          </div>

          {/* Discount Amount */}
          <div className="space-y-1.5">
            <Label>Discount Amount (Rs.)</Label>
            <input
              type="number"
              min={0}
              placeholder="0.00"
              value={discountAmount}
              onChange={(e) =>
                handleDiscountAmountChange(
                  e.target.value === "" ? "" : parseFloat(e.target.value) || 0
                )
              }
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
            />
          </div>

          {/* Discount Percentage */}
          <div className="space-y-1.5">
            <Label>Discount Percentage (%)</Label>
            <input
              type="number"
              min={0}
              max={100}
              placeholder="0"
              value={discountPercentage}
              onChange={(e) =>
                handleDiscountPercentageChange(
                  e.target.value === "" ? "" : parseFloat(e.target.value) || 0
                )
              }
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
            />
          </div>

          {/* VAT Rate */}
          <div className="space-y-1.5">
            <Label>VAT Rate (%)</Label>
            <input
              type="number"
              min={0}
              placeholder="13"
              value={vatRate}
              onChange={(e) =>
                setVatRate(
                  e.target.value === "" ? "" : parseFloat(e.target.value) || 0
                )
              }
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
            />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label>Note / Remarks</Label>
            <textarea
              rows={1}
              placeholder="e.g. Urgent shipment, quality notes..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-orange-500 transition text-sm resize-none"
            />
          </div>
        </div>
      </div>

      {/* ── Section 2: Line Items ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Line Items
          </h2>
          <button
            onClick={handleAddRow}
            className="text-xs font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 px-3.5 py-1.5 rounded-xl border border-orange-200 transition cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={14} /> Add Item
          </button>
        </div>

        <div className="overflow-x-auto min-h-[220px]">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-600 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-3 py-2.5 w-56">Item</th>
                <th className="px-3 py-2.5 w-32">Unit</th>
                <th className="px-3 py-2.5 w-24">Quantity</th>
                <th className="px-3 py-2.5 w-28">Unit Cost (Rs.)</th>
                <th className="px-3 py-2.5 w-28">Line Total</th>
                <th className="px-3 py-2.5 w-28">Batch No.</th>
                <th className="px-3 py-2.5 w-36">Mfg. Date</th>
                <th className="px-3 py-2.5 w-36">Expiry Date</th>
                <th className="px-3 py-2.5 w-10"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-600">
              {lineItems.map((row) => {
                const compatibleUnits = getCompatibleUnits(row.itemId);
                const selectedItem = activeItems.find(
                  (i) => i.id === row.itemId
                );
                const isTrackExpiry = selectedItem?.trackExpiry ?? false;
                const lineTotal =
                  (Number(row.quantity) || 0) * (Number(row.unitCost) || 0);

                return (
                  <tr key={row.key} className="align-top">
                    {/* Item */}
                    <td className="px-2 py-2.5">
                      <select
                        value={row.itemId}
                        disabled={itemsLoading}
                        onChange={(e) =>
                          handleRowChange(row.key, "itemId", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500 text-sm cursor-pointer"
                      >
                        <option value="">
                          {itemsLoading
                            ? "Loading items..."
                            : "Select item..."}
                        </option>
                        {activeItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Unit */}
                    <td className="px-2 py-2.5">
                      <select
                        value={row.unitId}
                        disabled={!row.itemId || unitsLoading}
                        onChange={(e) =>
                          handleRowChange(row.key, "unitId", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500 text-sm cursor-pointer"
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

                    {/* Quantity */}
                    <td className="px-2 py-2.5">
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
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                      />
                    </td>

                    {/* Unit Cost */}
                    <td className="px-2 py-2.5">
                      <input
                        type="number"
                        min={0.01}
                        step="any"
                        placeholder="0.00"
                        value={row.unitCost}
                        onChange={(e) =>
                          handleRowChange(
                            row.key,
                            "unitCost",
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                      />
                    </td>

                    {/* Line Total */}
                    <td className="px-3 py-2.5 font-semibold text-slate-800 text-sm whitespace-nowrap">
                      Rs. {lineTotal.toFixed(2)}
                    </td>

                    {/* Batch */}
                    <td className="px-2 py-2.5">
                      <input
                        type="text"
                        value={row.batchNumber}
                        disabled={!row.itemId}
                        onChange={(e) =>
                          handleRowChange(
                            row.key,
                            "batchNumber",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500 text-xs"
                      />
                    </td>

                    {/* Manufactured Date */}
                    <td className="px-2 py-2.5">
                      <input
                        type="date"
                        value={row.manufacturedDate}
                        disabled={!row.itemId}
                        onChange={(e) =>
                          handleRowChange(
                            row.key,
                            "manufacturedDate",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500 text-xs"
                      />
                    </td>

                    {/* Expiry Date */}
                    <td className="px-2 py-2.5">
                      <input
                        type="date"
                        value={row.expiryDate}
                        disabled={!row.itemId}
                        onChange={(e) =>
                          handleRowChange(
                            row.key,
                            "expiryDate",
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-xl bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500 text-xs ${
                          isTrackExpiry && !row.expiryDate
                            ? "border-amber-400 bg-amber-50/30"
                            : "border-slate-200"
                        }`}
                      />
                      {isTrackExpiry && (
                        <span className="text-xs text-amber-600 font-semibold block mt-0.5 ml-1">
                          Required
                        </span>
                      )}
                    </td>

                    {/* Remove */}
                    <td className="px-2 py-2.5 text-right">
                      <button
                        onClick={() => handleRemoveRow(row.key)}
                        disabled={lineItems.length <= 1}
                        className="p-2 border border-slate-100 hover:border-red-200 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <div className="w-80 space-y-2">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-800">
                Rs. {subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Discount</span>
              <span className="font-semibold text-red-600">
                − Rs. {discountVal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>VAT ({vatRateVal}%)</span>
              <span className="font-semibold text-slate-800">
                Rs. {vatAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold text-slate-900">
              <span>Grand Total</span>
              <span className="text-orange-600">
                Rs. {grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3.5 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        <Link
          to="/admin/inventory/purchases"
          className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition flex items-center justify-center cursor-pointer"
        >
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow transition flex items-center justify-center disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </div>
  );
}