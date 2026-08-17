import type { Category } from "@/features/menu/types";
import { useQuery } from "@tanstack/react-query";
import { getCategories } from "../services/menu.service";

export const useCategories = () => {
    return useQuery<Category[]>({
      queryKey: ["menu-categories"],
      queryFn: getCategories,
    });
  };