import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMenuItem } from "../services/menu.service";
import type { MenuItem } from "@/features/menu/types";

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMenuItem(id),

    onSuccess: (_, id) => {
      queryClient.setQueryData<MenuItem[]>(["menu-items"], (old = []) =>
        old.filter((item) => item.id !== id),
      );
    },

    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    },
  });
};
