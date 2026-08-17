import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createStaff,
  getStaff,
  type Staff,
} from "@/features/staff/services/staff.service";
import { updateStaffRole } from "@/features/staff/services/staff.service";
import type { UpdateRolePayload } from "@/features/staff/services/staff.service";

export const useStaff = () => {
  return useQuery<Staff[]>({
    queryKey: ["staff"],
    queryFn: getStaff,
  });
};

export const useUpdateStaffRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateRolePayload) => updateStaffRole(payload),

    onSuccess: () => {
      // refresh staff list after update
      queryClient.invalidateQueries({
        queryKey: ["staff"],
      });
    },
  });
};

export const useCreateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStaff,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["staff"],
      });
    },
  });
};
