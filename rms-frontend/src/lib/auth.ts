import api from "@/lib/client";

export const login = async (email: string, password: string) => {
  if (!email.trim() || !password) {
    throw new Error("Email and password are required");
  }

  const response = await api.post("/api/auth/login", {
    email,
    password,
  });

  const token =
    response.data?.data?.accessToken ||
    response.data?.accessToken ||
    response.data?.data;

  const refreshToken =
    response.data?.data?.refreshToken ||
    response.data?.refreshToken ||
    response.data?.data;
  if (!token) {
    throw new Error("Token not found in response");
  }

  localStorage.setItem("accessToken", token);
  localStorage.setItem("refreshToken", refreshToken);

  return token;
};
