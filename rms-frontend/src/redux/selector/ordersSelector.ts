import { ACTIVE_STATUSES } from "@/features/orders/types";
import type { RootState } from "@/redux/store";
import { createSelector } from "@reduxjs/toolkit";
export const selectActiveOrders = createSelector(
  [(state: RootState) => state.orders.orders],
  (orders) => orders.filter((o: any) => ACTIVE_STATUSES.includes(o.status)),
);
