import { useQuery } from "@tanstack/react-query";
import { kitchenStationKeyRoutingService } from "../service/kitchenStationRoutingService";

export const  kitchenStationKeyRoutingKeys={
    all:["kitchen-station-routing"] as const,
}
export const  useKitchenStationRouting =()=>{
    return useQuery({
        queryKey: kitchenStationKeyRoutingKeys.all,
        queryFn:kitchenStationKeyRoutingService.getStationRouting
    })
}