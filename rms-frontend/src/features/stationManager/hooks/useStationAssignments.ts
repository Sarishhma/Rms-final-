import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stationAssignmentService } from "../services/stationAssignment.service";

import type { SaveAssignmentsPayload } from "../services/stationAssignment.service";
import type { MenuItem } from "@/features/menu/types";
import { getMenuItems } from "@/features/menu/services/menu.service";

export const useStationAssignments = (stationId: string | null) => {
  return useQuery({
    queryKey: ["station-assignments", stationId],
    queryFn: () => {
      if (!stationId) throw new Error("Station ID is required");
      return stationAssignmentService.getAssignments(stationId);
    },
    enabled: !!stationId,
  });
};

export const useSaveStationAssignments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      stationId,
      payload,
    }: {
      stationId: string;
      payload: SaveAssignmentsPayload;
    }) => stationAssignmentService.saveAssignments(stationId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["station-assignments", variables.stationId],
      });
    },
  });
};




export const useCatalogMenuItems = () => {
  return useQuery({
    queryKey: ["catalog-menu-items"],
    queryFn: async () => {
      const allItems: MenuItem[] = [];
      let currentPage = 1;
      const LIMIT = 50; // Max per page
      let hasMore = true;
     

      try {
        while (hasMore) {
          const response = await getMenuItems(currentPage, LIMIT);
          
          // Check if response has items
          if (response.menuItems && response.menuItems.length > 0) {
            allItems.push(...response.menuItems);
          } else {
            // No more items
            hasMore = false;
            break;
          }

          // Check pagination meta
          if (response.meta) {
            const totalItems = response.meta.total || 0;
            const totalPages = Math.ceil(totalItems / LIMIT);
            hasMore = currentPage < totalPages;
          } else {
            // If no meta, assume one page
            hasMore = false;
          }

          currentPage++;
        }

        return allItems;
      } catch (err) {
        console.error("Failed to fetch menu items:", err);
        throw err;
      }
    },
    // Cache the data for 10 minutes before refetching
    staleTime: 10 * 60 * 1000,
    // Keep data in cache for 10 minutes
    gcTime: 10 * 60 * 1000,
    // Show a custom error message
    meta: {
      errorMessage: "Failed to load menu catalog. Please try again.",
    },
  });
};
