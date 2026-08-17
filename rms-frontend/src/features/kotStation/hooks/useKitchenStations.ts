// src/features/kitchen-stations/hooks/useKitchenStations.ts
import { useQuery } from "@tanstack/react-query";
import { KitchenStationService } from "../service/kot.servise";
import type { KitchenStationListParams } from "../types/kot.types";

// Define consistent keys
export const kitchenStationKeys = {
  all: ["kitchen-stations"] as const,
  lists: () => [...kitchenStationKeys.all, "list"] as const,
  list: (params?: KitchenStationListParams) =>
    [...kitchenStationKeys.lists(), params] as const,
  detail: (id: string) => [...kitchenStationKeys.all, "detail", id] as const,
};

export const useKitchenStations = (params?: KitchenStationListParams) => {
  return useQuery({
    queryKey: kitchenStationKeys.list(params), // Use the consistent key
    queryFn: () => KitchenStationService.getKitchenStation(params),
    // Add this to ensure data is fresh
    staleTime: 0, // Always refetch when invalidated
  });
};

export const useKitchenStationById = (id?: string) => {
  return useQuery({
    queryKey: kitchenStationKeys.detail(id!),
    queryFn: () => KitchenStationService.getKitchenStationById(id!),
    enabled: !!id,
  });
};