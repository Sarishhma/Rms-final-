import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useConfirm } from "@/providers/ConfirmProvider";
import {
  useInventoryPurchases,
  usePostInventoryPurchase,
} from "../hooks/useInventoryPurchase";
import { useInventorySupplier } from "../../inventorySupplier/hooks/useInventorySupplier";
import { PurchaseStatus } from "../../types/inventory.type";

export default function AllPurchasesPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [supplierIdFilter, setSupplierIdFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [postingId, setPostingId] = useState<string | null>(null);

  const navigate = useNavigate();
  const confirm = useConfirm();

  const {
    data: responseData,
    isLoading,
    refetch,
  } = useInventoryPurchases({
    page,
    limit,
    search: search || undefined,
    status: (statusFilter as PurchaseStatus) || undefined,
    supplierId: supplierIdFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const { mutate: postPurchase, isPending: isPosting } =
    usePostInventoryPurchase();
  const { inventorySuppliers } = useInventorySupplier();

  const purchases = responseData?.data ?? [];
  const meta = responseData?.meta;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setSupplierIdFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const getStatusBadgeClass = (status: PurchaseStatus) => {
    switch (status) {
      case PurchaseStatus.DRAFT:
        return "bg-blue-50 text-blue-700 border-blue-100";
      case PurchaseStatus.POSTED:
        return "bg-green-50 text-green-700 border-green-100";
      case PurchaseStatus.CANCELLED:
        return "bg-red-50 text-red-700 border-red-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const handlePostPurchase = async (purchase: {
    id: string;
    purchaseNumber: string;
  }) => {
    const confirmed = await confirm({
      title: "Post Purchase Document",
      description: `WARNING: This action is IRREVERSIBLE. Posting purchase "${purchase.purchaseNumber}" will update current inventory stock levels immediately. Do you wish to proceed?`,
      confirmText: "Post to Stock",
      cancelText: "Review Before Posting",
      type: "warning",
    });

    if (!confirmed) {
      navigate(`/admin/inventory/purchases/${purchase.id}`);
      return;
    }

    setPostingId(purchase.id);
    postPurchase(purchase.id, {
      onSuccess: () => {
        toast.success(
          `Purchase ${purchase.purchaseNumber} posted — inventory stock updated.`,
        );
        setPostingId(null);
        refetch();
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message ??
          err?.message ??
          "Failed to post purchase.";
        toast.error(msg);
        setPostingId(null);
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Inventory Purchases
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1">
              Record procurement invoices, track supplier deliveries, and post
              drafts to stock.
            </p>
          </div>

          <Link
            to="/admin/inventory/purchases/create"
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-semibold transition duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Purchase
          </Link>
        </div>

        {/* Filters - matching the items page style */}
        <div className="flex flex-nowrap items-center gap-4">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search purchase / invoice..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl bg-white/80 outline-none focus:ring-2 focus:ring-orange-500 transition duration-200 shadow-sm text-sm"
            />
          </div>

          <select
            value={supplierIdFilter}
            onChange={(e) => {
              setSupplierIdFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-48 px-5 py-3 border border-slate-200 rounded-2xl bg-white/80 outline-none focus:ring-2 focus:ring-orange-500 transition duration-200 shadow-sm text-sm"
          >
            <option value="">All Suppliers</option>
            {inventorySuppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-48 px-5 py-3 border border-slate-200 rounded-2xl bg-white/80 outline-none focus:ring-2 focus:ring-orange-500 transition duration-200 shadow-sm text-sm"
          >
            <option value="">All Statuses</option>
            <option value={PurchaseStatus.DRAFT}>Draft</option>
            <option value={PurchaseStatus.POSTED}>Posted</option>
            <option value={PurchaseStatus.CANCELLED}>Cancelled</option>
          </select>

          <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
            <div className="relative w-40">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-4 pr-4 py-3 border border-slate-200 rounded-2xl bg-white/80 outline-none focus:ring-2 focus:ring-orange-500 transition duration-200 shadow-sm text-sm cursor-pointer text-slate-700"
              />
            </div>
            <span className="text-slate-400 text-sm font-medium">—</span>
            <div className="relative w-40">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-4 pr-4 py-3 border border-slate-200 rounded-2xl bg-white/80 outline-none focus:ring-2 focus:ring-orange-500 transition duration-200 shadow-sm text-sm cursor-pointer text-slate-700"
              />
            </div>
          </div>

          {(search ||
            statusFilter ||
            supplierIdFilter ||
            dateFrom ||
            dateTo) && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1 px-3 py-2"
            >
              <X size={14} />
              Clear Filters
            </button>
          )}
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500" />
          </div>
        ) : purchases.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
            <p className="text-slate-400 text-sm">No purchases found.</p>
          </div>
        ) : (
          <div className="overflow-hidden bg-white border border-slate-100 rounded-2xl shadow-sm transition-shadow duration-300 hover:shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-700 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Purchase Number</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Grand Total</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {purchases.map((purchase) => (
                    <tr
                      key={purchase.id}
                      className="hover:bg-slate-50/60 transition-colors duration-200"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {purchase.purchaseNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600">
                        {purchase.supplier?.name || "No supplier linked"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(purchase.purchaseDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-sm ${getStatusBadgeClass(
                            purchase.status,
                          )}`}
                        >
                          {purchase.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        Rs. {Number(purchase.grandTotal).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/inventory/purchases/${purchase.id}`}
                            className="px-4 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition duration-150 cursor-pointer whitespace-nowrap"
                          >
                            View Details
                          </Link>
                          {purchase.status === PurchaseStatus.DRAFT && (
                            <button
                              onClick={() =>
                                handlePostPurchase({
                                  id: purchase.id,
                                  purchaseNumber: purchase.purchaseNumber,
                                })
                              }
                              disabled={postingId === purchase.id && isPosting}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs rounded-xl transition duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-60"
                            >
                              {postingId === purchase.id && isPosting ? (
                                <>
                                  <Loader2 size={13} className="animate-spin" />
                                  Posting...
                                </>
                              ) : (
                                "Post Purchase"
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
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
    </div>
  );
}
