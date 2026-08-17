import { useState } from "react";
import { useInventoryUnit } from "../hooks/useInventoryUnit";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { inventoryUnitUpdate } from "@/zod/table.schema";
import type { InventoryUnit } from "../../types/inventory.type";
import InventoryUnitForm from "./InventoryUnitForm";
import toast from "react-hot-toast";
import ManageConversionsModal from "./ManageConversionsModal";
import { useConfirm } from "@/providers/ConfirmProvider";
import { Search, X, Plus, Loader2 } from "lucide-react";

export type InventoryUnitFormData = z.input<typeof inventoryUnitUpdate>;

export default function AllInventoryUnitPage() {
  const [search, setSearch] = useState("");
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [editUnit, setEditUnit] = useState<InventoryUnit | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [conversionUnit, setConversionUnit] = useState<InventoryUnit | null>(null);
  const [drawerUnit, setDrawerUnit] = useState<InventoryUnit | null>(null);
  const confirm = useConfirm();

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");

  const {
    inventoryUnits,
    meta,
    adjustInventoryUnit,
    deleteInventoryUnit,
    loading,
    error,
  } = useInventoryUnit({
    page,
    limit: 20,
    ...(typeFilter && { type: typeFilter }),
    ...(search && { search }),
  });


  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InventoryUnitFormData>({
    resolver: zodResolver(inventoryUnitUpdate),
  });

  const safeUnits = (inventoryUnits as InventoryUnit[] | null | undefined) ?? [];
  const filteredUnits = safeUnits;

  const handleEdit = (unit: InventoryUnit) => {
    setEditUnit(unit);
    reset({
      name: unit.name,
      type: unit.type,
      symbol: unit.symbol,
      isActive: unit.isActive,
    });
  };

  const handleClose = () => {
    setEditUnit(null);
    reset();
  };

  const onSubmit = async (data: InventoryUnitFormData) => {
    if (!editUnit?.id) return;
    try {
      await adjustInventoryUnit({ id: editUnit.id, data });
      toast.success("Unit updated successfully");
      handleClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update unit");
    }
  };

  const handleDelete = async (unit: InventoryUnit) => {
    const confirmed = await confirm({
      title: "Delete Unit",
      description: `Are you sure you want to delete "${unit.name}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });
    if (!confirmed) return;

    setDeletingId(unit.id);
    try {
      await deleteInventoryUnit(unit.id);
      toast.success("Unit deleted");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete unit");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Inventory Units
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1">
              Manage measurement units and base unit conversions.
            </p>
          </div>

          <button
            onClick={() => setIsAddUnitOpen(true)}
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-semibold transition duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Unit
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search unit..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl bg-white/80 outline-none focus:ring-2 focus:ring-orange-500 transition duration-200 shadow-sm text-sm"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-48 px-5 py-3 border border-slate-200 rounded-2xl bg-white/80 outline-none focus:ring-2 focus:ring-orange-500 transition duration-200 shadow-sm text-sm"
          >
            <option value="">All Types</option>
            <option value="WEIGHT">Weight</option>
            <option value="VOLUME">Volume</option>
            <option value="COUNT">Count</option>
            <option value="PACKAGING">Packaging</option>
          </select>
        </div>

        {/* Main Content */}
        {loading && safeUnits.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
            <p className="text-red-500 text-sm font-medium">Failed to load units</p>
          </div>
        ) : filteredUnits.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
            <p className="text-slate-400 text-sm">No units found.</p>
          </div>
        ) : (
          <div className="overflow-hidden bg-white border border-slate-100 rounded-2xl shadow-sm transition-shadow duration-300 hover:shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-700 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Symbol</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Type</th>
                    <th className="px-4 py-3 hidden md:table-cell">Base Unit</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Conversions</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {filteredUnits.map((unit) => (
                    <tr
                      key={unit.id}
                      className="hover:bg-slate-50/60 transition-colors duration-200"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {unit.name}
                      </td>

                      <td className="px-4 py-3 font-mono text-xs text-slate-500 hidden sm:table-cell">
                        {unit.symbol}
                      </td>

                      <td className="px-4 py-3 font-medium hidden sm:table-cell">
                        {unit.type}
                      </td>

                      <td className="px-4 py-3 hidden md:table-cell">
                        {unit.isBaseUnit ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 shadow-sm">
                            Base
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-sm ${
                            unit.isActive
                              ? "bg-green-50 text-green-700 border-green-100"
                              : "bg-red-50 text-red-700 border-red-100"
                          }`}
                        >
                          {unit.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-600 text-xs font-semibold hidden lg:table-cell">
                        {unit.fromConversions?.length
                          ? unit.fromConversions
                              .map((c) => `1 ${unit.name} = ${c.factor} ${c.toUnit?.name}`)
                              .join(", ")
                          : "—"}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setDrawerUnit(unit)}
                          className="px-4 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition duration-150 active:scale-95 cursor-pointer"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-sm font-semibold text-slate-600">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
                  disabled={page >= meta.totalPages}
                  className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Modals & Drawer outside inner wrapper to fix backdrop height ── */}

      {/* Add Unit Modal */}
      {isAddUnitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 transform scale-100">
            <button
              onClick={() => setIsAddUnitOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition duration-200"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
            <InventoryUnitForm onClose={() => setIsAddUnitOpen(false)} />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 transform scale-100">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition duration-200"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Edit Unit
              </h1>
              <p className="text-sm text-slate-500 mt-1.5">
                Update unit details and active status
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit, (errs) =>
                console.error("Validation:", errs),
              )}
              className="space-y-5"
            >
              <div className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Unit Name
                  </label>
                  <input
                    {...register("name")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition duration-200"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Symbol
                  </label>
                  <input
                    {...register("symbol")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition duration-200"
                  />
                  {errors.symbol && (
                    <p className="text-red-500 text-xs mt-1">{errors.symbol.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Type
                  </label>
                  <select
                    {...register("type")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition duration-200"
                  >
                    <option value="WEIGHT">Weight</option>
                    <option value="VOLUME">Volume</option>
                    <option value="COUNT">Count</option>
                    <option value="PACKAGING">Packaging</option>
                  </select>
                  {errors.type && (
                    <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>
                  )}
                </div>

                <div className="col-span-2 flex items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-2.5">
                  <input
                    type="checkbox"
                    id="isActive"
                    {...register("isActive")}
                    className="h-4 w-4 rounded border-slate-200 text-orange-600 focus:ring-orange-400 cursor-pointer"
                  />
                  <div>
                    <label
                      htmlFor="isActive"
                      className="text-sm font-semibold text-slate-700 cursor-pointer"
                    >
                      Active Status
                    </label>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Enable or disable this unit across inventory.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition shadow flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conversion Modal */}
      {conversionUnit && (
        <ManageConversionsModal
          unit={safeUnits.find((u) => u.id === conversionUnit.id) ?? conversionUnit}
          allUnits={safeUnits}
          onClose={() => setConversionUnit(null)}
        />
      )}

      {/* Drawer */}
      {drawerUnit && (
        <>
          <style>{`
            @keyframes slideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .animate-drawer-slide {
              animation: slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .animate-drawer-fade {
              animation: fadeIn 0.25s ease-out forwards;
            }
          `}</style>

          <div
            className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-xs animate-drawer-fade"
            onClick={() => setDrawerUnit(null)}
          />

          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-slate-50 shadow-2xl border-l border-slate-100 flex flex-col animate-drawer-slide p-6 sm:p-8">
            <div className="flex items-center justify-between pb-5 border-b border-slate-200 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Manage Unit</h2>
                <p className="text-xs text-slate-500 mt-1 font-semibold">{drawerUnit.name}</p>
              </div>
              <button
                onClick={() => setDrawerUnit(null)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-2 rounded-full transition duration-200"
                aria-label="Close drawer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1 -mr-1">
              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Unit Summary
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">Name</p>
                    <p className="text-sm text-slate-800 font-bold mt-0.5">{drawerUnit.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">Symbol</p>
                    <p className="text-sm text-slate-800 font-mono font-bold mt-0.5">{drawerUnit.symbol}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">Type</p>
                    <p className="text-sm text-slate-800 font-semibold mt-0.5">{drawerUnit.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">Base Unit</p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-bold border ${
                        drawerUnit.isBaseUnit
                          ? "bg-blue-50 text-blue-700 border-blue-100"
                          : "bg-slate-50 text-slate-500 border-slate-100"
                      }`}
                    >
                      {drawerUnit.isBaseUnit ? "Base" : "Sub-unit"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">Status</p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-bold border ${
                        drawerUnit.isActive
                          ? "bg-green-50 text-green-700 border-green-100"
                          : "bg-red-50 text-red-700 border-red-100"
                      }`}
                    >
                      {drawerUnit.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {(drawerUnit.fromConversions?.length ?? 0) > 0 && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-400 font-semibold">Conversions</p>
                      <div className="mt-1 space-y-0.5">
                        {drawerUnit.fromConversions!.map((c) => (
                          <p key={c.id} className="text-sm text-slate-800 font-semibold">
                            1 {drawerUnit.name} = {c.factor} {c.toUnit?.name}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 space-y-3.5 mt-auto">
              <button
                onClick={() => {
                  setConversionUnit(drawerUnit);
                  setDrawerUnit(null);
                }}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl transition duration-200 shadow-sm flex items-center justify-center cursor-pointer hover:scale-[1.02] active:scale-[0.98] transform"
              >
                Configure Conversions
              </button>

              <button
                onClick={() => {
                  handleEdit(drawerUnit);
                  setDrawerUnit(null);
                }}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition duration-200 shadow-sm flex items-center justify-center cursor-pointer hover:scale-[1.02] active:scale-[0.98] transform"
              >
                Edit Unit Details
              </button>

              <button
                onClick={() => {
                  handleDelete(drawerUnit);
                  setDrawerUnit(null);
                }}
                disabled={deletingId === drawerUnit.id}
                className="w-full py-3.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white font-bold text-sm rounded-xl transition duration-200 flex items-center justify-center disabled:opacity-50 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transform"
              >
                Delete Unit
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}