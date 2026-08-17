import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // ← was 1000 * 60 (60s). Now data is always considered stale
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: true, // ← was false. Now remounting a page always re-fetches stale data
      retry: (failureCount, error: any) => {
        if (error?.response?.status) {
          const status = error.response.status;
          if (
            status === 401 ||
            status === 403 ||
            status === 404 ||
            status === 422
          ) {
            return false;
          }
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 1;
      },
    },
  },
});
