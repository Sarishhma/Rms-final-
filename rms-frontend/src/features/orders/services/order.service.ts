import api from "@/lib/client";
import type { Order, OrderChannel, OrderStatus } from "@/features/orders/types";
type PaymentPayload = {
  billId: string;
  method: string;
  amount: number;
  reference?: string;
  note?: string;
};
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

export type OrdersQuery = {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  channel?: OrderChannel;
  tableId?: string;
  customerId?: string;
  tableName?: string;
};

export const orderService = {
  getAll: async (params: OrdersQuery): Promise<PaginatedResponse<Order>> => {
    const response = await api.get<PaginatedResponse<Order>>("/api/orders", {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 50,
        status: params.status,
        channel: params.channel,
        tableId: params.tableId,
        customerId: params.customerId,
        tableName: params.tableName,
      },
    });
    return response.data;
  },

  getById: async (id: string) => {
    const res = await api.get(`/api/orders/${id}`);
    return res.data;
  },

  update: async (id: string, payload: any) => {
    const res = await api.patch(`/api/orders/${id}`, payload);
    return res.data;
  },

  cancel: async (id: string, reason: string) => {
    const res = await api.post(`/api/orders/${id}/cancel`, {
      reason,
    });
    return res.data;
  },

  makePayment: async (payload: PaymentPayload) => {
    const res = await api.post(`/api/payments/`, payload);

    return res.data;
  },
};

export const getOrderById = async (orderId: string): Promise<Order> => {
  const res = await api.get(`/api/orders/${orderId}`);
  return res.data.data;
};

export const getOrders = async (): Promise<Order[]> => {
  const res = await api.get("/api/orders");
  return res.data.data;
};
import type { CreateOrderPayload } from "@/features/orders/types";

export const createOrder = async ({
  payload,
  actionKey,
}: {
  payload: CreateOrderPayload;
  actionKey: string;
}) => {
  try {
    const createRes = await api.post("/api/orders", payload, {
      headers: {
        "Idempotency-Key": actionKey,
      },
    });

    const createdOrder = createRes.data?.data;

    if (!createdOrder || !createdOrder.id) {
      throw new Error(
        "Server responded successfully, but no order data was returned.",
      );
    }
    return { createdOrder };
  } catch (error: any) {
    throw error;
  }
};
