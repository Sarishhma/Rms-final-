import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { stockService } from "@/features/stock/services/stock.service";

export const useStock = () => {
  const queryClient = useQueryClient();

  const {
    data: stocks = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["stocks"],
    queryFn: stockService.getAll,
  });

  const createStockMutation = useMutation({
    mutationFn: stockService.create,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stocks"],
      });
    },
  });

const adjustStockMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        remainingQty: number;
        reason: string;
      };
    }) => stockService.adjust(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stocks"],
      });
    },
  });

 return {
    stocks,
    loading,
    error: error?.message ?? null,
    fetchStocks: refetch,

    // Create
    createStock: createStockMutation.mutateAsync,
    createLoading: createStockMutation.isPending,
adjustStock: adjustStockMutation.mutateAsync,
    adjustLoading: adjustStockMutation.isPending,
  
  };
};