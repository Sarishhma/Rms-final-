import { useNavigate } from "react-router-dom";

import type{ MenuItem } from "@/features/menu/types"
import { useState } from "react";
import { addToCart } from "@/redux/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

interface ItemProductProps {
  item: MenuItem;
  rank: number;
  tableNumber?: number;
}



export default function ItemCard({
  item,
  rank,
}: ItemProductProps) {
  const [showTableModal,setShowTableModal] = useState(false);

  const selectedTable = useSelector((state: RootState) => state.table.selectedTable);
    //for cartSlice
    const dispatch=useDispatch()
  const navigate = useNavigate();
const handleAdd = () => {
  if (selectedTable === null) {
    setShowTableModal(true);
    return;
  }

  dispatch(addToCart({
  id:          item.id,
  variantId:   null,
  name:        item.name,
  price:       item.basePrice ?? item.variants?.[0]?.price ?? 0,
  category:    item.category?.name ?? "",
  description: item.description ?? "",
}));
};


    
  

  
  
  if(showTableModal){
        return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
          <h3 className="text-lg font-bold mb-2">Table Required</h3>
          <p className="text-gray-600 mb-4">
            Please select a table before adding items.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/tables")}
              className="flex-1 bg-orange-500 text-white py-2 rounded-lg"
            >
              Choose Table
            </button>
            <button
              onClick={() => setShowTableModal(false)}
              className="flex-1 border border-gray-300 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className=" group w-full flex-shrink-0  rounded-3xl overflow-hidden bg-white/70 border border-white/60 shadow-sm hover:shadow-md transition-all duration-300 hover:transition-y-1">
      
      {/* image — full bleed top */}
      <div className=" relative w-full  h-40 overflow-hidden">
     
      </div>
    

      {/* content */}
      <div className="p-4 ">
        
        {/* category tag */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] font-medium text-[#5a7050] bg-[#E2E8CE] rounded-full px-2 py-0.5">
            {item.category?.name}
          </span>
          <span className="text-[10px] font-bold text-[#ACBFA4]">#{rank}</span>
        </div>

        {/* name */}
       < h3 className="text-[16px] font-bold text-[#1f1f1f] leading-snug mb-2 line-clamp-2">
          {item.name}
        </h3>

        {/* orders */}
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-[15px] font-bold text-[#FF7F11]">
            {item.orders}
          </span>
          <span className="text-[10px] text-[#ACBFA4]">orders today</span>
        </div>

        {/* button */}
        <button
          onClick={handleAdd}
          className="w-full py-1.5 text-[11px] font-semibold rounded-lg border border-[#FF7F11] text-[#FF7F11] hover:bg-[#FF7F11] hover:text-white transition-colors"
        >
          + Add to Order
        </button>
      </div>
    </div>
  );
}
