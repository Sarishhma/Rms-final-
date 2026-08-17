import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchKots, fetchKotById, updateKot } from "../services/Kot.services";
import type { KotListResponse, Kot, UpdateKotPayload } from "@/features/kot/types";

/**
 * Hook to retrieve all KOTs with optional pagination parameters
 */
export const useGetKots = (params?: { page?: number; limit?: number }) => {
  return useQuery<KotListResponse>({
    queryKey: ["kots", params],
    queryFn: () => fetchKots(params),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: true,
    enabled: !!localStorage.getItem("accessToken"),
  });
};

/**
 * Hook to retrieve a single KOT by ID (details & items list)
 */
export const useGetKotById = (id: string | null) => {
  return useQuery<Kot>({
    queryKey: ["kot", id],
    queryFn: () => fetchKotById(id!),
    enabled: !!id && !!localStorage.getItem("accessToken"),
  });
};

/**
 * Hook to update KOT status (e.g., Serve a KOT)
 */
export const useUpdateKot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateKotPayload }) =>
      updateKot(id, payload),
    onSuccess: (data) => {
      // toast.success(`KOT #${data.kotNumber} updated successfully!`);
      // Invalidate queries to refresh listing and detail pages
      queryClient.invalidateQueries({ queryKey: ["kots"] });
      queryClient.invalidateQueries({ queryKey: ["kot", data.id] });
    },
    onError: () => {
      console.error("Failed to update KOT");
    },
  });
};
