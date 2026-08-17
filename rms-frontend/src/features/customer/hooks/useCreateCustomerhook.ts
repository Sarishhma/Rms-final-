import { useMutation, useQueryClient } from "@tanstack/react-query";
import { create } from "@/features/customer/services/customer.service";
import toast from "react-hot-toast";

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: create,
    onSuccess: (data) => {
      toast.success(`Customer "${data.name}" registered successfully!`);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create customer";
      toast.error(message);
    },
  });
};
