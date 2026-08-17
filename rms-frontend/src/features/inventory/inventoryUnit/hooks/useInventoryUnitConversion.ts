import { inventoryUnitConversionService } from "../services/inventoryUnitConversion.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useInventoryUnitConversion = () => {
  const queryClient = useQueryClient();

  const createUnitConversionMutation = useMutation({
    mutationFn: inventoryUnitConversionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryConversionUnits"] });
    },
  });

  const deleteUnitConversionMutation = useMutation({
    mutationFn:inventoryUnitConversionService.remove
  })

  return {
    createUnitConversion: createUnitConversionMutation.mutateAsync,
    createConversionLoading: createUnitConversionMutation.isPending,
    deleteUnitConversion: deleteUnitConversionMutation.mutateAsync,
    deleteConversionLoading: deleteUnitConversionMutation.isPending,
  };
};
