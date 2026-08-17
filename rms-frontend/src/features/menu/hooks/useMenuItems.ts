import { useQuery } from "@tanstack/react-query";
import { getMenuItems } from "../services/menu.service";

type UseMenuItemsParams = {
  page: number;
  limit?: number;
  categoryId?: string;
  search?: string;
};

export const useMenuItems = ({
  page,
  limit = 20,
  categoryId,
  search,
}: UseMenuItemsParams) => {
  return useQuery({
    queryKey: ["menu-items", page, limit, categoryId, search],

    queryFn: () => getMenuItems(page, limit, categoryId, search),

    placeholderData: (previousData) => previousData,
  });
};
