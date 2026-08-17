// billing.hook.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  billingService,
  fetchBillById,
  getBillById,
  getBills,
  type BillResponse,
} from "@/features/billing/services/Billing.service";

export const useBilling = (orderId?: string) => {
  const queryClient = useQueryClient();

  const generateBill = useMutation({
    mutationFn: billingService.generate,
    onSuccess: () => {
      if (orderId) {
        queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      }
      // Also invalidate bills list
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });

  const getBill = useMutation({
    mutationFn: billingService.getById,
  });

  return { generateBill, getBill };
};

// get list of billing of order

export const useBills = (page: number, limit: number, status?: string) => {
  return useQuery<BillResponse, Error>({
    queryKey: ["bills", page, limit, status],
    queryFn: () => getBills(page, limit, status),
  });
};

export const useBillDetail = (id?: string | null) => {
  return useQuery({
    queryKey: ["bill", id],
    queryFn: () => {
      if (!id) throw new Error("Bill ID is required");
      return getBillById(id);
    },
    enabled: !!id,
  });
};

// sarishma
export const useBillbyId = (id: string | null) => {
  return useQuery({
    queryKey: ["Bill", id],
    queryFn: () => fetchBillById(id!),
    enabled: !!id,
  });
};
