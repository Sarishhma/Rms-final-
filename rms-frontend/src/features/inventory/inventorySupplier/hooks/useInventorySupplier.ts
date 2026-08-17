import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventorySupplierService } from "../services/inventorySupplier.service";

export const useInventorySupplier = (params: {
  page?: number;
  limit?: number;
  search?: string;
} = {}) => {
  const queryClient = useQueryClient();

  const {
    data: responseData,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["inventorySuppliers", params],
    queryFn: () => inventorySupplierService.getAll(params),
  });

  const inventorySuppliers = responseData?.data ?? [];
  const meta = responseData?.meta;

  const createSupplierMutation = useMutation({
    mutationFn: inventorySupplierService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventorySuppliers"] });
    },
  });

  const adjustSupplierMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      inventorySupplierService.adjust(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventorySuppliers"] });
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id: string) => inventorySupplierService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventorySuppliers"] });
    },
  });

  return {
    inventorySuppliers,
    meta,
    loading,
    error: error?.message ?? null,
    refetch,
    createSupplier: createSupplierMutation.mutateAsync,
    createLoading: createSupplierMutation.isPending,
    adjustSupplier: adjustSupplierMutation.mutateAsync,
    adjustLoading: adjustSupplierMutation.isPending,
    deleteSupplier: deleteSupplierMutation.mutateAsync,
    deleteLoading: deleteSupplierMutation.isPending,
  };
};
