import { useQuery } from "@tanstack/react-query"
import { getOrderById } from "@/features/orders/services/order.service"

export const useOrdersById=(orderId:string | null)=>{
    return useQuery({
        queryKey:["order",orderId],
        queryFn:()=>getOrderById(orderId!),
        enabled:!!orderId
    })
}