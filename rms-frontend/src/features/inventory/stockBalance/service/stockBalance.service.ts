import api from "@/lib/client";
import type { StockBalanceListParams, StockBalanceListResponse } from "../../types/inventory.type";

export const getstockbalanceservice={
    getStockBalance:async(params?:StockBalanceListParams,):Promise<StockBalanceListResponse>=>{
        const res = await api.get<StockBalanceListResponse>("/api/inventory/stock-balances",{params})
        return res.data
    }
}