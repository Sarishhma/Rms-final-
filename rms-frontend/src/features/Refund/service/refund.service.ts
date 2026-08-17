import api from "@/lib/client";
import type { Refund, RefundListResponse, RefundQueryParams } from "../types/refund.types";
import { handleApiError } from "@/features/shared/errorhandle";

export const getRefundServices = async(params?:RefundQueryParams)=>{
    try{
        const res = await api.get<RefundListResponse>("/api/refunds",{params})
    return res.data
    }catch(error){
handleApiError(error,"getRefundService error")
   throw error;
    }
}
export const getRefundByIdService = async(id:string)=>{
   try{
     const res = await api.get<{success:boolean,data:Refund}>(`/api/refunds/${id}`)
    return res.data
   }catch(error){
    handleApiError(error,"get refund service by id error")
    throw error;
   }
}