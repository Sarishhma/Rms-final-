import api from "@/lib/client";
import type { ChangePasswordPayload } from "../types/changePassword.types";
import { handleApiError } from "@/features/shared/errorhandle";

export const changePassword = async (payload:ChangePasswordPayload)=>{
    try{
   const res = await api.post("/api/auth/change-password",payload)
    return res.data
    }catch(error){
        handleApiError(error,"api error from change password");
        throw error
    }
}