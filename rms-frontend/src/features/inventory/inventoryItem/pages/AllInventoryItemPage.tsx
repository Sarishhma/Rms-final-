import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import toast from "react-hot-toast";
import { X, Plus, Search, Loader2 } from "lucide-react";
import { useConfirm } from "@/providers/ConfirmProvider";
import {
  useInventoryItems,
  useAdjustInventoryItem,
  useDeleteInventoryItem,
} from "../hooks/useinventoryitem.hook";
import { useInventoryUnit } from "../../inventoryUnit/hooks/useInventoryUnit";
import { useCategories } from "@/features/menu/hooks/useCategories";
import { CreateItemForm } from "./CreateItemForm";
import type { InventoryItem } from "../../types/inventory.type";
import { InventoryItemType } from "../../types/inventory.type";

const ITEM_TYPES = [
  { value: "RAW_MATERIAL", label: "Raw material" },
  { value: "PACKAGED_ITEM", label: "Packaged item" },
  { value: "CONSUMABLE", label: "Consumable" },
  { value: "OTHER", label: "Other" },
];

const updateItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(InventoryItemType),
  categoryId: z.string().optional().or(z.literal("")),
  baseUnitId: z.string().min(1, "Unit is required"),
  reorderLevel: z.number().min(0),
  trackExpiry: z.boolean(),
  defaultPurchasePrice: z.number().min(0),
  isActive: z.boolean(),
});

type UpdateItemFormValues = z.infer<typeof updateItemSchema>;

export default function AllInventoryItemPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [categoryIdFilter, setCategoryIdFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [drawerItem, setDrawerItem] = useState<InventoryItem | null>(null);

  const confirm = useConfirm();
  const { data: categoriesData } = useCategories();
  const { inventoryUnits } = useInventoryUnit();

  const { data, isLoading } = useInventoryItems({
    page,
    limit: 20,
    ...(search && { search }),
    ...(categoryIdFilter && { categoryId: categoryIdFilter }),
    ...(typeFilter && { type: typeFilter }),
    ...(lowStockFilter && { lowStockOnly: true }),
  });

  const { mutateAsync: adjustItem, isPending: adjustLoading } =
    useAdjustInventoryItem();
  const { mutateAsync: deleteItem } = useDeleteInventoryItem();

  const items: InventoryItem[] = data?.data ?? [];
  const meta = data?.meta;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateItemFormValues>({
    resolver: zodResolver(updateItemSchema),
    defaultValues: {
      name: "",
      type: InventoryItemType.RAW_MATERIAL,
      categoryId: "",
      baseUnitId: "",
      reorderLevel: 0,
      trackExpiry: false,
      defaultPurchasePrice: 0,
      isActive: true,
    },
  });



  const handleEditClick = (item: InventoryItem) => {
    setEditItem(item);
    reset({
      name: item.name,

      type: item.type,
      categoryId: item.categoryId || "",
      baseUnitId: item.baseUnitId,
      reorderLevel: parseFloat(item.reorderLevel) || 0,
      trackExpiry: item.trackExpiry,

      defaultPurchasePrice: parseFloat(item.defaultPurchasePrice || "0") || 0,
      isActive: item.isActive,
    });
  };

  const handleCloseEdit = () => {
    setEditItem(null);
    reset();
  };

  const onSubmitUpdate = async (values: UpdateItemFormValues) => {
    if (!editItem?.id) return;
    try {
      const payload = {
        ...values,
        categoryId: values.categoryId || undefined,
      };
      await adjustItem({ id: editItem.id, data: payload });
      toast.success("Item updated successfully");
      handleCloseEdit();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "";
        toast.error(errorMsg || "Failed to update item");
      
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    if (item.stockBalance !== null) {
      toast.error("Cannot delete item with existing stock movements");
      return;
    }

    const confirmed = await confirm({
      title: "Delete Item",
      description: `Are you sure you want to delete "${item.name}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });
    if (!confirmed) return;

    setDeletingId(item.id);
    try {
      await deleteItem(item.id);
      toast.success("Item deleted successfully");
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "";
      if (
        errorMsg.toLowerCase().includes("reference") ||
        errorMsg.toLowerCase().includes("constraint") ||
        errorMsg.toLowerCase().includes("foreign key") ||
        errorMsg.toLowerCase().includes("purchase") ||
        errorMsg.toLowerCase().includes("transaction")
      ) {
        toast.error(
          "Cannot delete item that has been used in purchases or transactions",
        );
      } else {
        toast.error(errorMsg || "Failed to delete item");
      }
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
              Inventory Items
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1">
              Track raw materials, packaged items, and consumables.
            </p>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-semibold transition duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Item
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
              placeholder="Search item..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl bg-white/80 outline-none focus:ring-2 focus:ring-orange-500 transition duration-200 shadow-sm text-sm"
            />
          </div>

          <select
            value={categoryIdFilter}
            onChange={(e) => {
              setCategoryIdFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-48 px-5 py-3 border border-slate-200 rounded-2xl bg-white/80 outline-none focus:ring-2 focus:ring-orange-500 transition duration-200 shadow-sm text-sm"
          >
            <option value="">All Categories</option>
            {categoriesData?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-48 px-5 py-3 border border-slate-200 rounded-2xl bg-white/80 outline-none focus:ring-2 focus:ring-orange-500 transition duration-200 shadow-sm text-sm"
          >
            <option value="">All Types</option>
            {ITEM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl border border-slate-200 bg-white/80 shadow-sm">
            <input
              id="lowStockFilter"
              type="checkbox"
              checked={lowStockFilter}
              onChange={(e) => {
                setLowStockFilter(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
            />
            <label
              htmlFor="lowStockFilter"
              className="text-sm font-semibold text-slate-700 cursor-pointer select-none"
            >
              Low Stock Only
            </label>
          </div>
        </div>

        {/* Main Content */}
        {isLoading && items.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
            <p className="text-slate-400 text-sm">No items found.</p>
          </div>
        ) : (
          <div className="overflow-hidden bg-white border border-slate-100 rounded-2xl shadow-sm transition-shadow duration-300 hover:shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-700 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                   
                    <th className="px-4 py-3 hidden lg:table-cell">Type</th>
                    <th className="px-4 py-3 hidden lg:table-cell">
                      Base Unit
                    </th>
                    <th className="px-4 py-3 hidden sm:table-cell">
                      Stock Balance
                    </th>
                    <th className="px-4 py-3 hidden xl:table-cell">
                      Reorder Level
                    </th>
                   
                    <th className="px-4 py-3 hidden md:table-cell">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {items.map((item) => {
                    const qty = item.stockBalance?.quantityOnHand;
                    const isLowStock =
                      qty !== undefined &&
                      qty !== null &&
                      qty <= parseFloat(item.reorderLevel);

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/60 transition-colors duration-200"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            {item.name}
                            {isLowStock && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                Low
                              </span>
                            )}
                          </div>
                        </td>

                        

                        <td className="px-4 py-3 font-medium hidden lg:table-cell">
                          {item.type.replace("_", " ")}
                        </td>

                        <td className="px-4 py-3 font-medium hidden lg:table-cell">
                          {item.baseUnit?.name || "—"}
                        </td>

                        <td className="px-4 py-3 font-semibold hidden sm:table-cell">
                          {item.stockBalance !== null ? (
                            <span className="flex items-center gap-1.5">
                              {qty} {item.baseUnit?.symbol}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-400 border border-slate-100">
                              No stock yet
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 font-semibold text-slate-600 hidden xl:table-cell">
                          {item.reorderLevel}
                        </td>

                       
                        <td className="px-4 py-3 hidden md:table-cell">
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

                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setDrawerItem(item)}
                            className="px-4 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition duration-150 active:scale-95 cursor-pointer"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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

      {/* CREATE MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 transform scale-100">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-3 right-3 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition duration-200"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
            <CreateItemForm onSuccess={() => setIsAddOpen(false)} />
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editItem && (
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
                Edit Inventory Item
              </h1>
              <p className="text-sm text-slate-500 mt-1.5">
                Update item classifications, pricing, and configurations
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmitUpdate)} className="space-y-5">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Item Name
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
                    Item Type
                  </label>
                  <select
                    {...register("type")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition duration-200"
                  >
                    {ITEM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Menu Category
                  </label>
                  <select
                    {...register("categoryId")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition duration-200"
                  >
                    <option value="">Select category</option>
                    {categoriesData?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Base Unit
                  </label>
                  <select
                    {...register("baseUnitId")}
                    disabled={editItem.stockBalance !== null}
                    className="w-full rounded-xl border border-slate-200 bg-white disabled:bg-slate-100 disabled:text-slate-500 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition duration-200 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {inventoryUnits?.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  {editItem.stockBalance !== null && (
                    <p className="text-slate-400 text-xs mt-1">
                      Unit locked — active stock movement exists.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    min={0}
                    {...register("reorderLevel", { valueAsNumber: true })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition duration-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Purchase Price (Rs.)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    {...register("defaultPurchasePrice", {
                      valueAsNumber: true,
                    })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition duration-200"
                  />
                </div>

                -

                <div className="col-span-2 flex items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-2.5">
                  <input
                    id="editIsActive"
                    type="checkbox"
                    {...register("isActive")}
                    className="h-4 w-4 rounded border-slate-200 text-orange-600 focus:ring-orange-400 cursor-pointer"
                  />
                  <div>
                    <label
                      htmlFor="editIsActive"
                      className="text-sm font-semibold text-slate-700 cursor-pointer"
                    >
                      Active Status
                    </label>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Enable or disable availability for this item.
                    </p>
                  </div>
                </div>

                {!watch("isActive") && (
                  <div className="col-span-2 bg-amber-50 border border-amber-100 text-amber-800 text-xs rounded-xl p-3 font-medium">
                    ⚠️ Warning: Deactivating this item will prevent it from
                    being selected in new purchases, menu recipes, or stock
                    transactions.
                  </div>
                )}
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
                  disabled={adjustLoading}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition shadow flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {adjustLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER */}
      {drawerItem && (
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
            onClick={() => setDrawerItem(null)}
          />

          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-slate-50 shadow-2xl border-l border-slate-100 flex flex-col animate-drawer-slide p-6 sm:p-8">
            <div className="flex items-center justify-between pb-5 border-b border-slate-200 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Manage Item
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-semibold">
                  {drawerItem.name}
                </p>
              </div>
              <button
                onClick={() => setDrawerItem(null)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-2 rounded-full transition duration-200"
                aria-label="Close drawer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1 -mr-1">
              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  General Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">
                      Item Name
                    </p>
                    <p className="text-sm text-slate-800 font-bold mt-0.5">
                      {drawerItem.name}
                    </p>
                  </div>
                 
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">
                      Item Type
                    </p>
                    <p className="text-sm text-slate-800 font-medium mt-0.5">
                      {drawerItem.type.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">
                      Status
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-bold border ${
                        drawerItem.isActive
                          ? "bg-green-50 text-green-700 border-green-100"
                          : "bg-red-50 text-red-700 border-red-100"
                      }`}
                    >
                      {drawerItem.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Classification
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">
                      Menu Category
                    </p>
                    <p className="text-sm text-slate-800 font-semibold mt-0.5">
                      {drawerItem.category?.name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">
                      Base Unit
                    </p>
                    <p className="text-sm text-slate-800 font-semibold mt-0.5">
                      {drawerItem.baseUnit?.name || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Stock & Costing
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">
                      Stock Balance
                    </p>
                    <p className="text-sm text-slate-800 font-bold mt-0.5">
                      {drawerItem.stockBalance !== null
                        ? `${drawerItem.stockBalance?.quantityOnHand} ${drawerItem.baseUnit?.symbol}`
                        : "No stock yet"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">
                      Reorder Level
                    </p>
                    <p className="text-sm text-slate-800 font-bold mt-0.5">
                      {drawerItem.reorderLevel}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">
                      Purchase Price
                    </p>
                    <p className="text-sm text-slate-800 font-mono font-bold mt-0.5">
                      Rs. {drawerItem.defaultPurchasePrice || "—"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400 font-semibold">
                      Expiry Tracking
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-bold border ${
                        drawerItem.trackExpiry
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-slate-50 text-slate-500 border-slate-100"
                      }`}
                    >
                      {drawerItem.trackExpiry ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 space-y-3.5 mt-auto">
              <button
                onClick={() => {
                  handleEditClick(drawerItem);
                  setDrawerItem(null);
                }}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl transition duration-200 shadow-sm flex items-center justify-center cursor-pointer hover:scale-[1.02] active:scale-[0.98] transform"
              >
                Edit Item Details
              </button>

              <button
                onClick={() => {
                  handleDelete(drawerItem);
                  setDrawerItem(null);
                }}
                disabled={deletingId === drawerItem.id}
                className="w-full py-3.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white font-bold text-sm rounded-xl transition duration-200 flex items-center justify-center disabled:opacity-50 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transform"
              >
                Delete Item
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
