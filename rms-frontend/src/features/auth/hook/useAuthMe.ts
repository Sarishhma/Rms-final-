// hooks/useAuthMe.ts
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/client";

interface UseAuthMeOptions {
  enabled?: boolean;
}

export function useAuthMe({ enabled = true }: UseAuthMeOptions = {}) {
  const token = localStorage.getItem("accessToken");

  return useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await api.get("/api/auth/me");
      return res.data;
    },
    enabled: enabled && !!token,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}
