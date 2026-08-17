import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBill,
  fetchBillById,
  fetchBills,
} from "../services/Billing.service";
import type { CreateBillPayload } from "@/features/orders/types";
import toast from "react-hot-toast";

export const useBill = (id: string) => {
  return useQuery({
    queryKey: ["Bill"],
    queryFn: () => fetchBills(),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });
};

export const useBillbyId = (id: string | null) => {
  return useQuery({
    queryKey: ["Bill", id],
    queryFn: () => fetchBillById(id!),
    enabled: !!id,
  });
};
export const useCreateBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBillPayload) => createBill(payload),
    onSuccess: (data) => {
      toast.success(`Bill #${data.billNumber} generated successfully!`);
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: () => {
      console.error(" Failed to generate bill");
    },
  });
};
