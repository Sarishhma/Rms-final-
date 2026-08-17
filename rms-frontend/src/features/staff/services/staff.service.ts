import api from "@/lib/client";

export type StaffRole =
  | "ADMIN"
  | "CASHIER"
  | "WAITER"
  | "KITCHEN"
  | "CASHIER_WAITER";

export interface Staff {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
}

export interface CreateStaffPayload {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
}

export interface UpdateRolePayload {
  userId: string;
  role: StaffRole;
}

export const getStaff = async (): Promise<Staff[]> => {
  const res = await api.get("/api/auth/users");
  return res.data.data;
};

export const createStaff = async (
  payload: CreateStaffPayload
): Promise<Staff> => {
  const res = await api.post("/api/auth/staff", payload);
  return res.data.data;
};

export const updateStaffRole = async (
  payload: UpdateRolePayload
) => {
  const res = await api.patch("/api/auth/users/role", payload);
  return res.data;
};