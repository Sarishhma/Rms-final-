import { configureStore } from "@reduxjs/toolkit"
import orderReducer from "./orderSlice"
import cartReducer from "./cartSlice"
import tableReducer from "./tableSlice";
export const store =configureStore({
reducer:{
    orders: orderReducer,
    cart:cartReducer,
    table:tableReducer
}
})
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch =typeof store.dispatch