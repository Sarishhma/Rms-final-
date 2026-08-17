import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryStockOutService } from "../services/inventoryStockOut.service";
import type {
  CreateStockOutPayload,
  StockOutListParams,
} from "../../types/inventory.type";

export const useInventoryStockOuts = (params?: StockOutListParams) => {
  return useQuery({
    queryKey: ["inventoryStockOuts", params],
    queryFn: () => inventoryStockOutService.getAll(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useInventoryStockOutDetail = (id?: string) => {
  return useQuery({
    queryKey: ["inventoryStockOut", id],
    queryFn: () =>
      id
        ? inventoryStockOutService.getById(id)
        : Promise.reject("No ID provided"),
    enabled: !!id,
  });
};

export const useCreateInventoryStockOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStockOutPayload) =>
      inventoryStockOutService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryStockOuts"] });
      // Stock balances change after a stock out
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
    },
  });
};

export const usePostInventoryStockOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventoryStockOutService.postStockOut(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryStockOuts"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
    },
  });
};

// export const useCancelInventoryStockOut = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (id: string) => inventoryStockOutService.cancelStockOut(id),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["inventoryStockOuts"] });
//     },
//   });
// };
