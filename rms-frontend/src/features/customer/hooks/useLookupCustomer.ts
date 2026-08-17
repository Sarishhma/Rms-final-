import { useQuery } from "@tanstack/react-query";
import { lookup } from "../services/customer.service";

export const useLookupCustomer = (phone: string) => {
  return useQuery({
    queryKey: ["customer", phone],
    queryFn: () => lookup(phone),
    enabled: phone.length >= 7,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
};
