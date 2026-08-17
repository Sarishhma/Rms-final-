import { Users } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/redux/hooks";
import { addToCart, clearPendingItem, setTable } from "@/redux/cartSlice";
import { TableStatus } from "@/features/tables/types/index";
import type { Table } from "@/features/tables/types/index";
import { motion, AnimatePresence } from "framer-motion";
import { useTables } from "@/features/tables/hooks/useTables";
import { LoadingSpinner } from "@/features/shared/LoadingSpinner";
import { useMemo, useState } from "react";
import TransferModal from "@/features/tables/components/TransferModal";
import TableActionMenu from "@/features/tables/components/TableActionMenu";
import SplitModal from "@/features/tables/components/SplitModal";
import { useOrdersById } from "@/features/orders/hooks/useGetOrdersId";
import CombineModal from "@/features/tables/components/CombineModal";
import EditOrderModal from "@/features/orders/components/EditOrderModal";
import { toast } from "react-hot-toast";
import type { Order } from "@/features/orders";
import PrintKotModal from "@/features/kot/component/PrintKotModal";

const statusConfig = {
  [TableStatus.AVAILABLE]: {
    card: "bg-green-50 border-green-200 hover:border-green-400",
    shape: "bg-green-100 border-green-300",
    icon: "text-green-600",
    badge: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  [TableStatus.OCCUPIED]: {
    card: "bg-red-50 border-red-200 hover:border-red-400",
    shape: "bg-red-100 border-red-300",
    icon: "text-red-600",
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
  [TableStatus.RESERVED]: {
    card: "bg-yellow-50 border-yellow-200 hover:border-yellow-400",
    shape: "bg-yellow-100 border-yellow-300",
    icon: "text-yellow-600",
    badge: "bg-yellow-100 text-yellow-700",
    dot: "bg-yellow-500",
  },
  [TableStatus.MAINTENANCE]: {
    card: "bg-gray-50 border-gray-200 hover:border-gray-400",
    shape: "bg-gray-100 border-gray-300",
    icon: "text-gray-600",
    badge: "bg-gray-100 text-gray-700",
    dot: "bg-gray-500",
  },
};

export default function Tables() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search")?.toLowerCase() ?? "";
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const pendingItem = useAppSelector((state) => state.cart.pendingItem);
  const { data: tables = [], isLoading, isError, error } = useTables();
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [activeFloor, setActiveFloor] = useState("all");
  const [selectFromTable, setSelectFromTable] = useState<Table | null>(null);
  const [actionTable, setActionTable] = useState<Table | null>(null);
  const [combineFromTable, setCombineFromTable] = useState<Table | null>(null);
  const [splitTable, setSplitTable] = useState<Table | null>(null);
  const [editingOrderTable, setEditingOrderTable] = useState<Table | null>(
    null,
  );

  const {
    data: activeOrder,
    isLoading: isLoadingOrder,
    isError: isOrderError,
  } = useOrdersById(editingOrderTable?.activeOrderId ?? null);

  // Search filter
  const filteredTables = tables.filter(
    (table) =>
      table.name.toLowerCase().includes(search) ||
      table.status.toLowerCase().includes(search),
  );

  const floorCounts = useMemo(() => {
    const map: Record<string, number> = {};

    for (const t of filteredTables) {
      const floor = t.floor || "Unassigned";
      map[floor] = (map[floor] || 0) + 1;
    }

    return map;
  }, [filteredTables]);

  // Unique sorted floors
  const floors = Array.from(
    new Set(filteredTables.map((t) => t.floor || "Unassigned")),
  ).sort((a, b) => {
    if (a.toLowerCase().includes("ground")) return -1;
    if (b.toLowerCase().includes("ground")) return 1;
    return a.localeCompare(b);
  });

  // Tables to display based on active floor tab
  const displayedTables =
    activeFloor === "all"
      ? filteredTables
      : filteredTables.filter((t) => (t.floor || "Unassigned") === activeFloor);

  const handleTableClick = (table: Table) => {
    if (table.status === TableStatus.OCCUPIED) {
      setActionTable(table);
      return;
    }
    if (table.status !== TableStatus.AVAILABLE) return;
    dispatch(setTable(table));
    if (pendingItem) {
      dispatch(addToCart(pendingItem));
      dispatch(clearPendingItem());
    }
    navigate("/new-order");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Loading tables..." size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <p className="text-red-500 font-semibold text-base mb-2">
            Error loading tables
          </p>
          <p className="text-gray-500 text-sm">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Tables
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Select an available table to start or manage an order
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2.5 mb-6">
        {Object.values(TableStatus).map((status) => (
          <div
            key={status}
            className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm text-xs font-semibold text-gray-700"
          >
            <div
              className={`w-2.5 h-2.5 rounded-full ${statusConfig[status].dot}`}
            />
            <span className="capitalize">{status.toLowerCase()}</span>
          </div>
        ))}
      </div>

      {/* Floor Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {["all", ...floors].map((floor) => {
          const count =
            floor === "all" ? filteredTables.length : floorCounts[floor] || 0;

          return (
            <button
              key={floor}
              onClick={() => setActiveFloor(floor)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                activeFloor === floor
                  ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
              }`}
            >
              {floor === "all" ? "All Floors" : floor}
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Tables Grid */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200/60 shadow-sm">
        {displayedTables.length === 0 ? (
          <p className="text-center text-gray-400 py-10">No tables found.</p>
        ) : (
          <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-4">
            {displayedTables.map((table) => {
              const config = statusConfig[table.status];
              const isAvailable = table.status === TableStatus.AVAILABLE;

              return (
                <button
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  disabled={
                    table.status === TableStatus.RESERVED ||
                    table.status === TableStatus.MAINTENANCE
                  }
                  className={`
                    flex flex-col items-center gap-1.5 p-2 sm:p-4 rounded-xl sm:rounded-2xl border-2
                    transition-all duration-200 shadow-sm hover:shadow
                    ${config.card}
                    ${
                      isAvailable
                        ? "hover:scale-[1.03] hover:border-orange-300 cursor-pointer"
                        : table.status === TableStatus.OCCUPIED
                          ? "cursor-pointer"
                          : "cursor-not-allowed opacity-75"
                    }
                  `}
                >
                  <div
                    className={`hidden sm:flex items-center justify-center border rounded-xl w-14 h-14 ${config.shape}`}
                  >
                    <Users size={22} className={config.icon} />
                  </div>

                  <span
                    className={`text-xs sm:text-sm font-bold tracking-tight ${config.icon}`}
                  >
                    <span className="hidden sm:inline">Table </span>
                    {table.name}
                  </span>

                  <div className="flex flex-col items-center gap-0.5 w-full mt-0.5">
                    <span className="text-[9px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                      {table.capacity}{" "}
                      <span className="hidden sm:inline">seats</span>
                      <span className="sm:hidden">s</span>
                    </span>

                    <span
                      className={`hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full mt-1 ${config.badge}`}
                    >
                      {table.status}
                    </span>

                    <div
                      className={`sm:hidden w-1.5 h-1.5 rounded-full mt-0.5 ${config.dot}`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectFromTable && (
        <TransferModal
          fromTable={selectFromTable}
          tables={tables}
          onClose={() => setSelectFromTable(null)}
        />
      )}
      {combineFromTable && (
        <CombineModal
          fromTable={combineFromTable}
          tables={tables}
          onClose={() => setCombineFromTable(null)}
        />
      )}
      {actionTable && (
        <TableActionMenu
          table={actionTable}
          onTransfer={() => {
            setSelectFromTable(actionTable);
            setActionTable(null);
          }}
          onCombine={() => {
            setCombineFromTable(actionTable);
            setActionTable(null);
          }}
          onClose={() => setActionTable(null)}
          onSplit={() => {
            setSplitTable(actionTable);
            setActionTable(null);
          }}
          onViewOrder={() => {
            if (!actionTable.activeOrderId) {
              toast.error(
                "This table is marked as occupied but has no active order!",
              );
              setActionTable(null);
              return;
            }
            setEditingOrderTable(actionTable);
            setActionTable(null);
          }}
        />
      )}
      {splitTable && (
        <SplitModal
          fromTable={splitTable}
          tables={tables}
          onClose={() => setSplitTable(null)}
        />
      )}
      {editingOrderTable && isLoadingOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-bold text-gray-700">
              Loading order...
            </span>
          </div>
        </div>
      )}
      {editingOrderTable && isOrderError && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl flex flex-col items-center gap-4 max-w-sm text-center">
            <span className="text-sm font-bold text-red-600">
              Failed to load the active order. It may have been deleted or there
              is a network error.
            </span>
            <button
              onClick={() => setEditingOrderTable(null)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <AnimatePresence>
        {editingOrderTable && activeOrder && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingOrderTable(null)}
            />
            <motion.div
              className="fixed left-4 right-4 top-4 bottom-4 rounded-2xl bg-white z-50 shadow-2xl"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <EditOrderModal
                order={activeOrder}
                onClose={() => setEditingOrderTable(null)}
                startEdit={false}
                onPrintRequested={(order) => {
                  setPrintOrder(order);
                }}
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
