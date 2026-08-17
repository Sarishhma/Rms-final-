// src/features/inventory/purchases/pages/CreatePurchasePage.tsx
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { PurchaseForm, type PurchaseFormValues } from "./PurchaseForm";
import { useCreateInventoryPurchase } from "../hooks/useInventoryPurchase";
import type { CreateInventoryPurchasePayload } from "../../types/inventory.type";

export default function CreatePurchasePage() {
  const navigate = useNavigate();
  const { mutate: createPurchase, isPending } = useCreateInventoryPurchase();

  const handleSubmit = (payload: CreateInventoryPurchasePayload) => {
    createPurchase(payload, {
      onSuccess: (data: any) => {
        toast.success("Purchase draft created successfully");
        navigate(`/admin/inventory/purchases/${data.id}`);
      },
      onError: (err: any) => {
        let msg = err?.response?.data?.message || err?.message;
        if (
          msg.toLowerCase().includes("conversion") ||
          msg.toLowerCase().includes("unit")
        ) {
          msg = `Please ensure that every line item has a valid unit conversion defined. You can set up conversions from the Unit settings page.`;
        } else {
          msg = msg || "Failed to create draft";
        }
        toast.error(msg);
      },
    });
  };

  const initialValues: PurchaseFormValues = {
    supplierId: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    invoiceNumber: "",
    discountAmount: 0,
    discountPercentage: 0,
    vatRate: 13,
    note: "",
    lineItems: [
      {
        key: crypto.randomUUID(),
        itemId: "",
        unitId: "",
        quantity: "" as const,
        unitCost: "" as const,
        batchNumber: "",
        manufacturedDate: "",
        expiryDate: "",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/admin/inventory/purchases"
            className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Create Purchase
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Log supplier invoice items as a draft. Review warnings before
              saving.
            </p>
          </div>
        </div>

        <PurchaseForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          isSubmitting={isPending}
          submitLabel="Save as Draft"
        />
      </div>
    </div>
  );
}
