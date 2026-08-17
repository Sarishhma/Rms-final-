import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Table } from "@/features/tables/types";
import { tableService } from "@/features/tables/services/table.service";
import { getTables, updateTable } from "../services/table.service";
import toast from "react-hot-toast";

export const useTables = () => {
  return useQuery({
    queryKey: ["tables"],
    queryFn: getTables,
  });
};

export const useUpdateTable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (table: Table) => updateTable(table),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
};

export const useTableActions = () => {
  const queryClient = useQueryClient();

  const releaseTable = useMutation({
    mutationFn: (tableId: string) => tableService.release(tableId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });

  return { releaseTable };
};

export const useCreateTable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tableService.create,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tables"],
      });
    },
  });
};

export const useDeleteTable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tableService.deleteTable(id),

    onSuccess: () => {
      toast.success("Table deleted successfully");

      // refresh tables list
      queryClient.invalidateQueries({
        queryKey: ["tables"],
      });
    },

    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete table");
    },
  });
};
