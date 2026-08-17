import { Clock } from "lucide-react";
import type { Order } from "@/features/orders/types";

interface OrdersListProps {
  orders: Order[];
  isLoading: boolean;
  onGenerateBill: (order: Order) => void;
}

/**
 * OrdersList Component
 * Displays a list of confirmed orders with bill generation button
 */
export function OrdersList({
  orders,
  isLoading,
  onGenerateBill,
}: OrdersListProps) {
  const hasOrders = orders.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h2 className="font-bold text-lg flex items-center gap-2 mb-4 text-gray-900">
        <Clock size={18} className="text-blue-600" />
        Confirmed Orders
      </h2>

      {!hasOrders ? (
        <EmptyState />
      ) : (
        <OrdersGrid
          orders={orders}
          isLoading={isLoading}
          onGenerateBill={onGenerateBill}
        />
      )}
    </div>
  );
}

/**
 * EmptyState Component
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
      <Clock size={32} className="mb-2 opacity-50" />
      <p>No confirmed orders at the moment</p>
    </div>
  );
}

/**
 * OrdersGrid Component
 */
function OrdersGrid({
  orders,
  isLoading,
  onGenerateBill,
}: {
  orders: Order[];
  isLoading: boolean;
  onGenerateBill: (order: Order) => void;
}) {
  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          isLoading={isLoading}
          onGenerateBill={onGenerateBill}
        />
      ))}
    </div>
  );
}

/**
 * OrderCard Component
 */
function OrderCard({
  order,
  isLoading,
  onGenerateBill,
}: {
  order: Order;
  isLoading: boolean;
  onGenerateBill: (order: Order) => void;
}) {
  const tableName = order.table?.name || "Takeaway";
  const itemCount = order.items?.length || 0;

  return (
    <div className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:shadow-md hover:border-blue-300 transition-all duration-200">
      <OrderInfo tableName={tableName} itemCount={itemCount} />

      <GenerateBillButton
        isLoading={isLoading}
        onClick={() => onGenerateBill(order)}
      />
    </div>
  );
}

/**
 * OrderInfo Component
 */
function OrderInfo({
  tableName,
  itemCount,
}: {
  tableName: string;
  itemCount: number;
}) {
  return (
    <div>
      <p className="font-semibold text-gray-900">Table: {tableName}</p>
      <p className="text-sm text-gray-600">Items: {itemCount}</p>
    </div>
  );
}

/**
 * GenerateBillButton Component
 */
function GenerateBillButton({
  isLoading,
  onClick,
}: {
  isLoading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      aria-label="Generate bill for this order"
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <LoadingSpinner />
          Generating...
        </span>
      ) : (
        "Generate Bill"
      )}
    </button>
  );
}

/**
 * Simple Loading Spinner
 */
function LoadingSpinner() {
  return (
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
  );
}
