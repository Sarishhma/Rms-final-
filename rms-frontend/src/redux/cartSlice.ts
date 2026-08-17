import type { CartItem, CartState } from "@/features/orders/types";
import type { Table } from "@/features/tables/types";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const initialState: CartState = {
  items: [],
  table: null,
  pendingItem: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem["menuItem"]>) {
      const existing = state.items.find(
        (c) => c.menuItem.id === action.payload.id,
      );
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({
          menuItem: action.payload,
          quantity: 1,
          notes: "",
          selectedAddOns: [],
        });
      }
    },

    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter((c) => c.menuItem.id !== action.payload);
    },

    updateQuantity(
      state,
      action: PayloadAction<{ id: string; type: "increase" | "decrease" }>,
    ) {
      const item = state.items.find((c) => c.menuItem.id === action.payload.id);
      if (item) {
        item.quantity =
          action.payload.type === "increase"
            ? item.quantity + 1
            : Math.max(1, item.quantity - 1); // min 1 — use removeFromCart to delete
      }
    },

    updateNotes(state, action: PayloadAction<{ id: string; note: string }>) {
      const item = state.items.find(
        (c: any) => c.menuItem.id === action.payload.id,
      );
      if (item) item.notes = action.payload.note;
    },

    setTable(state, action: PayloadAction<Table>) {
      state.table = action.payload;
    },

    setPendingItem(state, action: PayloadAction<CartItem["menuItem"]>) {
      state.pendingItem = action.payload;
    },

    clearPendingItem(state) {
      state.pendingItem = null;
    },

    clearCart(state) {
      state.items = [];
      state.table = null;
      state.pendingItem = null;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  updateNotes,
  clearCart,
  setTable,
  setPendingItem,
  clearPendingItem,
} = cartSlice.actions;

export default cartSlice.reducer;
