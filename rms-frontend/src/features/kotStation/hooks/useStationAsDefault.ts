import { useMutation, useQueryClient } from "@tanstack/react-query";
import { kitchenStationKeys } from "./useKitchenStations";

import { kitchenStationKeyRoutingService } from "../service/kitchenStationRoutingService";
import { kitchenStationKeyRoutingKeys } from "./useKitchenStationRouting";

export const useSetStationAsDefault = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stationId: string) =>
      kitchenStationKeyRoutingService.setStationAsDefault(stationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kitchenStationKeys.all });
      queryClient.invalidateQueries({ queryKey: kitchenStationKeyRoutingKeys.all });
    },
  });
};