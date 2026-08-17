import api from "@/lib/client";


export interface StationAssignmentItem {
  id: string;
  name: string;
  categoryId?: string; // present in subcategories
}

export interface StationAssignmentData {
  categories: StationAssignmentItem[];
  subcategories: StationAssignmentItem[];
  menuItems: StationAssignmentItem[];
}

export interface StationAssignmentResponse {
  success: boolean;
  data: StationAssignmentData;
}

export interface SaveAssignmentsPayload {
  categoryIds: string[];
  subcategoryIds: string[];
  menuItemIds: string[];
}

export const stationAssignmentService = {
  getAssignments: async (stationId: string): Promise<StationAssignmentResponse> => {
    const res = await api.get<StationAssignmentResponse>(
      `/api/kitchen-stations/${stationId}/assignments`
    );
    return res.data;
  },

  saveAssignments: async (
    stationId: string,
    payload: SaveAssignmentsPayload
  ): Promise<StationAssignmentResponse> => {
    const res = await api.put<StationAssignmentResponse>(
      `/api/kitchen-stations/${stationId}/assignments`,
      payload
    );
    return res.data;
  },
};
