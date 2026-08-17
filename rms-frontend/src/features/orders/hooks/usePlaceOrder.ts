import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";

import { clearCart } from "../../../redux/cartSlice";
import { OrderChannel } from "@/features/orders/types";
import type {
  CreateOrderPayload,
  UsePlaceOrderArgs,
} from "@/features/orders/types";
import { createOrder } from "@/features/orders/services/order.service";
import type { Table } from "@/features/tables/types";

export const usePlaceOrder = ({
  table,
  cart,
  channel,
  customerId,
  guestCount,
  onSuccess: onSuccessCallback,
}: UsePlaceOrderArgs) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ actionKey }: { actionKey: string }) => {
      if (cart.length === 0) {
        throw new Error("Cart is empty!");
      }

      if (channel === OrderChannel.DINE_IN && !table) {
        throw new Error("Please select a table for Dine-In orders!");
      }

      const payload: CreateOrderPayload = {
        channel,

        ...(channel === OrderChannel.DINE_IN &&
          table && {
            tableId: Array.isArray(table.id) ? table.id[0] : table.id,
          }),

        ...(customerId && { customerId }),

        ...(guestCount ? { guestCount } : {}),

        items: cart.map((c) => ({
          menuItemId: c.menuItem.id,
          ...(c.menuItem.variantId && {
            variantId: c.menuItem.variantId,
          }),
          quantity: c.quantity,
          specialInstructions: c.notes || "",
          addonIds: c.selectedAddOns?.map((a) => a.id) ?? [],
        })),
      };

      return createOrder({ payload, actionKey });
    },

    onSuccess: (order) => {
      if (channel === OrderChannel.DINE_IN && table) {
        const tableId = Array.isArray(table.id) ? table.id[0] : table.id;

        queryClient.setQueryData<Table[]>(
          ["tables"],
          (old) =>
            old?.map((t) =>
              t.id === tableId
                ? {
                    ...t,
                    status: "OCCUPIED",
                  }
                : t,
            ) ?? [],
        );
      }

      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });

      queryClient.invalidateQueries({
        queryKey: ["tables"],
      });

      dispatch(clearCart());

      onSuccessCallback?.(order.createdOrder);
    },

    onError: (err: any) => {
      toast.error(err.userMessage ?? err.message ?? "Failed to create order");
    },
  });
};
