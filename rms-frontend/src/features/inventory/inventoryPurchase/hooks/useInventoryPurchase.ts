import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryPurchaseService } from "../services/inventoryPurchase.service";
import type {
  CreateInventoryPurchasePayload,
  InventoryPurchaseListParams,
  UpdateInventoryPurchasePayload,
} from "../../types/inventory.type";

export const useInventoryPurchases = (params?: InventoryPurchaseListParams) => {
  return useQuery({
    queryKey: ["inventoryPurchases", params],
    queryFn: () => inventoryPurchaseService.getAll(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useInventoryPurchaseDetail = (id?: string) => {
  return useQuery({
    queryKey: ["inventoryPurchase", id],
    queryFn: () => (id ? inventoryPurchaseService.getById(id) : Promise.reject("No ID provided")),
    enabled: !!id,
  });
};

export const useCreateInventoryPurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInventoryPurchasePayload) =>
      inventoryPurchaseService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryPurchases"] });
    },
  });
};

export const usePostInventoryPurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventoryPurchaseService.postPurchase(id),
    onSuccess: () => {
      // Invalidate both purchases and items since stock level updates are triggered
      queryClient.invalidateQueries({ queryKey: ["inventoryPurchases"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
    },
  });
};


export const useUpdateInventoryPurchase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UpdateInventoryPurchasePayload> }) =>
      inventoryPurchaseService.updatePurchase(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["inventoryPurchases"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryPurchase", id] });
    },
  });
};
