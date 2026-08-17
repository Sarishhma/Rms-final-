import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Printer, X } from "lucide-react";
import type { Order } from "@/features/orders/types";
import { PrintManager } from "@/qz-tray/printManager";

interface Props {
  order: Order;
  onClose: () => void;
}

export default function PrintKotModal({ order, onClose }: Props) {
  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    try {
      setPrinting(true);

      await PrintManager.printKOT(order.kitchenPrinterJobs);

      onClose();
    } catch (err) {
      console.error(err);
      alert("Unable to print KOT");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{
            scale: 0.95,
            opacity: 0,
          }}
          animate={{
            scale: 1,
            opacity: 1,
          }}
          exit={{
            scale: 0.95,
            opacity: 0,
          }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}

          <div className="border-b px-5 py-4 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-lg">Kitchen Order Ticket</h2>

              <p className="text-xs text-gray-500">Preview before printing</p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>

          {/* Preview */}

          <div className="bg-gray-100 p-6 overflow-y-auto max-h-[70vh]">
            <div className="bg-white w-[300px] mx-auto shadow-lg rounded-md border">
              <div className="font-mono text-[11px] p-4">
                <div className="text-center">
                  <h3 className="font-bold text-sm">KITCHEN ORDER TICKET</h3>

                  <p className="text-[10px] mt-1">{order.orderNumber}</p>
                </div>

                <div className="border-t border-dashed my-3" />

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Table</span>

                    <span className="font-bold">
                      {order.table?.name ?? "-"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Channel</span>

                    <span>{order.channel}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Guest</span>

                    <span>{order.guestCount ?? "-"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Customer</span>

                    <span>{order.customer?.name ?? "Walk-In"}</span>
                  </div>
                </div>

                <div className="border-t border-dashed my-3" />

                <div className="flex justify-between font-bold mb-2">
                  <span>ITEM</span>

                  <span>QTY</span>
                </div>

                {order.items.map((item) => (
                  <div key={item.id} className="mb-2">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <div>
                          {item.menuItem.name}

                          {item.variant && (
                            <span className="text-gray-500">
                              {" "}
                              ({item.variant.name})
                            </span>
                          )}
                        </div>

                        {item.specialInstructions && (
                          <div className="text-[9px] italic text-gray-500">
                            Note: {item.specialInstructions}
                          </div>
                        )}
                      </div>

                      <div className="font-bold">{item.quantity}</div>
                    </div>
                  </div>
                ))}

                {order.specialInstructions && (
                  <>
                    <div className="border-t border-dashed my-3" />

                    <div>
                      <div className="font-bold mb-1">Order Notes</div>

                      <div className="italic">{order.specialInstructions}</div>
                    </div>
                  </>
                )}

                <div className="border-t border-dashed my-3" />

                <div className="text-center">Kitchen Copy</div>
              </div>
            </div>
          </div>

          {/* Footer */}

          <div className="border-t px-5 py-4 flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2 rounded-lg border">
              Close
            </button>

            <button
              disabled={printing}
              onClick={handlePrint}
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-5 py-2 flex items-center gap-2 disabled:opacity-50"
            >
              <Printer size={16} />

              {printing ? "Printing..." : "Print"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
