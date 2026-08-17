import { useState } from "react";
import { useStock } from "@/features/stock/hooks/useStock";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { stockUpdate } from "@/zod/table.schema";
import type { StockItem } from "@/features/stock/types/stock.type";

export type StockFormData = z.input<typeof stockUpdate>;

export default function AllStockPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);

  const { stocks, adjustStock, loading, error } = useStock();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StockFormData>({
    resolver: zodResolver(stockUpdate),
  });

  const safeStocks = (stocks as StockItem[] | null | undefined) ?? [];
  const filteredStocks = safeStocks.filter((stock) =>
    (stock.menuItem?.name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleEdit = (stock: StockItem) => {
    setSelectedStock(stock);
    reset({
      remainingQty: stock.remainingQty,
      reason: "",
      businessDate: stock.businessDate,
    });
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedStock(null);
    reset();
  };

  const onSubmit = async (data: StockFormData) => {
    if (!selectedStock?.id) return;
    try {
      await adjustStock({
        id: selectedStock.id,
        data: {
          remainingQty: Number(data.remainingQty),
          reason: data.reason || "adjustment",
        },
      });
      handleClose();
    } catch (err) {
      console.error("Stock adjustment failed:", err);
    }
  };

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="space-y-3">
            <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-96 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="h-12 w-40 bg-slate-200 rounded-xl animate-pulse" />
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-44 bg-white border rounded-2xl p-5 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    );
  }

  // ─── Page ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Stock Management
            </h1>
            <p className="text-slate-500 mt-2">
              Manage restaurant stock inventory and monitor stock levels.
            </p>
          </div>
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-xl font-semibold">
            + Add Stock
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search stock item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>

        {/* Empty state */}
        {filteredStocks.length === 0 ? (
          <div className="flex justify-center mt-20">
            <div className="bg-white border rounded-2xl p-10 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-slate-700">
                No stock found
              </h3>
              <p className="text-slate-500 mt-2">
                Try adjusting your search or add a new stock item.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredStocks.map((stock) => {
              const isLow = stock.remainingQty <= stock.lowStockAt; // fix: remainingQty not openingQty

              return (
                <div
                  key={stock.id}
                  className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-semibold text-slate-800">
                      {stock.menuItem?.name ?? "Unnamed Item"}
                    </h2>
                    {isLow && (
                      <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">
                        Low stock
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-500 mt-1">
                    {new Date(stock.businessDate).toISOString().split("T")[0]}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-slate-400">Opening</p>
                      <p className="font-semibold text-slate-800">
                        {stock.openingQty}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Remaining</p>
                      <p
                        className={`font-semibold ${isLow ? "text-red-500" : "text-slate-800"}`}
                      >
                        {stock.remainingQty}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Alert at</p>
                      <p className="font-semibold text-slate-800">
                        {stock.lowStockAt}
                      </p>
                    </div>
                  </div>

                  {stock.variantId && (
                    <p className="text-xs text-slate-400 mt-3">
                      Variant: {stock.variantId}
                    </p>
                  )}

                  <div className="flex gap-2 mt-5">
                    <button
                      onClick={() => handleEdit(stock)}
                      className="flex-1 border rounded-lg py-2 text-sm hover:bg-slate-50 transition"
                    >
                      Edit
                    </button>
                    <button className="flex-1 bg-red-50 text-red-600 rounded-lg py-2 text-sm hover:bg-red-100 transition">
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()} // click outside to close
        >
          <div className="bg-white w-full max-w-md rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Update Stock</h2>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit, (errs) =>
                console.error("Validation:", errs),
              )}
              className="space-y-4"
            >
              {/* Menu item — read only */}
              <div>
                <label className="text-sm text-slate-600 font-medium">
                  Menu Item
                </label>
                <input
                  value={selectedStock?.menuItem?.name ?? ""}
                  disabled
                  className="w-full border p-2 rounded-lg bg-slate-50 text-slate-500 mt-1"
                />
              </div>

              {/* Remaining qty */}
              <div>
                <label className="text-sm text-slate-600 font-medium">
                  Remaining Quantity
                </label>
                <input
                  type="number"
                  {...register("remainingQty")}
                  className="w-full border p-2 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {errors.remainingQty && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.remainingQty.message}
                  </p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="text-sm text-slate-600 font-medium">
                  Reason
                </label>
                <input
                  {...register("reason")}
                  className="w-full border p-2 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {errors.reason && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.reason.message}
                  </p>
                )}
              </div>

              {/* Business date */}
              <div>
                <label className="text-sm text-slate-600 font-medium">
                  Business Date
                </label>
                <input
                  type="date" // fix: was "Date" (capital D)
                  {...register("businessDate")}
                  className="w-full border p-2 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {errors.businessDate && ( // fix: moved inside its own div
                  <p className="text-red-500 text-xs mt-1">
                    {errors.businessDate.message}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 border p-2 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg transition disabled:opacity-60"
                >
                  {isSubmitting ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
