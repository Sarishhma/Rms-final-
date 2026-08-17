

export type { CustomerFormData } from "@/zod/table.schema";

export interface CreateCustomerPayload {
  name: string;
  phone: string;
  email?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomersResponse {
  success: boolean;
  data: Customer[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export interface  UpdateCustomerPayload{
name?: string;
phone?:string;
email?: string;
isActive?:boolean;
}