import MenuForm from "@/features/menu/components/MenuForm";
import { UtensilsCrossed } from "lucide-react";



export default function AddMenuItemPage(){
 return(
  <div>

    <div className="mb-8 flex items-center justify-between max-w-7xl mx-auto">

          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Add Menu Item
            </h1>

            <p className="text-slate-500 mt-2">
              Create a new food or beverage item.
            </p>
          </div>

          <div className="hidden md:flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-100 text-orange-700">
            <UtensilsCrossed size={28} />
          </div>
        </div>
<div className="mx-auto max-w-5xl">
          <MenuForm />

</div>
  </div>
        
 )
  }