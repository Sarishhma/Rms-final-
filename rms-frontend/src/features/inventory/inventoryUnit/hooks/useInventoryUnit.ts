import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryUnitService } from "../services/inventoryUnit.service";
import { inventoryUnitConversionService } from "../services/inventoryUnitConversion.service";

export const useInventoryUnit = (params: {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
} = {}) => {
  const queryClient = useQueryClient();

  const {
    data: responseData,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["inventoryUnits", params],
    queryFn: () => inventoryUnitService.getAll(params),
    placeholderData: (previousData) => previousData,
  });

  const inventoryUnits = responseData?.data ?? [];
  const meta = responseData?.meta;

  const createInventoryUnitMutation = useMutation({
    mutationFn: inventoryUnitService.create,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["inventoryUnits"],
      });
    },
  });

  const adjustInventoryUnitMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: any;
    }) => inventoryUnitService.adjust(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryUnits"] });
    },
  });

  const deleteInventoryUnitMutation = useMutation({
    mutationFn: (id: string) => inventoryUnitService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryUnits"] });
    },
  });

  const createConversionMutation = useMutation({
    mutationFn: inventoryUnitConversionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryUnits"] });
    },
  });

  const deleteConversionMutation = useMutation({
    mutationFn: inventoryUnitConversionService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryUnits"] });
    },
  });

  const adjustConversionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      inventoryUnitConversionService.adjust(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryUnits"] });
    },
  });

  return {
    inventoryUnits,
    meta,
    loading,
    error: error?.message ?? null,
    fetchStocks: refetch,

    // Create
    createInventoryUnit: createInventoryUnitMutation.mutateAsync,
    createLoading: createInventoryUnitMutation.isPending,
    adjustInventoryUnit: adjustInventoryUnitMutation.mutateAsync,
    adjustLoading: adjustInventoryUnitMutation.isPending,
    deleteInventoryUnit: deleteInventoryUnitMutation.mutateAsync,
    deleteLoading: deleteInventoryUnitMutation.isPending,

    // Conversions
    createConversion: createConversionMutation.mutateAsync,
    createConversionLoading: createConversionMutation.isPending,
    deleteConversion: deleteConversionMutation.mutateAsync,
    deleteConversionLoading: deleteConversionMutation.isPending,
    adjustConversion: adjustConversionMutation.mutateAsync,
    adjustConversionLoading: adjustConversionMutation.isPending,
  };
};
