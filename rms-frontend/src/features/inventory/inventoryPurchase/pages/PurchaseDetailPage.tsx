import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, Calendar, FileText, User, CheckCircle, AlertOctagon, Info } from "lucide-react";
import { useConfirm } from "@/providers/ConfirmProvider";
import { useInventoryPurchaseDetail, usePostInventoryPurchase } from "../hooks/useInventoryPurchase";
import { PurchaseStatus } from "../../types/inventory.type";

export default function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const confirm = useConfirm();

  // Queries
  const { data: purchase, isLoading, isError, refetch } = useInventoryPurchaseDetail(id);
  const { mutate: postPurchase, isPending: isPosting } = usePostInventoryPurchase();
  const handlePost = async () => {
    if (!purchase?.id) return;

    const confirmed = await confirm({
      title: "Post Purchase Document",
      description: `WARNING: This action is IRREVERSIBLE. Posting purchase "${purchase.purchaseNumber}" will update current inventory stock levels immediately. Do you wish to proceed?`,
      confirmText: "Post to Stock",
      cancelText: "Cancel",
      type: "warning",
    });

    if (!confirmed) return;

    postPurchase(purchase.id, {
      onSuccess: () => {
        toast.success("Purchase document posted and stock updated successfully");
        refetch(); // Reload read-only view with POSTED status
      },
      onError: (err: any) => {
        const errorMsg = err?.response?.data?.message || err?.message || "Failed to post purchase";
        toast.error(errorMsg);
      },
    });
  };

  const handleEditDocument = () => {
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (isError || !purchase) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center">
        <AlertOctagon className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Purchase document not found</h2>
        <p className="text-sm text-slate-550 mt-1 mb-6">
          The requested document could not be retrieved from the server.
        </p>
        <Link
          to="/admin/inventory/purchases"
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-bold text-sm rounded-xl transition shadow-3xs"
        >
          Return to List
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/inventory/purchases"
              className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Purchase Detail
                <span className="font-mono text-base font-normal text-slate-400">
                  ({purchase.purchaseNumber})
                </span>
              </h1>
              <p className="text-xs text-slate-550 mt-0.5">
                Audit procurement quantities, converted inventory items, and batch expiry records.
              </p>
            </div>
          </div>
        </div>

        {/* Status Banners */}
        {purchase.status === PurchaseStatus.POSTED && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-4 flex items-center gap-3 shadow-3xs">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            <div className="text-sm">
              <span className="font-bold text-green-950">Posted Document:</span> This purchase invoice has been posted to inventory. Stock levels have been adjusted and this document is now read-only.
            </div>
          </div>
        )}

        {purchase.status === PurchaseStatus.CANCELLED && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 flex items-center gap-3 shadow-3xs">
            <AlertOctagon className="h-5 w-5 text-red-600 shrink-0" />
            <div className="text-sm">
              <span className="font-bold text-red-950">Cancelled Document:</span> This purchase document has been cancelled. It has no effect on inventory stock counts.
            </div>
          </div>
        )}

        {purchase.status === PurchaseStatus.DRAFT && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl p-4 flex items-center gap-3 shadow-3xs">
            <Info className="h-5 w-5 text-blue-600 shrink-0" />
            <div className="text-sm">
              <span className="font-bold text-blue-950">Draft Document:</span> This purchase invoice is in draft status. Quantities and expiry records will not affect active stock counts until posted.
            </div>
          </div>
        )}

        {/* Info Header Card */}
        <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-sm space-y-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">
            Invoice Header Summary
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Supplier Details
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {purchase.supplier?.name || "No supplier linked"}
                </span>
                {purchase.supplier && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Contact: ({purchase.supplier.phone})
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Purchase Date
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {new Date(purchase.purchaseDate).toLocaleDateString(undefined, {
                    dateStyle: "long",
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Invoice Number
                </span>
                <span className="text-sm font-bold text-slate-800 font-mono">
                  {purchase.supplierInvoiceNumber || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">
            Invoice Procurement Lines
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-700 uppercase text-3xs font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Item Name</th>
                  <th className="px-4 py-3">Base Unit</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Unit Cost</th>
                  <th className="px-4 py-3">Line Total</th>
                  <th className="px-4 py-3">Batch Number</th>
                  <th className="px-4 py-3">Manufactured</th>
                  <th className="px-4 py-3">Expiry Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {purchase.items?.map((line) => (
                  <tr key={line.id}>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {line.item?.name || "Unknown item"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {line.unit?.name || "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {line.quantity}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-850">
                      Rs. {Number(line.unitCost).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      Rs. {Number(line.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                      {line.batchNumber || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {line.manufacturedDate ? new Date(line.manufacturedDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {line.expiryDate ? new Date(line.expiryDate).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div className="flex justify-end pt-4">
            <div className="w-80 space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">Rs. {Number(purchase.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Discount:</span>
                <span className="font-semibold text-red-600">- Rs. {Number(purchase.discountAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>VAT ({purchase.vatRate}%):</span>
                <span className="font-semibold text-slate-800">Rs. {Number(purchase.vatAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-extrabold text-slate-900">
                <span>Grand Total:</span>
                <span className="text-orange-600">Rs. {Number(purchase.grandTotal).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Note remarks block */}
        {purchase.note && (
          <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Document Remarks
            </h3>
            <p className="text-sm text-slate-650 italic">
              "{purchase.note}"
            </p>
          </div>
        )}

        {/* Action Triggers */}
        {purchase.status === PurchaseStatus.DRAFT && (
          <div className="flex justify-end gap-3.5 bg-white border border-slate-150 rounded-2xl p-4 shadow-3xs">
            <button
              onClick={handleEditDocument}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-orange-600 hover:text-red-700 font-bold text-sm rounded-xl transition flex items-center justify-center cursor-pointer"
            >
              Edit Purchase
            </button>
            <button
              onClick={handlePost}
              disabled={isPosting}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow transition flex items-center justify-center disabled:opacity-50 cursor-pointer"
            >
              {isPosting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Purchase"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
