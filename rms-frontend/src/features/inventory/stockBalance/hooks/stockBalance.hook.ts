import { useQuery } from "@tanstack/react-query";
import type { StockBalanceListParams } from "../../types/inventory.type";
import { getstockbalanceservice } from "../service/stockBalance.service";

export const useStockBalance =(params?:StockBalanceListParams)=>{
    return useQuery({
        queryKey:["stock-balances",params],
        queryFn:()=>getstockbalanceservice.getStockBalance(params)
    })
}