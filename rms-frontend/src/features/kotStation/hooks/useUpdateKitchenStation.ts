import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KitchenStationService } from "../service/kot.servise";
import type { UpdateKitchenStationPayload } from "../types/kot.types";

export const useUpdateKitchenStation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateKitchenStationPayload;
    }) => KitchenStationService.updateKitchenStation(id, payload),
    
    onSuccess: (_response, variables) => {
      // Force refetch with exact query keys
      queryClient.invalidateQueries({
        queryKey: ["kitchen-stations"],
        exact: false,
      });

      // Also invalidate the specific station
      queryClient.invalidateQueries({
        queryKey: ["kitchen-stations", "detail", variables.id],
        exact: true,
      });

      // Optional: Force an immediate refetch
      // setTimeout(() => {
      //   queryClient.refetchQueries({
      //     queryKey: ["kitchen-stations"],
      //     exact: false
      //   });
      // }, 100);
    },
  });
};
