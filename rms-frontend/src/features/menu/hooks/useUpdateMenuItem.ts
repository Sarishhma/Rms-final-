import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateMenuItem,
  type UpdateMenuPayload,
} from "../services/menu.service";

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMenuPayload }) =>
      updateMenuItem(id, payload),

    onSuccess: () => {
      // refresh menu list
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    },
  });
};
