import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CloseShiftPayload, CreateCashEventPayload, OpenShiftPayload } from "../types/shift.type";
import { postshiftservices } from "../service/shift.service";

export function useOpenShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OpenShiftPayload) =>
      postshiftservices.openShift(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
}
export function useCloseShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
      idempotencyKey,
    }: {
      id: string;
      payload: CloseShiftPayload;
      idempotencyKey: string;
    }) => postshiftservices.closeShifts(id, payload, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
}
export function useCreateCashEvent(){
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn:({   
      id,
      payload,
      idempotencyKey
    }:{
        id:string,
        payload:CreateCashEventPayload,
        idempotencyKey:string
      })=>postshiftservices.createCashEvent(id,payload,idempotencyKey),
      onSuccess:()=>{
        queryClient.invalidateQueries({queryKey:["shifts"]})
      }
  })
}
