import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInventoryItems, createInventoryItem, adjustInventoryItem, removeInventoryItem } from "../service/inventoryitem.service";

import type { CreateInventoryItemPayload } from "../../types/inventory.type";

export const useInventoryItems = (params: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  type?: string;
  lowStockOnly?: boolean;
} = {}) => {
  return useQuery({
    queryKey: ["inventoryItems", params],
    queryFn: () => getInventoryItems(params),
    placeholderData: (previousData: unknown) => previousData,
  });
};

export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, CreateInventoryItemPayload>({
    mutationFn: createInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
    },
  });
};

export const useAdjustInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { id: string; data: Partial<CreateInventoryItemPayload> }>({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateInventoryItemPayload> }) =>
      adjustInventoryItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
    },
  });
};

export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, string>({
    mutationFn: (id: string) => removeInventoryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
    },
  });
};