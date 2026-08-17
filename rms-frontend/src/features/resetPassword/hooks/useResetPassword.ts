import { useMutation } from "@tanstack/react-query"
import type { ResetPasswordPayload } from "../types/resetPassword.types"
import { resetStaffPassword } from "../service/resetPassword.service"
import toast from "react-hot-toast"

export const useResetPassword =()=>{
    return useMutation({
        mutationFn:(payload:ResetPasswordPayload)=>resetStaffPassword(payload),
        onSuccess:(_data)=>{
        },
        onError:(error:any)=>{
                 toast.error(
        error?.response?.data?.message || "Failed to reset password"
      );
        }
    })
}