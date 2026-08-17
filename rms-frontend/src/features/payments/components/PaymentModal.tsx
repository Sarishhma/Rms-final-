import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useOrderActions } from "@/features/orders";
import { useBilling } from "@/features/billing/hooks/billing.hook";
import { CustomerForm } from "@/features/customer/components/customerForm";
import type { CustomerFormData } from "@/zod/table.schema";
import { PrintManager } from "@/qz-tray/printManager";
import type { NormalizedError } from "@/lib/api/interceptor";
import toast from "react-hot-toast";

type PaymentMode = "CASH" | "CARD" | "QR" | "MIXED";

interface PaymentCheckoutModalProps {
  order: any;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PaymentCheckoutModal({
  order,
  onClose,
  onSuccess,
}: PaymentCheckoutModalProps) {
  const { makePayment } = useOrderActions();
  const { generateBill } = useBilling(order.id);

  const [assignType, setAssignType] = useState<"CUSTOMER" | "STAFF" | null>(
    null,
  );

  const [, setSelectedCustomer] = useState<any>(null);
  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [loading, setLoading] = useState(false);

  const subtotal = useMemo(() => {
    return (
      order?.items?.reduce(
        (acc: number, item: any) => acc + Number(item.lineSubtotal),
        0,
      ) || 0
    );
  }, [order]);

  const grandTotal = useMemo(() => {
    return Math.max(subtotal - discount, 0);
  }, [subtotal, discount]);
  const handleConfirmPrint = async () => {
    try {
      setLoading(true);

      // Generate bill
      const billResponse = await generateBill.mutateAsync({
        orderId: order.id,
        discount,
      });

      const generatedBill = billResponse?.data ?? billResponse;

      if (!generatedBill?.id) {
        throw new Error("Bill generation failed");
      }

      // Print bill using QZ
      await PrintManager.printBill(generatedBill);

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Print failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCheckout = async () => {
    try {
      setLoading(true);

      // Generate bill
      const billResponse = await generateBill.mutateAsync({
        orderId: order.id,
        discount,
      });

      const generatedBill = billResponse?.data ?? billResponse;

      if (!generatedBill?.id) {
        throw new Error("Bill generation failed");
      }

      // Make payment
      await makePayment.mutateAsync({
        billId: generatedBill.id,
        method: paymentMode,
        amount: grandTotal,
        reference: "",
        note: "",
      });

      await PrintManager.printBill(generatedBill);

      onSuccess?.();
      onClose();
    } catch (error) {
      const err = error as NormalizedError;

      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  const [customerForm, setCustomerForm] = useState<CustomerFormData>({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });

  const [errors] = useState<Partial<Record<keyof CustomerFormData, string>>>(
    {},
  );
  const handleFieldChange = (field: keyof CustomerFormData, value: string) => {
    setCustomerForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  return (
    <div className="bg-white rounded-xl p-6 h-full overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Checkout {order?.table?.name}</h2>

        <button
          onClick={onClose}
          className="px-3 py-2 rounded-lg hover:bg-gray-100"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT */}
        <div className="col-span-8 space-y-6">
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="text-sm">
                <tr className="text-sm">
                  <th className="p-3 text-left border-r">S.N</th>
                  <th className="p-3 text-left border-r">Item</th>
                  <th className="p-3 text-left border-r">Qty</th>
                  <th className="p-3 text-left border-r">Rate</th>
                  <th className="p-3 text-left border-r">Total</th>
                </tr>
              </thead>

              <tbody>
                {order?.items?.map((item: any, index: number) => (
                  <tr key={item.id} className="border-t ">
                    <td className="p-3 border-r text-sm">{index + 1}</td>
                    <td className="p-3 border-r text-sm">
                      {item.menuItem?.name}
                    </td>
                    <td className="p-3 border-r text-sm">{item.quantity}</td>
                    <td className="p-3 border-r text-sm">
                      Rs {item.unitPrice}
                    </td>
                    <td className="p-3 text-sm">Rs {item.lineSubtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-4 justify-between">
            <div className=" flex-1 border rounded-xl p-5 mr-4 space-y-4">
              <h2 className="font-semibold text-sm">Assign To</h2>

              {/* Selection Cards */}
              <div className="flex  text-xs gap-3">
                {[
                  {
                    key: "CUSTOMER",
                    title: "Customer",
                  },
                  {
                    key: "STAFF",
                    title: "Staff",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() =>
                      setAssignType(item.key as "CUSTOMER" | "STAFF")
                    }
                    className={`
          cursor-pointer rounded-xl border py-1 px-3
          transition-all duration-300 ease-in-out
          ${
            assignType === item.key
              ? "border-green-200 text-white bg-green-500 shadow-md scale-[1.02]"
              : "border-green-200 hover:border-green-400 hover:shadow-sm"
          }
        `}
                  >
                    <h3 className="font-medium text-sm">{item.title}</h3>
                  </div>
                ))}
              </div>

              {/* Animated Content */}
              <div
                className={`
      overflow-hidden transition-all duration-300
      ${assignType ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"}
    `}
              >
                {/* CUSTOMER */}
                {assignType === "CUSTOMER" && (
                  <div className="space-y-3 pt-3 animate-in fade-in slide-in-from-top-2 duration-300 px-2">
                    <input
                      placeholder="Search customer..."
                      className=" border rounded-lg px-3 py-2  text-sm"
                    />

                    <button
                      onClick={() => setOpenCustomerModal(true)}
                      className="w-full rounded-lg border border-dashed py-3 text-sm font-medium hover:bg-gray-50 transition"
                    >
                      + Add New Customer
                    </button>
                  </div>
                )}

                {/* STAFF */}
                {assignType === "STAFF" && (
                  <div className="pt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <input
                      placeholder="Search staff..."
                      className="w-full border rounded-lg px-3 py-3 text-sm"
                    />
                  </div>
                )}

                {openCustomerModal && (
                  <>
                    <div
                      className="fixed inset-0 bg-black/40 z-[100]"
                      onClick={() => setOpenCustomerModal(false)}
                    />

                    <div className="fixed inset-0 z-[101] flex items-center justify-center">
                      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="font-semibold text-lg">
                            Create Customer
                          </h2>

                          <button onClick={() => setOpenCustomerModal(false)}>
                            ✕
                          </button>
                        </div>

                        <CustomerForm
                          formData={customerForm}
                          onFieldChange={handleFieldChange}
                          errors={errors}
                          onSuccess={(customer) => {
                            setSelectedCustomer(customer);
                            setOpenCustomerModal(false);
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 border rounded-xl p-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>Rs {subtotal}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>Discount</span>

                <input
                  type="number"
                  min={0}
                  max={subtotal}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="border rounded-lg px-3 py-1 w-20"
                />
              </div>

              <div className="flex justify-between text-base font-bold">
                <span>Total Amount</span>
                <span>Rs {grandTotal}</span>
              </div>
            </div>
          </div>

          <div className="border rounded-xl p-5">
            <h3 className="font-semibold mb-4">Payment Mode</h3>

            <div className="grid grid-cols-4 gap-3">
              {["CASH", "CARD", "QR", "MIXED"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode as PaymentMode)}
                  className={`p-3 rounded-xl border ${
                    paymentMode === mode
                      ? "bg-red-100 border-red-400"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="col-span-4 border rounded-xl p-5 space-y-4">
          <h2 className="text-xl font-bold text-center uppercase">
            ESTIMATE receipt
          </h2>

          <div>Table: {order?.table?.name}</div>
          <div className="text-sm">Order No: {order?.orderNumber}</div>

          <hr />

          {order?.items?.map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.menuItem.name}</span>
              <span>Rs {item.lineSubtotal}</span>
            </div>
          ))}

          <hr />

          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>Rs {subtotal}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Discount</span>
            <span>Rs {discount}</span>
          </div>

          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span>Rs {grandTotal}</span>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={handleConfirmPrint}
            >
              Confirm & Print
            </Button>

            <Button
              className="w-full bg-green-600 text-white"
              disabled={loading}
              onClick={handleConfirmCheckout}
            >
              Confirm Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
