import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOrder } from "@/features/orders/services/order.service";
import toast from "react-hot-toast";

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create order");
    },
  });
};
