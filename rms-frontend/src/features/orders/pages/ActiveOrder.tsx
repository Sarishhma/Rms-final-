import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Coffee,
  Check,
} from "@/components/ui/Icons";
import { OrderStatus, OrderChannel } from "@/features/orders/types";
import { useOrder, useCancelOrder } from "@/features/orders";
import type { Order, OrderItem } from "@/features/orders/types";
import { useState } from "react";
import { LoadingSpinner } from "@/features/shared/LoadingSpinner";
import { useSearchParams } from "react-router-dom";
import { Edit, Printer, Users } from "lucide-react";
import EditOrderModal from "@/features/orders/components/EditOrderModal";
import { motion, AnimatePresence } from "framer-motion";
import PrintKotModal from "@/features/kot/component/PrintKotModal";
export default function ActiveOrder() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search")?.toLowerCase() ?? "";
  const { data, isLoading } = useOrder({ page: 1 });

  const orders = data?.data ?? [];
  const { mutateAsync: cancelOrder, isPending: isCancelling } =
    useCancelOrder();

  const [cancelData, setCancelData] = useState<null | {
    orderId: string;
    tableId: string;
  }>(null);

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [reason, setReason] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  const handlePrint = (order: Order) => {
    setPrintOrder(order);
  };
  const activeOrders = (orders ?? [])
    .filter((o) => o.status === OrderStatus.CONFIRMED)
    .filter((order) => {
      if (!search.trim()) return true;

      const q = search.toLowerCase();

      return (
        order.table?.name?.toLowerCase().includes(q) ||
        order.customer?.name?.toLowerCase().includes(q) ||
        order.orderNumber?.toLowerCase().includes(q) ||
        order.channel?.toLowerCase().includes(q) ||
        order.items?.some((item: any) =>
          item.menuItem?.name?.toLowerCase().includes(q),
        )
      );
    });

  const handleCancel = async () => {
    if (!cancelData || !reason.trim()) {
      console.error("Please enter a reason for cancellation");
      return;
    }

    await cancelOrder({
      id: cancelData.orderId,
      reason,
      tableId: cancelData.tableId,
    });

    setCancelData(null);
    setReason("");
  };

  const handleConfirm = async (orderId: string) => {
    setConfirmId(orderId);
    try {
    } catch (error) {
    } finally {
      setConfirmId(null);
    }
  };

  const statusConfig = {
    [OrderStatus.DRAFT]: {
      label: "Draft",
      bg: "bg-gray-100",
      text: "text-gray-600",
      icon: Clock,
      border: "border-gray-200",
    },
    [OrderStatus.CONFIRMED]: {
      label: "Confirmed",
      bg: "bg-blue-100",
      text: "text-blue-700",
      icon: CheckCircle,
      border: "border-blue-200",
    },
    [OrderStatus.CANCELLED]: {
      label: "Cancelled",
      icon: XCircle,
      bg: "bg-red-100",
      text: "text-red-700",
      border: "border-blue-200",
    },
    [OrderStatus.VOIDED]: {
      label: "Voided",
      bg: "bg-gray-50",
      text: "text-gray-500",
      icon: Clock,
      border: "border-gray-200",
    },
    [OrderStatus.COMPLETED]: {
      label: "Completed",
      bg: "bg-green-50",
      text: "text-green-600",
      icon: Check,
      border: "border-green-200",
    },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <LoadingSpinner message="Loading active orders..." size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/20 via-white to-amber-50/20">
      <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
        {/* Header Section */}
        <div className="mb-8 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-l-4 border-orange-500 pl-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Active Orders
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Manage your kitchen workflow in real-time
              </p>
            </div>
            <div className="bg-white/90 border border-gray-200/60 rounded-full px-4 py-1.5 shadow-sm shrink-0 self-start sm:self-auto">
              <span className="text-sm font-semibold text-gray-600">
                📋 {activeOrders.length} Active{" "}
                {activeOrders.length === 1 ? "Order" : "Orders"}
              </span>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {activeOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="bg-gradient-to-br from-orange-100 to-amber-100 rounded-full p-6 mb-4 shadow-md">
              <Coffee className="w-12 h-12 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              All Caught Up! 🎉
            </h3>
            <p className="text-gray-500 text-sm text-center max-w-sm">
              No active orders at the moment. New orders will appear here once
              created.
            </p>
          </div>
        ) : (
          /* Orders Grid - 2 columns on mobile/tablet, 3 on desktop */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeOrders.map((order) => {
              const StatusIcon = statusConfig[order.status]?.icon || Clock;
              const config = statusConfig[order.status];

              return (
                <div
                  key={order.id}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200/60 hover:border-orange-200 flex flex-col justify-between"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-gray-50/55 to-white p-4 border-b border-gray-100">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                            #{order.orderNumber?.slice(-6) || "N/A"}
                          </span>
                        </div>

                        <div className="flex flex-col items-center gap-1.5 my-2">
                          <span
                            className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              order.channel === OrderChannel.DINE_IN
                                ? "bg-blue-50 text-blue-700 border border-blue-100"
                                : order.channel === OrderChannel.TAKE_AWAY
                                  ? "bg-orange-50 text-orange-700 border border-orange-100"
                                  : "bg-purple-50 text-purple-700 border border-purple-100"
                            }`}
                          >
                            {order.channel?.replace("_", " ")}
                          </span>

                          <h3
                            className="text-2xl font-extrabold text-center w-full leading-tight"
                            style={{
                              fontFamily: "'Dancing Script', cursive",
                              color: "#ea580c",
                            }}
                          >
                            {order.channel === OrderChannel.DINE_IN &&
                            order.table
                              ? `Table ${order.table.name}`
                              : order.customer
                                ? order.customer.name
                                : "Walk-In"}
                          </h3>

                          {order.channel !== OrderChannel.DINE_IN &&
                            order.customer && (
                              <p className="text-[10px] text-gray-500 font-mono">
                                📞 {order.customer.phone}
                              </p>
                            )}
                        </div>

                        {order.channel === OrderChannel.DINE_IN &&
                        order.guestCount ? (
                          <div className="flex items-center justify-center gap-1.5 mt-1">
                            <Users size={14} className="text-gray-500" />
                            <span className="text-xs font-medium text-gray-600">
                              {order.guestCount}{" "}
                              {order.guestCount === 1 ? "guest" : "guests"}
                            </span>
                          </div>
                        ) : null}

                        {/* Order-level special instructions */}
                        {order.specialInstructions && (
                          <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                            <div className="flex items-start gap-1.5">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-amber-500 shrink-0 mt-0.5"
                              >
                                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                                <path d="M12 16v-4" />
                                <path d="M12 8h.01" />
                              </svg>
                              <span className="text-xs text-amber-700 italic leading-tight">
                                {order.specialInstructions}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${config.bg} ${config.text}`}
                        >
                          <StatusIcon size={10} />
                          {config.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body - Items */}
                  <div className="p-4 space-y-2 flex-1 max-h-56 overflow-y-auto">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-1.5 border-b border-gray-100">
                      <span>Item</span>
                      <span className="shrink-0 pl-2">Qty</span>
                    </div>

                    {(order.items ?? []).map((item: OrderItem, idx: number) => (
                      <div
                        key={idx}
                        className="flex flex-col py-2 hover:bg-orange-50/30 rounded-lg transition-colors px-1"
                      >
                        {/* Main row: item name, variant, quantity */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-800">
                              {item.menuItem.name}
                            </span>
                            {item.variant && (
                              <span className="text-[11px] text-gray-400 ml-1">
                                ({item.variant.name})
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-gray-600 shrink-0">
                            ×{item.quantity}
                          </span>
                        </div>

                        {/* Item-level special instructions */}
                        {item.specialInstructions && (
                          <div className="flex items-start gap-1 mt-1 pl-1">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-amber-400 shrink-0 mt-[2px]"
                            >
                              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                              <path d="M12 16v-4" />
                              <path d="M12 8h.01" />
                            </svg>
                            <span className="text-[10px] text-gray-400 italic leading-tight">
                              Note: {item.specialInstructions}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Card Footer - Actions */}
                  <div className="bg-gray-50/50 p-4 border-t border-gray-100">
                    {order.status === OrderStatus.DRAFT && (
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingOrder(order)}
                            className="flex-1 bg-white border border-orange-200 hover:bg-orange-50 text-orange-600 font-bold py-2 rounded-xl transition text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Edit size={14} />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() =>
                              setCancelData({
                                orderId: order.id,
                                tableId: order.table?.id ?? "",
                              })
                            }
                            className="flex-1 bg-white border border-red-200 hover:bg-red-50 text-red-600 font-bold py-2 rounded-xl transition text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <XCircle size={14} />
                            <span>Cancel</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleConfirm(order.id)}
                          disabled={confirmId === order.id}
                          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-2 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm text-sm cursor-pointer"
                        >
                          {confirmId === order.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Confirming...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle size={14} />
                              <span>Confirm Order</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {order.status === OrderStatus.CONFIRMED && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingOrder(order)}
                          className="flex-1 bg-white border border-orange-200 hover:bg-orange-50 text-orange-600 font-bold py-2 rounded-xl transition text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handlePrint(order)}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm text-sm cursor-pointer"
                        >
                          <Printer size={14} />
                          <span>Print</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Modal - Improved Design */}
      {cancelData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gradient-to-r from-red-500 to-rose-500 p-5 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full p-2">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Cancel Order</h2>
                  <p className="text-red-100 text-sm">
                    Please provide a reason
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cancellation Reason
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                rows={4}
                placeholder="e.g., Customer changed mind, Item unavailable, etc..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                autoFocus
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setCancelData(null);
                    setReason("");
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-all"
                >
                  Close
                </button>
                <button
                  onClick={handleCancel}
                  disabled={!reason.trim() || isCancelling}
                  className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCancelling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <XCircle size={18} />
                      Confirm Cancel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <AnimatePresence>
        {editingOrder && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingOrder(null)}
            />
            <motion.div
              className="fixed left-4 right-4 top-4 bottom-4 rounded-2xl bg-white z-50 shadow-2xl"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <EditOrderModal
                order={editingOrder}
                onClose={() => setEditingOrder(null)}
                onPrintRequested={setPrintOrder}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {printOrder && (
        <PrintKotModal order={printOrder} onClose={() => setPrintOrder(null)} />
      )}
    </div>
  );
}
