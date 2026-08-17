export const TableStatus = {
  AVAILABLE: "AVAILABLE",
  OCCUPIED: "OCCUPIED",
  RESERVED: "RESERVED",
  MAINTENANCE: "MAINTENANCE",
} as const;

export type TableStatus = (typeof TableStatus)[keyof typeof TableStatus];

export interface Table {
  id: string;
  companyId: string;
  name: string;
  capacity: number;
  status: TableStatus;
  floor: string | null;
  activeOrderId: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransferTablePayload {
  fromTableId: string;
  toTableId: string;
  reason: string;
}

export interface TransferTableResponse {
  success: boolean;
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
  order: {
    id: string;
    orderNumber: string;
    tableId: string;
  };
}
export interface CombineTablePayload {
  orderId: string;
  tableIds: string[];
  reason: string;
}

export interface CombineTableResponse {
  id: string;
  orderId: string;
  isActive: boolean;
  members: {
    id: string;
    tableId: string;
    table: {
      id: string;
      name: string;
      status: string;
    };
  }[];
  order: {
    id: string;
    orderNumber: string;
    status: string;
    tableId: string;
  };
}
export interface SplitTablePayload {
  sourceOrderId: string;
  fromTableId: string;
  toTableId: string;
  items: {
    orderItemId: string;
    quantity: number;
  }[];
  reason: string;
}

export interface SplitTableResponse {
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
    status: string;
  };
  newOrder: {
    id: string;
    orderNumber: string;
    tableId: string;
    grandTotal: number;
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
}
