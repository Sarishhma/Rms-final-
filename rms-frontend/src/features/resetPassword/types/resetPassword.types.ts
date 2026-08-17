export interface  ResetPasswordPayload{
    userId:string;
    newPassword:string
}
export interface  ResetUserPasswordModalProps{
    open:boolean;
    onOpenChange:(open:boolean)=>void;
}