import { getOrders, orderService, } from "@/features/orders/services/order.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { confirmOrder, releaseTable, } from "@/features/menu/services/menu.service";
export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      reason,
      tableId,
    }: {
      id: string;
      reason: string;
      tableId: string;
    }) => {
      // 1. cancel order
      await orderService.cancel(id, reason);

      // 2. release table (IMPORTANT: wait for it)
      await releaseTable(tableId);
    },

    onSuccess: () => {
      // refresh everything that depends on this state
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },

    onError: () => {
    },
  });
};
export const useOrders = () => {
  return useQuery({
    queryKey: ["orders"],
    queryFn: getOrders, 
    staleTime: 0,
    refetchOnWindowFocus: true,
    enabled: !!localStorage.getItem("accessToken"),
  });
};

export const useConfirmOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => confirmOrder(orderId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] }); // ✅ add this
      // toast.success("Order Confirmed");
    },

    onError: (err: any) => {
      console.error("Confirm mutation error:", {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });

      console.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to confirm order",
      );
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => {
      return orderService.update(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: (_err: any) => {
    }
  });
};

