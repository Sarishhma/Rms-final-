//for login
import { z} from "zod"
export const LoginSchema =z.object({
    Email:
    z.string().email("invalid email"),
    Password:
    z.string()
    .min(6,"Minimum 6 characters")
    .max(15,"Maximum 15 characters")
  

})
export type LoginTypeForm = z.infer<typeof LoginSchema>
//for signup
export const SignupSchema = z.object({
    Name:
    z.string()
    .min(2,"Minimum 2 character")
    .max(50,"Maximum 50 characters allowed"),
    Email:
    z.string()
    .email("invalid email"),
    Password:
    z.string()
    .min(6,"There should be atleast 6 characters")
    .max(15,"maximum 15 characters are allowed"),
    ConfirmPassword:
    z.string()
}).refine((data)=>data.Password === data.ConfirmPassword,{
    message:"password donot match",
    path:['ConfirmPassword']
})
export type SignupTypeForm =z.infer<typeof SignupSchema>