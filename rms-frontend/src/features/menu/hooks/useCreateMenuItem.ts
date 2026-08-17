import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMenuItem } from "../services/menu.service";

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    },
  });
};
