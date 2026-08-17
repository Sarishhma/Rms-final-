import api from "@/lib/client";
import type { ResetPasswordPayload } from "../types/resetPassword.types";
import { handleApiError } from "@/features/shared/errorhandle";

export const resetStaffPassword = async(payload:ResetPasswordPayload)=>{
  try{
      const res = await api.post("/api/auth/reset-password",payload)
    return res.data
  }catch(error){
    handleApiError(error,"resetstaff password api error")
    throw error;
  }
}