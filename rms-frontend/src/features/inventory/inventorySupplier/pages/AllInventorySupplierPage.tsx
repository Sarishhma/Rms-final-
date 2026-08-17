import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { Plus, Search, X, Loader2 } from "lucide-react";
import { useInventorySupplier } from "../hooks/useInventorySupplier";
import { inventorySupplierUpdate } from "@/zod/table.schema";
import type { InventorySupplier } from "../../types/inventory.type";
import InventorySupplierForm from "./InventorySupplierForm";
import { useConfirm } from "@/providers/ConfirmProvider";

type SupplierUpdateFormData = z.input<typeof inventorySupplierUpdate>;

export default function AllInventorySupplierPage() {
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<InventorySupplier | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [drawerSupplier, setDrawerSupplier] =
    useState<InventorySupplier | null>(null);

  const confirm = useConfirm();
  const [page, setPage] = useState(1);

  const { inventorySuppliers, meta, adjustSupplier, deleteSupplier, loading } =
    useInventorySupplier({
      page,
      limit: 20,
      ...(search && { search }),
    });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierUpdateFormData>({
    resolver: zodResolver(inventorySupplierUpdate),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      panNumber: "",
      vatNumber: "",
      
      isActive: true,
    },
  });

  const handleEdit = (supplier: InventorySupplier) => {
    setEditSupplier(supplier);
    reset({
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email || "",
      address: supplier.address || "",
      panNumber: supplier.panNumber || "",
      vatNumber: supplier.vatNumber || "",
     
      isActive: supplier.isActive,
    });
  };

  const handleCloseEdit = () => {
    setEditSupplier(null);
    reset();
  };

  const onSubmitEdit = async (data: SupplierUpdateFormData) => {
    if (!editSupplier?.id) return;
    try {
      await adjustSupplier({ id: editSupplier.id, data });
      toast.success("Supplier updated successfully");
      handleCloseEdit();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update supplier");
    }
  };

  const handleDelete = async (supplier: InventorySupplier) => {
    const confirmed = await confirm({
      title: "Delete Supplier",
      description: `Are you sure you want to delete "${supplier.name}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });
    if (!confirmed) return;

    setDeletingId(supplier.id);
    try {
      await deleteSupplier(supplier.id);
      toast.success("Supplier deleted");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete supplier");
    } finally {
      setDeletingId(null);
    }
  };

  const safeSuppliers = (inventorySuppliers as InventorySupplier[]) ?? [];
  const filteredSuppliers = safeSuppliers;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Inventory Suppliers
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1">
              Manage your inventory vendors, contact details, and billing
              profiles
            </p>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-semibold transition duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </button>
        </div>

        {/* Search */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search by supplier or contact name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl bg-white/80 outline-none focus:ring-2 focus:ring-orange-500 transition duration-200 shadow-sm text-sm"
            />
          </div>
        </div>

        {/* Main Content */}
        {loading && safeSuppliers.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500" />
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
            <p className="text-slate-400 text-sm">No suppliers found.</p>
          </div>
        ) : (
          <div className="overflow-hidden bg-white border border-slate-100 rounded-2xl shadow-sm transition-shadow duration-300 hover:shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-700 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                  
                    <th className="px-4 py-3 hidden md:table-cell">Phone</th>

                     <th className="px-4 py-3">Address</th>

                    <th className="px-4 py-3">Status</th>
                   
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {filteredSuppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="hover:bg-slate-50/60 transition-colors duration-200"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {supplier.name}
                      </td>

                     

                      <td className="px-4 py-3 font-mono text-xs text-slate-500 hidden md:table-cell">
                        {supplier.phone}
                      </td>

                        <td className="px-4 py-3 font-mono text-xs text-slate-500 hidden md:table-cell">
                        {supplier.address}
                      </td>


                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-sm ${
                            supplier.isActive
                              ? "bg-green-50 text-green-700 border-green-100"
                              : "bg-red-50 text-red-700 border-red-100"
                          }`}
                        >
                          {supplier.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setDrawerSupplier(supplier)}
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
                  onClick={() =>
                    setPage((p) => Math.min(p + 1, meta.totalPages))
                  }
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

      {/* ADD SUPPLIER MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 transform scale-100">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition duration-200"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
            <InventorySupplierForm onClose={() => setIsAddOpen(false)} />
          </div>
        </div>
      )}

      {/* EDIT SUPPLIER MODAL */}
      {editSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 transform scale-100">
            <button
              onClick={handleCloseEdit}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition duration-200"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Edit Supplier
              </h1>
              <p className="text-sm text-slate-500 mt-1.5">
                Update supplier profile and registration details
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    {...register("name")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition duration-200"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

              

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    {...register("phone")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition duration-200"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition duration-200"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    {...register("address")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition duration-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    {...register("panNumber")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition duration-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    VAT Number
                  </label>
                  <input
                    type="text"
                    {...register("vatNumber")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition duration-200"
                  />
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
                      Supplier is Active
                    </label>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Enable or disable this supplier across purchase orders.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseEdit}
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

      {/* DRAWER */}
      {drawerSupplier && (
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
            onClick={() => setDrawerSupplier(null)}
          />

          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-slate-50 shadow-2xl border-l border-slate-100 flex flex-col animate-drawer-slide p-6 sm:p-8">
            <div className="flex items-center justify-between pb-5 border-b border-slate-200 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Manage Supplier
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-semibold">
                  {drawerSupplier.name}
                </p>
              </div>
              <button
                onClick={() => setDrawerSupplier(null)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-2 rounded-full transition duration-200"
                aria-label="Close drawer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1 -mr-1">
              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Business Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">Name</p>
                    <p className="text-sm text-slate-800 font-bold mt-0.5">
                      {drawerSupplier.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">
                      Status
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-bold border ${
                        drawerSupplier.isActive
                          ? "bg-green-50 text-green-700 border-green-100"
                          : "bg-red-50 text-red-700 border-red-100"
                      }`}
                    >
                      {drawerSupplier.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">
                      Phone
                    </p>
                    <p className="text-sm text-slate-800 font-mono font-bold mt-0.5">
                      {drawerSupplier.phone}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400 font-semibold">
                      Email
                    </p>
                    <p className="text-sm text-slate-800 font-medium mt-0.5">
                      {drawerSupplier.email || "—"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400 font-semibold">
                      Address
                    </p>
                    <p className="text-sm text-slate-800 font-medium mt-0.5">
                      {drawerSupplier.address || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tax Registration
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">
                      PAN Number
                    </p>
                    <p className="text-sm text-slate-800 font-mono font-bold mt-0.5">
                      {drawerSupplier.panNumber || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">
                      VAT Number
                    </p>
                    <p className="text-sm text-slate-800 font-mono font-bold mt-0.5">
                      {drawerSupplier.vatNumber || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 space-y-3.5 mt-auto">
              <button
                onClick={() => {
                  handleEdit(drawerSupplier);
                  setDrawerSupplier(null);
                }}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl transition duration-200 shadow-sm flex items-center justify-center cursor-pointer hover:scale-[1.02] active:scale-[0.98] transform"
              >
                Edit Supplier Details
              </button>

              <button
                onClick={() => {
                  handleDelete(drawerSupplier);
                  setDrawerSupplier(null);
                }}
                disabled={deletingId === drawerSupplier.id}
                className="w-full py-3.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white font-bold text-sm rounded-xl transition duration-200 flex items-center justify-center disabled:opacity-50 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transform"
              >
                Delete Supplier
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
