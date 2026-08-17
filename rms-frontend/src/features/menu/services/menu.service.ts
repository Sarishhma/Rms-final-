import api from "@/lib/client";
import { handleApiError } from "@/features/shared/errorhandle";
import type { Category, MenuItem, Subcategory } from "@/features/menu/types";
import type { CreateCustomerPayload } from "@/features/customer/types";



export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MenuItemsApiResponse {
  success: boolean;
  data: MenuItem[];
  meta: PaginationMeta;
}

export interface CreateMenuItemPayload {
  name: string;
  sku: string;
  categoryId: string;
  subcategoryId: string;
  basePrice: number;
}

export const getCategories = async (): Promise<Category[]> => {
  const res = await api.get("/api/menu/categories");

  return res.data.data;
};

export const createCategory = async (name: string): Promise<Category> => {
  const res = await api.post("/api/menu/categories", { name });

  return res.data.data;
};

export const createSubCategory = async (payload: {
  categoryId: string;
  name: string;
}): Promise<Subcategory> => {
  const res = await api.post("/api/menu/subcategories", payload);

  return res.data.data;
};

export const createMenuItem = async (payload: CreateMenuItemPayload) => {
  const res = await api.post("/api/menu/items", payload);

  return res.data.data;
};

export const getMenuItems = async (
  page = 1,
  limit = 50,
  categoryId?: string,
  search?: string,
) => {
  const res = await api.get<MenuItemsApiResponse>("/api/menu/items", {
    params: {
      page,
      limit,

      ...(categoryId && { categoryId }),
      ...(search && { search }),
    },
  });

  return {
    menuItems: res.data.data ?? [],
    meta: res.data.meta,
  };
};

export type UpdateMenuPayload = {
  name?: string;
  categoryId?: string;
  basePrice?: number;
  description?: string;
  subcategoryId?: string;
  sku?: string;
};

export const updateMenuItem = async (
  id: string,
  payload: UpdateMenuPayload,
) => {
  const { data } = await api.patch(`/api/menu/items/${id}`, payload);
  return data;
};

export const deleteMenuItem = async (id: string) => {
  const { data } = await api.delete(`/api/menu/items/${id}`);
  return data;
};

export const fetchMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const res = await api.get("/api/menu/items");
    const items = res.data.data;

    // Convert prices from paisa to rupees
    const convertedItems = items.map((item: any) => ({
      ...item,
      basePrice: item.basePrice / 100,
      // If variants exist and have price field
      variants: item.variants?.map((variant: any) => ({
        ...variant,
        price: variant.price ? variant.price / 100 : variant.price,
      })),
    }));

    return convertedItems;
  } catch (error) {
    handleApiError(error, "fetchmenu Items");
    throw error;
  }
};

export const cancelOrder = async (id: string, reason: string) => {
  try {
    const { data } = await api.post(`/api/orders/${id}/action`, {
      action: "CANCEL",
      reason,
    });
    return data;
  } catch (error) {
    handleApiError(error, `Cancel order #${id}`);
    throw error;
  }
};

export const releaseTable = async (tableId: string) => {
  try {
    const { data } = await api.post(`/api/tables/${tableId}/release`);
    return data;
  } catch (error) {
    handleApiError(error, `Release table #${tableId}`);
    throw error;
  }
};

export const confirmOrder = async (orderId: string) => {
  try {
    const { data } = await api.post(`/api/orders/${orderId}/action`, {
      action: "CONFIRM",
    });
    return data;
  } catch (error: any) {
    handleApiError(error, `Confirm order #${orderId}`);
    throw error;
  }
};
export const updateOrder = async (id: string, payload: any) => {
  try {
    const { data } = await api.patch(`/api/orders/${id}`, payload);
    return data;
  } catch (error) {
    handleApiError(error, "updateorder error");
    throw error;
  }
};

export const lookupCustomer = async (phone: string) => {
  try {
    const res = await api.get("/api/customers/lookup", {
      params: { phone },
    });
    return res.data.data;
  } catch (error: any) {
    console.error("Lookup customer failed:", error);
    throw error;
  }
};

export const createCustomer = async (payload: CreateCustomerPayload) => {
  try {
    const res = await api.post("/api/customers", payload);
    return res.data.data;
  } catch (error: any) {
    console.error("Create customer failed:", error);
    throw error;
  }
};
