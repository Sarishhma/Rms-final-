import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  orderService,
  type OrdersQuery,
  type PaginatedResponse,
} from "@/features/orders/services/order.service";
import type { Order } from "@/features/orders/types";

type PaymentPayload = {
  billId: string;
  method: string;
  amount: number;
  reference?: string;
  note?: string;
};

export const useOrder = (params: OrdersQuery) => {
  return useQuery<PaginatedResponse<Order>>({
    queryKey: ["orders", params],
    queryFn: () => orderService.getAll(params),
  });
};

export const useOrderActions = () => {
  const queryClient = useQueryClient();

  const updateOrder = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      orderService.update(id, payload),

    onSuccess: (_, variables) => {
      // variables = { id, payload }

      queryClient.invalidateQueries({
        queryKey: ["order", variables.id],
      });

      queryClient.invalidateQueries({
        queryKey: ["orders"],
        exact: false,
      });
    },
  });

  const cancelOrder = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      orderService.cancel(id, reason),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orders"],
        exact: false,
      });
    },
  });

  const makePayment = useMutation({
    mutationFn: (payload: PaymentPayload) => orderService.makePayment(payload),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["orders"],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: ["order"] });

      if (variables.billId) {
        queryClient.invalidateQueries({
          queryKey: ["bill", variables.billId],
        });
      }
    },
  });

  return {
    updateOrder,
    cancelOrder,
    makePayment,
  };
};

export const useOrderById = (id: string) => {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => orderService.getById(id),
    enabled: !!id,
  });
};
