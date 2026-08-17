import api from "@/lib/client";
import type { CreateCustomerPayload, UpdateCustomerPayload } from "../types";
import type { NormalizedError } from "@/lib/api/interceptor";

export const customerService = {

  getAll: async (page:number=1,limit:number=20) => {
    const res = await api.get("/api/customers/",{
 params:{page,limit}})
    return res.data;
    
   
  },

  getById: async (id: string) => {
    const res = await api.get(`/api/customers/${id}`);
    return res.data;
  },
};

export const lookup = async (phone: string) => {
  try {
    const res = await api.get("/api/customers/lookup", {
      params: { phone },
    });
    return res.data.data;
  } catch (error) {
       throw error as NormalizedError;
  }
};



export const update = async(id:string,payload:UpdateCustomerPayload)=>{
  try{
    const res = await api.patch(`/api/customers/${id}`,payload)
    return res.data.data
  }catch(error){
   throw error as NormalizedError;
  }
}

export const deletecustomer = async (id:string)=>{
try{
  const res = await api.delete(`/api/customers/${id}`)
  return res.data.data
}catch(error){
    throw error as NormalizedError;
}
}
export const create = async (payload: CreateCustomerPayload) => {
  try {
    const res = await api.post("/api/customers", payload);
    return res.data.data;
  } catch (error) {
       throw error as NormalizedError;
  }
};