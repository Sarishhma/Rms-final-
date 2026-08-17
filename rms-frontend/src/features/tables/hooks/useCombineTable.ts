import type { CombineTablePayload } from "@/features/tables/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { combineTable } from "@/features/tables/services/table.service";
import toast from "react-hot-toast";

export const useCombineTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CombineTablePayload) => combineTable(payload),
    onSuccess: (data: any) => {
      const orderNumber =
        data.mergedOrder?.orderNumber || data.order?.orderNumber || "";
      toast.success(`Tables combined under ${orderNumber} successfully`);
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: () => {
      console.error("Failed to combine tables");
    },
  });
};
