import { useMutation } from "@tanstack/react-query";
import { paymentService } from "@/features/payments/services/payment.service";

export const usePayment = () => {
  const createPayment = useMutation({
    mutationFn: paymentService.create,
  });

  return { createPayment };
};