import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Logoutall } from "../service/auth"


export const useLogOutAll=()=>{
    const queryClient = useQueryClient();
return useMutation({
    mutationFn:Logoutall,
    onSettled:()=>{
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken")
        queryClient.clear()
    }
})
}