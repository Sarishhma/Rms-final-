import type { TransferTablePayload } from "@/features/tables/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transferTable } from "@/features/tables/services/table.service";
import toast from "react-hot-toast";

export const useTransferTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransferTablePayload) => transferTable(payload),
    onSuccess: (data) => {
      toast.success(
        `Order transfered to ${data.targetTable.name} successfully `,
      );
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: () => {
      console.error("Transfer failed");
    },
  });
};
