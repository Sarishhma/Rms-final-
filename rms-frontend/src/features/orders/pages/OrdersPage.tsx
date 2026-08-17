import { Search, Filter, Plus, Printer } from "lucide-react";
import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrder } from "@/features/orders/hooks/useGetOrders";
import { useNavigate } from "react-router-dom";
import {
  OrderStatus,
  type Order,
  type OrderChannel,
} from "@/features/orders/types";
import EditOrderModal from "@/features/orders/components/EditOrderModal";
import { formatTimeAgo } from "@/utils/date";
import PaymentCheckoutModal from "@/features/payments/components/PaymentModal";
import PrintKotModal from "@/features/kot/component/PrintKotModal";


function OrderCard({
  order,
  hasBill,
  onClick,
  onEdit,
}: {
  order: any;
  hasBill: boolean;
  onClick: () => void;
  onEdit: (order: Order) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);

  const handlePrint = (_order: any) => {
    // TODO: implement print logic
  };

  const actions = [
    {
      label: "Add",
      icon: <Plus size={18} />,
      onClick: () => onEdit(order),
    },
    {
      label: "Print",
      icon: <Printer size={18} />,
      onClick: () => handlePrint(order),
    },
  ];

  return (
    <div
      className={`relative rounded-2xl border-2 overflow-hidden cursor-pointer transition-colors duration-200 ${
        hasBill
          ? "border-yellow-400 bg-amber-50" // bill exists → warm tint
          : "border-slate-200 bg-white" // no bill → plain white
      }`}
      style={{ minHeight: 260 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── DEFAULT FACE ── */}
      <div className="h-full flex flex-col">
        {/* Table name */}
        <div className="flex justify-between items-start px-4 pt-3 pb-1">
          <h2 className="text-lg font-bold text-slate-800">
            {order.table?.name || order.customer?.name || "-"}
          </h2>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              order.channel === "DINE_IN"
                ? "bg-blue-50 text-blue-600"
                : order.channel === "TAKEAWAY"
                  ? "bg-purple-50 text-purple-600"
                  : "bg-orange-50 text-orange-600"
            }`}
          >
            {order.channel?.replace("_", " ")}
          </span>
        </div>

        {/* Time */}
        <div className="flex justify-end px-4 py-1">
          <span
            className={`font-medium text-xs ${
              hasBill ? "text-yellow-500" : "text-slate-400"
            }`}
          >
            {formatTimeAgo(order.createdAt)}
          </span>
        </div>

        <div className="border-t mx-4 my-1" />

        {/* Items */}
        <div className="px-4 py-2 flex-1 space-y-1">
          {order.items?.slice(0, 5).map((item: any, i: number) => (
            <div
              key={i}
              className="flex justify-between text-sm text-slate-600"
            >
              <span className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full inline-block flex-shrink-0 ${
                    hasBill ? "bg-yellow-400" : "bg-slate-300"
                  }`}
                />
                <span className="truncate">{item.menuItem?.name}</span>
              </span>
              <span className="ml-2 flex-shrink-0">× {item.quantity}</span>
            </div>
          ))}
          {order.items?.length > 5 && (
            <p className="text-xs text-slate-400 pl-4">
              +{order.items.length - 5} more
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t mx-4" />
        <div className="flex justify-between px-4 py-3 text-sm text-slate-600">
          <span>Dishes: {order.items?.length ?? 0}</span>
          <span className="font-semibold text-slate-800">
            NPR {order.grandTotal}
          </span>
        </div>
      </div>

      {/* ── HOVER OVERLAY ── */}
      <div
        className={`absolute inset-0 rounded-2xl flex flex-col justify-between p-5 transition-opacity duration-200 ${
          hasBill ? "bg-amber-50" : "bg-slate-50"
        } ${hovered ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        {/* Receipt badge */}
        <div className="flex justify-between items-center">
          {hasBill ? (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
              {order.rcpt?.rcptNumber}
            </span>
          ) : (
            <span />
          )}
          <span className="text-slate-400 text-xl leading-none">⋮</span>
        </div>

        {/* Amount */}
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-800">
            NPR {order.grandTotal}
          </p>
          {hasBill && (
            <p className="text-xs text-yellow-600 mt-1">
              Due: NPR {order.rcpt?.due}
            </p>
          )}
          <p className="text-sm text-slate-400 mt-1">
            Click to view full order details.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-3">
          {actions.map(({ icon, label, onClick: actionClick }) => (
            <button
              key={label}
              onClick={(e) => {
                e.stopPropagation();
                actionClick();
              }}
              className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-yellow-400 hover:text-yellow-500 transition"
              title={label}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Checkout */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenPaymentModal(true);
          }}
          className="w-full py-3 rounded-xl border-2 border-green-500 text-green-600 font-semibold hover:bg-green-50 transition"
        >
          Checkout
        </button>
      </div>

      {/* Transparent click layer for default face */}
      {!hovered && <div className="absolute inset-0" onClick={onClick} />}
      {openPaymentModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setOpenPaymentModal(false)}
          />

          {/* Modal */}
          <div className="fixed inset-4 z-50 rounded-2xl bg-white shadow-2xl overflow-auto">
            <PaymentCheckoutModal
              order={order}
              onClose={() => setOpenPaymentModal(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   ORDERS PAGE
───────────────────────────────────────── */
export default function OrdersPage() {
  const navigate = useNavigate();
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  const [filters, setFilters] = useState<{
    page: number;
    limit: number;
    status?: OrderStatus;
    channel?: OrderChannel;
    tableId?: string;
    tableName?: string;
    customerId?: string;
  }>({
    page: 1,
    limit: 20,
    status: OrderStatus.CONFIRMED,
  });

  const { data, isLoading, error } = useOrder(filters);
  const orders = data?.data ?? [];
  const meta = data?.meta;

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        setFilters((prev) => ({
          ...prev,
          page: 1,
          tableName: value.trim() || undefined,
        }));
      }, 500);
    },
    [],
  );

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading orders...
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error.message}
      </div>
    );

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Orders</h1>
        <p className="text-slate-500">Manage restaurant orders and billing</p>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border rounded-2xl p-4 mb-6 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchValue}
            placeholder="Search by table name..."
            className="w-full pl-11 pr-4 py-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
            onChange={handleSearchChange}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button className="flex items-center gap-2 px-4 py-3 border rounded-xl text-sm">
            <Filter size={16} /> Filters
          </button>

          <select
            value={filters.status || "ALL"}
            className="px-4 py-3 border rounded-xl text-sm"
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                page: 1,
                status:
                  e.target.value === "ALL"
                    ? undefined
                    : (e.target.value as OrderStatus),
              }))
            }
          >
            <option value="ALL">All Status</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="VOIDED">Voided</option>
          </select>

          <select
            className="px-4 py-3 border rounded-xl text-sm"
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                page: 1,
                channel:
                  e.target.value === "ALL"
                    ? undefined
                    : (e.target.value as OrderChannel),
              }))
            }
          >
            <option value="ALL">All Channel</option>
            <option value="DINE_IN">Dine In</option>
            <option value="TAKEAWAY">Takeaway</option>
            <option value="DELIVERY">Delivery</option>
          </select>
        </div>
      </div>

      {/* GRID */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {orders.map((order: any) => (
          <OrderCard
            key={order.id}
            order={order}
            hasBill={!!order.rcpt}
            onEdit={(order) => setSelectedOrder(order)}
            onClick={() => navigate(`/admin/orders/${order.id}`)}
          />
        ))}
      </div>

      {/* EMPTY STATE */}
      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <p className="text-lg font-medium">No orders found</p>
          <p className="text-sm">Try adjusting your filters or search query</p>
        </div>
      )}

      {/* PAGINATION */}
      <div className="flex justify-between items-center mt-6">
        <button
          disabled={filters.page === 1}
          onClick={() =>
            setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
          }
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        <div className="text-sm text-slate-500">
          Page {meta?.page} of {meta?.totalPages}
        </div>
        <button
          disabled={filters.page === meta?.totalPages}
          onClick={() =>
            setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
          }
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* ── EDIT MODAL SLIDE-IN (lives in OrdersPage, not in each card) ── */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div
              className="fixed left-4 right-4 top-4 bottom-4 rounded-2xl bg-white z-50 shadow-2xl"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <EditOrderModal
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
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
