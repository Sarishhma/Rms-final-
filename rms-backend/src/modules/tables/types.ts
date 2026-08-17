import type { TableStatus } from "@prisma/client";

export type TableDto = {
  id: string;
  name: string;
  capacity: number;
  floor: string | null;
  status: TableStatus;
  activeOrderId: string | null;
};

export type TableSwapRequest = {
  orderId: string;
  fromTableId: string;
  toTableId: string;
};

export type TableSwapResponse = {
  success: boolean;
  swap:{
  id: string;
  orderId: string;
  fromTableId: string;
  toTableId: string;
  swappedAt: Date;
  swappedBy: {
    id: string;
    name: string;
  };
  };
  sourceTable:{
    id: string;
    name: string;
    status: string;
  };
  targetTable:{
    id:string;
    name: string;
    status: string;
  };
  order:{
    id: string;
    orderNumber:string;
    tableId: string;
  };

};

export type TableSplitResponse = {
  success: boolean;
  split: {
    id: string;
    sourceOrderId: string;
    newOrderId: string;
    fromTableId: string;
    toTableId: string;
  };
  sourceOrder: {
    id: string;
    orderNumber: string;
    grandTotal: number;
    status: string;
  };
  newOrder: {
    id: string;
    orderNumber: string;
    grandTotal: number;
    tableId: string;
  };
  sourceTable: {
    id: string;
    name: string;
    status: string;
  };
  targetTable: {
    id: string;
    name: string;
    status: string;
  };
};

export type TableCombineResponse = {
  group: {
    id: string;
    orderId: string;
    isActive: boolean;
    members: Array<{ tableId: string; tableName: string }>;
  };
  mergedOrder: {
    id: string;
    orderNumber: string;
    grandTotal: number;
    itemCount: number;
  };
  previousOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    mergedIntoOrderId: string;
  }>;
};
