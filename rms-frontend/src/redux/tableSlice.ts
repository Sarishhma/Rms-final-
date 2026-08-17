import { createSlice } from "@reduxjs/toolkit";
import type{ PayloadAction } from "@reduxjs/toolkit";

interface TableState {
  selectedTable: number | null;
}

const initialState: TableState = {
  selectedTable: null,
};

const tableSlice = createSlice({
  name: "table",
  initialState,
  reducers: {
    setTable(state, action: PayloadAction<number | null>) {
      state.selectedTable = action.payload;
    },
  },
});

export const { setTable } = tableSlice.actions;
export default tableSlice.reducer;