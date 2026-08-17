
import { useQuery } from "@tanstack/react-query";
import { getRefundByIdService, getRefundServices } from "../service/refund.service";
import type { RefundQueryParams } from "../types/refund.types";

export const useRefunds = (params?:RefundQueryParams)=>{
    return useQuery({
        queryKey:["refunds",params],
        queryFn:()=>getRefundServices(params),

    })
}
export const useRefundsById=(id:string)=>{
    return useQuery({
        queryKey:["refunds",id],
        queryFn:()=>getRefundByIdService(id),
        enabled:!!id,
    })
}