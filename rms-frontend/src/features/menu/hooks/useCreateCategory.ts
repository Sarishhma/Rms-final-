import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCategory, } from "../services/menu.service";
import type { Category } from "../types";

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,

    onSuccess: (newCategory) => {
      queryClient.setQueryData<Category[]>(["menu-categories"], (old = []) => [
        ...old,
        newCategory,
      ]);
    },
  });
};
