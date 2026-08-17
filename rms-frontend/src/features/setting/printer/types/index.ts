
export interface Printer {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  isKitchen: boolean;
  isEnabled: boolean;
  kitchenStationId: string | null;
  assignedUserId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PrinterListParams {
  page?: number;
  limit?: number;
  isKitchen?: boolean;
  isEnabled?: boolean;
  kitchenStationId?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePrinterPayload {
  name: string;
  ipAddress: string;
  port: number;
  isKitchen: boolean;
  isEnabled: boolean;
  kitchenStationId?: string | null;
  assignedUserId?: string | null;
}