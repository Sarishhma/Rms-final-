import api from "@/lib/client";
import type { CreateKitchenStationPayload, DeleteStationApiResponse, DeleteStationResponse, KitchenStation, KitchenStationListParams, KitchenStationListResponse, KitchenStationResponse, UpdateKitchenStationPayload } from "../types/kot.types";

export  const KitchenStationService ={
    getKitchenStation:async(params?:KitchenStationListParams):Promise<KitchenStationListResponse>=>{
        const res=await api.get<KitchenStationListResponse>("/api/kitchen-stations",{
            params,
        })
        return res.data
    },
    createKitchenStation:async(
        payload:CreateKitchenStationPayload
    ): Promise<KitchenStationResponse>=>{
        const res =await api.post("/api/kitchen-stations",payload);
        return res.data
    },
    getKitchenStationById:async(
        id:string
    ): Promise<KitchenStation>=>{
        const res = await api.get<KitchenStationResponse>(
            `/api/kitchen-stations/${id}`
        )
         return res.data.data;
    },
    updateKitchenStation:async(id:string,payload:UpdateKitchenStationPayload):Promise<KitchenStationResponse>=>{
        const res= await api.patch<KitchenStationResponse>(
            `/api/kitchen-stations/${id}`,payload
        )
        return res.data;
    },
    deleteKitchenStation: async (
  id: string
): Promise<DeleteStationResponse> => {
  const res = await api.delete<DeleteStationApiResponse>(
    `/api/kitchen-stations/${id}`
  );

  return res.data.data;
},
   
};
