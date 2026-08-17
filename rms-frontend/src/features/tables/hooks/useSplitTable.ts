import type { SplitTablePayload } from "@/features/tables/types/index";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { splitTable } from "@/features/tables/services/table.service";
import toast from "react-hot-toast";

export const useSplitTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SplitTablePayload) => splitTable(payload),
    onSuccess: (data) => {
      toast.success(
        `Order split! New order ${data.newOrder.orderNumber} created on ${data.targetTable.name}`,
      );
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: () => {
      toast.error("Failed to split tables");
    },
  });
};
