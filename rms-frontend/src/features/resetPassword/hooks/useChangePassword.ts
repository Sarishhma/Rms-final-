import { useMutation } from "@tanstack/react-query"
import type { ChangePasswordPayload } from "../types/changePassword.types"
import { changePassword } from "../service/changePassword.service"


export const useChangePassword =()=>{
    return useMutation({
        mutationFn:(payload:ChangePasswordPayload)=>changePassword(payload),
 
    })
}