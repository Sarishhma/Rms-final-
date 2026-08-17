import api from "@/lib/client";
import type { KitchenStationRoutingResponse } from "../types/kot.types"

export const kitchenStationKeyRoutingService ={
    getStationRouting:async():Promise<KitchenStationRoutingResponse>=>{
        const res = await api.get<KitchenStationRoutingResponse>(
            "/api/kitchen-stations/routing"
        );
        return res.data;
    },
    
      setStationAsDefault: async (stationId: string): Promise<{ success: boolean }> => {
    const res = await api.post<{ success: boolean }>(
      `/api/kitchen-stations/${stationId}/default`
    );
    return res.data;
  },
 
}

