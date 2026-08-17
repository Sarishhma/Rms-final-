import { useOrder } from "@/features/orders/hooks/useGetOrders";
import { OrderStatus } from "@/features/orders/types";

export const useActiveOrders = () => {
  const { data, isLoading, error } = useOrder({ page: 1 });

  const orders = data?.data ?? [];

  const activeOrders = () => {
    return orders.filter((order) => order.status === OrderStatus.CONFIRMED);
  };

  return {
    activeOrders,
    isLoading,
    error,
  };
};
