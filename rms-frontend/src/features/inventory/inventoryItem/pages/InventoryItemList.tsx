// components/inventory/InventoryItemsList.tsx
import { useState } from "react";
import { useInventoryItems } from "../hooks/useinventoryitem.hook";
import type { InventoryItem } from "../../types/inventory.type";

export function InventoryItemsList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isError, error } = useInventoryItems({page, limit});

  const items: InventoryItem[] = data?.data ?? [];
  const meta = data?.meta;

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-full max-w-md bg-slate-200 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-white border border-slate-100 rounded-3xl p-6 animate-pulse shadow-sm"
            />
          ))}
        </div>
      </div>
    );
  }

  // Error
  if (isError) {
    return (
      <div className="bg-red-50 text-red-600 font-medium px-6 py-4 rounded-2xl border border-red-100 shadow-sm text-center">
        Failed to load inventory items
        {error instanceof Error ? `: ${error.message}` : ""}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search */}
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Search item..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-5 py-3 border border-slate-200 rounded-2xl bg-white/80 outline-none focus:ring-2 focus:ring-orange-500 transition duration-200 shadow-sm"
        />
        {meta && (
          <span className="hidden sm:block text-sm font-semibold text-slate-500 whitespace-nowrap">
            {meta.total} item{meta.total === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {/* Table / List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl shadow-sm max-w-md mx-auto">
          <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-slate-400 text-lg">🔍</span>
          </div>
          <h3 className="text-lg font-bold text-slate-800">No items found</h3>
          <p className="text-slate-500 mt-1 text-sm max-w-xs mx-auto">
            Try adjusting your search terms, or add a new inventory item to
            get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden bg-white border border-slate-150 rounded-2xl shadow-sm transition-shadow duration-300 hover:shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-700 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Category</th>
                  <th className="px-4 py-3 hidden md:table-cell">Unit</th>
                  <th className="px-4 py-3 text-right hidden lg:table-cell">
                    Reorder Level
                  </th>
                  <th className="px-4 py-3 text-right hidden lg:table-cell">
                    Stock Balance
                  </th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 transition-colors duration-200"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {item.name}
                    </td>

                    <td className="px-4 py-3 text-slate-600 font-medium hidden sm:table-cell">
                      {item.category?.name ?? (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-600 font-medium hidden md:table-cell">
                      {item.baseUnit?.name ?? (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right text-slate-650 font-semibold hidden lg:table-cell">
                      {item.reorderLevel}
                    </td>

                    <td className="px-4 py-3 text-right text-slate-650 font-semibold hidden lg:table-cell">
  {item.stockBalance ? (
    typeof item.stockBalance === "object" ? (
      (item.stockBalance as any).quantityOnHand
    ) : (
      item.stockBalance
    )
  ) : (
    <span className="text-slate-400 font-normal">—</span>
  )}
</td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-sm ${
                          item.isActive
                            ? "bg-green-50 text-green-700 border-green-100"
                            : "bg-red-50 text-red-700 border-red-100"
                        }`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500 font-medium">
            Page {meta.page} of {meta.totalPages}
          </span>
          <div className="flex items-center gap-3">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition duration-200 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Previous
            </button>
            <button
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition duration-200 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}