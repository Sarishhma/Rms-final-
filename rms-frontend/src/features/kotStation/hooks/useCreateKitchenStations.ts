import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KitchenStationService } from "../service/kot.servise";
import type { CreateKitchenStationPayload } from "../types/kot.types";
import { kitchenStationKeys } from "./useKitchenStations";

export const useCreateKitchenStation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateKitchenStationPayload) =>
      KitchenStationService.createKitchenStation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kitchenStationKeys.all });
    },
  });
};