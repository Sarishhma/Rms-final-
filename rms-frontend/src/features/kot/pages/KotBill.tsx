// import { useEffect, useRef, useState } from "react";
// import {  useNavigate } from "react-router-dom";
// import { Printer, ArrowLeft, CheckCircle } from "lucide-react";
// import { LoadingSpinner } from "@/features/shared/LoadingSpinner";
// import { useAppDispatch, useAppSelector } from "@/redux/hooks";
// import { clearLatestKotDiff } from "@/redux/orderSlice";






// export default function KotBill() {
//   const navigate = useNavigate();
//   const dispatch = useAppDispatch();
//   const kotDiff = useAppSelector((state) => state.orders.latestKotDiff);
//   const [printMode, setPrintMode] = useState<"added" | "full">(
//     kotDiff && kotDiff.length > 0 ? "added" : "full",
//   );
//   const printRef = useRef<HTMLDivElement>(null);


  
//   useEffect(() => {
//     return () => {
//       dispatch(clearLatestKotDiff()); // Runs on unmount
//     };
//   }, [dispatch]);

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
//         <LoadingSpinner message="Generating KOT..." size="lg" />
//       </div>
//     );
//   }

//   if (isError) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
//         <div className="text-center max-w-md mx-auto px-4">
//           <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
//             <svg
//               className="w-10 h-10 text-red-500"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//               />
//             </svg>
//           </div>
//           <p className="text-red-600 font-semibold mb-2">
//             Failed to load order
//           </p>
//           <p className="text-gray-500 text-sm mb-6">
//             Please check your connection and try again
//           </p>
//           <button
//             onClick={() => navigate("/active-orders")}
//             className="inline-flex items-center gap-2 bg-white text-gray-700 text-sm font-medium px-5 py-2.5 rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-all"
//           >
//             <ArrowLeft size={16} />
//             Back to Orders
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
//       {/* Top Navigation Bar */}
//       <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
//         <div className="max-w-6xl mx-auto px-3 py-2">
//           <div className="flex items-center justify-between gap-3">
//             <button
//               onClick={() => navigate("/active-orders")}
//               className="flex items-center gap-1.5 text-gray-600 hover:text-gray-950 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-gray-100 text-xs sm:text-sm font-bold border border-gray-200"
//             >
//               <ArrowLeft size={14} className="shrink-0" />
//               <span>Back to Orders</span>
//             </button>

//             <div className="flex items-center gap-3">
//               {/* KOT Print Mode Toggle (only shown when there are session edits) */}
//               {kotDiff && kotDiff.length > 0 && (
//                 <div className="flex items-center bg-gray-150 p-0.5 rounded-lg border border-gray-200">
//                   <button
//                     onClick={() => setPrintMode("added")}
//                     className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
//                       printMode === "added"
//                         ? "bg-white text-orange-600 shadow-sm border border-gray-200/50"
//                         : "text-gray-500 hover:text-gray-800"
//                     }`}
//                   >
//                     Added Only ({kotDiff.length})
//                   </button>
//                   <button
//                     onClick={() => setPrintMode("full")}
//                     className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
//                       printMode === "full"
//                         ? "bg-white text-orange-600 shadow-sm border border-gray-200/50"
//                         : "text-gray-500 hover:text-gray-800"
//                     }`}
//                   >
//                     Full KOT
//                   </button>
//                 </div>
//               )}

//               <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
//                 <CheckCircle size={12} className="text-green-600" />
//                 <span>Order #{data.oredrNumber}</span>
//               </div>

//               <button
//                 onClick={handlePrint}
//                 className="flex items-center gap-1.5 bg-green-600 text-white px-3.5 py-1.5 rounded-lg shadow-sm hover:bg-green-700 transition-all active:scale-95 font-bold text-xs sm:text-sm cursor-pointer"
//               >
//                 <Printer size={14} className="shrink-0" />
//                 <span>Print KOT</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Receipt Preview */}
//       <div className="py-6 px-4">
//         <div className="max-w-md mx-auto">
//           {/* Preview Header */}
//           <div className="text-center mb-4">
//             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
//               KOT Preview
//             </h3>
//             <div className="w-8 h-0.5 bg-green-500 mx-auto"></div>
//           </div>

//           {/* Receipt Card - This is what will be printed */}
//           <div className="print-receipt receipt-paper shadow-2xl border border-gray-200/50 w-full max-w-[300px] sm:max-w-[80mm] mx-auto my-6 bg-white overflow-hidden">
//             <div
//               ref={printRef}
//               className="font-mono text-[11px] leading-relaxed text-black bg-white w-full"
//               style={{ padding: "16px 12px", margin: "0 auto" }}
//             >
//               {/* Header Section */}
//               <div className="text-center mb-3">
//                 <p className="font-bold text-sm tracking-wide uppercase">
//                   KITCHEN ORDER TICKET (KOT)
//                 </p>
//                 <p className="text-[10px] text-gray-700 mt-0.5">
//                   {data.companyName}
//                 </p>
//               </div>

//               <div className="border-t border-dashed border-black my-2" />

//               {/* Meta Info */}
//               <div className="mb-3 space-y-0.5 text-[10px] text-black">
//                 <div className="flex justify-between">
//                   <span>DATE:</span>
//                   <span>{data.date}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span>TABLE:</span>
//                   <span className="font-extrabold text-sm">
//                     {data.tableName}
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span>ORDER ID:</span>
//                   <span>{data.oredrNumber}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span>Pax:</span>
//                   <span>{data.guestCount}</span>
//                 </div>
//               </div>

//               <div className="border-t border-dashed border-black my-2" />

//               {/* Items Header */}
//               <div className="flex justify-between font-bold text-[11px] mb-1 text-black">
//                 <span className="flex-1 text-left">ITEM</span>
//                 <span className="w-7 text-center">QTY</span>
//               </div>

//               <div className="border-t border-black my-1" />

//               {/* Items List WITH SPECIAL INSTRUCTIONS */}
//               <div className="space-y-1 mb-3 text-black">
//                 {data.items.map((item, i) => (
//                   <div key={i}>
//                     <div className="flex justify-between text-[11px] items-start py-0.5">
//                       <span className="flex-1 text-left truncate pr-1">
//                         {item.name}
//                       </span>
//                       <span className="w-7 text-center font-bold">
//                         {item.quantity}
//                       </span>
//                     </div>
//                     {item.specialInstructions && (
//                       <div className="text-[9px] text-gray-600 italic pl-1 -mt-0.5 mb-0.5">
//                         Note: {item.specialInstructions}
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>

//               <div className="border-t border-dashed border-black my-2" />

//               {/* Footer */}
//               <div className="text-center mt-3 text-black">
//                 <p className="font-bold text-xs tracking-wide">KITCHEN COPY</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
