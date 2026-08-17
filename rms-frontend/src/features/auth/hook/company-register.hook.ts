import api from "@/lib/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

type RegisterCompanyPayload = {
  name: string;
  slug: string;
  maxUsers?: number;
  businessName?: string;
  businessAddress?: string;
  phoneNumber?: string;
  taxRegistrationNumber?: string;
  currency?: string;
};
export const useRegisterCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterCompanyPayload) =>
      api.post("/api/auth/register-company", payload),

    onSuccess: () => {
      toast.success("Company registered successfully");

      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
    },

    retry: false,
  });
};
