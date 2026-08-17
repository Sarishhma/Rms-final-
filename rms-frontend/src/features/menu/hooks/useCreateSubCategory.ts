import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSubCategory} from "../services/menu.service";
import type { Category } from "../types";

export const useCreateSubCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSubCategory,

    onSuccess: (newSubCategory) => {
      queryClient.setQueryData<Category[]>(["menu-categories"], (old = []) =>
        old.map((category) => {
          const safeSubs = Array.isArray(category.subcategories)
            ? category.subcategories
            : [];

          if (category.id === newSubCategory.categoryId) {
            return {
              ...category,
              subcategories: [...safeSubs, newSubCategory],
            };
          }

          return {
            ...category,
            subcategories: safeSubs,
          };
        }),
      );
    },
  });
};
