import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deletecustomer } from "../services/customer.service"

export const useDeleteCustomer =()=>{
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn:(id:string)=>deletecustomer(id),
        onSuccess:(_data,id)=>{
            queryClient.invalidateQueries({queryKey:["customers"]})
            queryClient.invalidateQueries({queryKey:["customers",id]})
        }
    })
}