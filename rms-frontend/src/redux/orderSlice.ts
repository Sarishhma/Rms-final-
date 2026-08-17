import { OrderStatus } from "@/features/orders/types";
import type {Order,OrderState} from "@/features/orders/types"
import { createSlice, } from "@reduxjs/toolkit";
import type{ PayloadAction } from "@reduxjs/toolkit";


interface ExtendedOrderState extends  OrderState{
  latestKotDiff: any[] | null;
}
const initialState: ExtendedOrderState = {
  orders: [],
  latestKotDiff:null,
};

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    addOrder(state, action: PayloadAction<Order>) {
      state.orders.push(action.payload);
    },

    updateOrderStatus(state, action) {
      const order = state.orders.find((o) => o.id === action.payload.id);
      if (order) {
        order.status = action.payload.status;

        const now = new Date().toISOString();
        if (action.payload.status === OrderStatus.CONFIRMED) order.confirmedAt = now;
        if (action.payload.status === OrderStatus.CANCELLED) order.cancelledAt = now;
        if (action.payload.status === OrderStatus.VOIDED) order.voidedAt = now;
        if (action.payload.status === OrderStatus.COMPLETED) order.completedAt = now;
      }
    },

    updateOrder(state, action: PayloadAction<Order>) {
      const index = state.orders.findIndex((o) => o.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      } else {
        state.orders.push(action.payload);
      }
    },

    removeOrder(state, action: PayloadAction<string>) {
      state.orders = state.orders.filter((o) => o.id !== action.payload);
    },
    setLatestKotDiff(state,action:PayloadAction<any[] | null>){
      state.latestKotDiff = action.payload;
    },
    clearLatestKotDiff(state){
state.latestKotDiff = null
    }
  },
})



export const {
  addOrder,
  updateOrderStatus,
  updateOrder,
  removeOrder,
  setLatestKotDiff,
  clearLatestKotDiff
} = orderSlice.actions;

export default orderSlice.reducer;