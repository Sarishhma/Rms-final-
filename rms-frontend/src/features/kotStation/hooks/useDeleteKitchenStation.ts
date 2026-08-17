import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KitchenStationService } from "../service/kot.servise";


export const useDeleteKitchenStation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      KitchenStationService.deleteKitchenStation(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["kitchen-stations"],
      });
    },
  });
};