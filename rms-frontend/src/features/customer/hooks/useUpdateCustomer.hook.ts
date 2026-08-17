import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UpdateCustomerPayload } from "../types";
import { update } from "../services/customer.service";
import toast from "react-hot-toast";

export const useUpdateCustomer =()=>{
const queryClient = useQueryClient();
return useMutation({
    mutationFn:({id,payload}:{id:string;payload:UpdateCustomerPayload})=>
      update(id,payload),
      onSuccess:(_data,variables)=>{
      queryClient.invalidateQueries({queryKey:['customers']})
      queryClient.invalidateQueries({queryKey:['customers',variables.id]})
      toast.success("successfully customer updated")  
    },onError:()=>{
        toast.error("Failed customer update")
    }
})
}
