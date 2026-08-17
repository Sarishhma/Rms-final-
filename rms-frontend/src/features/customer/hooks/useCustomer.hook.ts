import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { customerService } from "../services/customer.service";

export const useCustomers = (page: number, limit: number = 20) => {
  return useQuery({
    queryKey: ["customers", page, limit],
    queryFn: () => customerService.getAll(page, limit),
    placeholderData: keepPreviousData,
  });
};
