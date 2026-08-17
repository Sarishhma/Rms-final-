import api from "@/lib/client";
import type { LoginTypeForm } from "../schema/auth.schema";
import { handleApiError } from "@/features/shared/errorhandle";
import { useQueryClient } from "@tanstack/react-query";

export const login = async (data: LoginTypeForm) => {
  try {
    const res = await api.post("/api/auth/login", {
      email: data.Email,
      password: data.Password,
    });
    return res.data;
  } catch (error) {
    handleApiError(error, "login error");
    throw error;
  }
};

// src/hooks/useLogout.ts
export const useLogout = () => {
  const queryClient = useQueryClient();

  return async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      await api.post("/api/auth/logout", { refreshToken }); // revoke on server
    } catch {
      /* proceed anyway */
    }

    localStorage.clear();
    queryClient.clear();

    window.dispatchEvent(new Event("force-logout"));
  };
};

export const Logoutall = async (): Promise<void> => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    const res = await api.post("/api/auth/logout-all", { refreshToken });
    return res.data;
  } catch (error) {
    handleApiError(error, "logout-all devices error");
    throw error;
  }
};
export const authMe = async () => {
  try {
    const res = await api.get("/api/auth/me");
    return res.data.data;
  } catch (error) {
    handleApiError(error, "auth error");
    throw error;
  }
};

export const getMe = async (token: string | null) => {
  const res = await api.get("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};
