// import api from "@/lib/api";
// import { ReactElement, useState } from "react";
// import toast from "react-hot-toast";

// interface OrderItem {
//   menuItem: { id: number; name: string; price: number };
//   quantity: number;
//   notes: string;
// }

// interface Bill {
//   id: string;
//   billNumber: string;
//   subtotal: number;
//   discount: number;
//   serviceCharge: number;
//   grandTotal: number;
//   paid: number;
//   due: number;
//   status: "OPEN" | "PARTIALLY_PAID" | "PAID" | "VOIDED";
//   order: {
//     tablenumber: number;
//     items: OrderItem[];
//     time: string;
//   };
// }

// type PaymentMethod = "CASH" | "QR" | "CARD" | "MIXED";
// type DiscountType = "rs" | "pct";

// // all amounts from backend are in  units (paisa), divide by 100 to display
// const toRs = (: number) => ( / 100).toLocaleString();

// const METHOD_ICONS: Record<PaymentMethod, ReactElement> = {
//   CASH: (
//     <svg
//       width="16"
//       height="16"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="1.8"
//       strokeLinecap="round"
//     >
//       <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
//     </svg>
//   ),
//   CARD: (
//     <svg
//       width="16"
//       height="16"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="1.8"
//       strokeLinecap="round"
//     >
//       <rect x="2" y="5" width="20" height="14" rx="2" />
//       <line x1="2" y1="10" x2="22" y2="10" />
//     </svg>
//   ),
//   QR: (
//     <svg
//       width="16"
//       height="16"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="1.8"
//       strokeLinecap="round"
//     >
//       <rect x="3" y="3" width="7" height="7" />
//       <rect x="14" y="3" width="7" height="7" />
//       <rect x="3" y="14" width="7" height="7" />
//       <path d="M14 14h3v3M17 17v3M14 20h3" />
//     </svg>
//   ),
//   MIXED: (
//     <svg
//       width="16"
//       height="16"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="1.8"
//       strokeLinecap="round"
//     >
//       <path d="M2 12h20M12 2v20" />
//     </svg>
//   ),
// };

// export default function BillCard({ bill: initialBill }: { bill: Bill }) {
//   const [bill, setBill] = useState<Bill>(initialBill);
//   const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
//   const [reference, setReference] = useState("");
//   const [note, setNote] = useState("");
//   const [discountType, setDiscountType] = useState<DiscountType>("rs");
//   const [discountValue, setDiscountValue] = useState<number | "">("");
//   const [loading, setLoading] = useState(false);

//   // discount preview only — actual amounts come from backend
//   const previewDiscount =
//     discountValue === ""
//       ? bill.discount
//       : discountType === "rs"
//         ? Number(discountValue) * 100
//         : Math.round(bill.grandTotal * (Number(discountValue) / 100));

//   const previewDue = Math.max(
//     0,
//     bill.grandTotal - previewDiscount - bill.paid,
//   );

//   const handleApplyDiscount = async () => {
//     try {
//       const res = await api.patch(`/billing/${bill.id}`, {
//         discount: previewDiscount,
//       });
//       if (!res) throw new Error();
//       const updated = res.data;
//       setBill(updated); // refresh bill with server response
//       setDiscountValue("");
//       toast.success("Discount applied");
//     } catch {
//       toast.error("Failed to apply discount");
//     }
//   };

//   const handlePayment = async () => {
//     setLoading(true);
//     try {
//       const res = await api.post("/payments/", {
//         billId: bill.id,
//         method: paymentMethod,
//         amount: bill.due,
//         reference: reference || "",
//         note: note || "",
//       });
//       if (!res) throw new Error();
//       // refetch bill to get updated paid, due, status
//       const updatedBill = await api.get(`/billing/${bill.id}`).then((r) =>r.data);
//       setBill(updatedBill);
//       toast.success(
//         updatedBill.status === "PAID"
//           ? `Table ${bill.order.tablenumber} — fully paid!`
//           : `Payment recorded — Rs.${toRs(bill.due)} remaining`,
//       );
//     } catch {
//       toast.error("Payment failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const canPay = bill.status === "OPEN" || bill.status === "PARTIALLY_PAID";

//   return (
//     <>
//       <style>{`@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");`}</style>
//       <div
//         className="w-full max-w-[380px] bg-[#fafaf8] shadow-md mx-auto"
//         style={{ fontFamily: "Inter, sans-serif" }}
//       >
//         {/* torn top */}
//         <div className="h-4 relative overflow-hidden bg-[#fafaf8]">
//           <div
//             className="absolute bottom-0 left-0 right-0 h-4"
//             style={{
//               background: `radial-gradient(circle at 10px -4px, transparent 8px, #fafaf8 8px) repeat-x, linear-gradient(#E2E8CE, #E2E8CE)`,
//               backgroundSize: "20px 16px",
//             }}
//           />
//         </div>

//         <div className="px-6 pt-5 pb-6">
//           {/* header */}
//           <div className="text-center mb-5">
//             <p className="text-[22px] font-bold tracking-[0.12em] text-[#262626] uppercase">
//               Table {bill.order.tablenumber}
//             </p>
//             <p className="text-[11px] text-[#ACBFA4] tracking-widest mt-1">
//               Bill #{bill.billNumber}
//             </p>
//           </div>

//           <hr className="border-t border-dashed border-[#d0cdc8] my-3" />

//           {/* meta */}
//           <div className="space-y-1.5">
//             {[
//               { k: "Time", v: bill.order.time },
//               { k: "Status", v: bill.status, highlight: true },
//             ].map(({ k, v, highlight }) => (
//               <div key={k} className="flex justify-between">
//                 <span className="text-[13px] font-medium text-[#ACBFA4]">
//                   {k}
//                 </span>
//                 <span
//                   className={`text-[13px] font-bold ${
//                     highlight
//                       ? bill.status === "PAID"
//                         ? "text-[#4a7a3a]"
//                         : bill.status === "VOIDED"
//                           ? "text-red-400"
//                           : bill.status === "PARTIALLY_PAID"
//                             ? "text-blue-500"
//                             : "text-[#FF7F11]"
//                       : "text-[#262626]"
//                   }`}
//                 >
//                   {v}
//                 </span>
//               </div>
//             ))}
//           </div>

//           <hr className="border-t border-dashed border-[#d0cdc8] my-3" />

//           {/* items */}
//           <div className="flex text-[11px] font-semibold text-[#ACBFA4] tracking-wider uppercase pb-2 border-b border-[#e0ddd8] mb-1">
//             <span className="flex-1">Item</span>
//             <span className="w-10 text-center">Qty</span>
//             <span className="w-[85px] text-right">Price</span>
//           </div>
//           {bill.order.items.map((item) => (
//             <div key={item.menuItem.id} className="flex items-center py-1.5">
//               <span className="flex-1 text-[14px] font-medium text-[#262626]">
//                 {item.menuItem.name}
//               </span>
//               <span className="w-10 text-center text-[14px] font-bold text-[#FF7F11]">
//                 {item.quantity}
//               </span>
//               <span className="w-[85px] text-right text-[14px] font-semibold text-[#262626]">
//                 Rs.{(item.menuItem.price * item.quantity).toLocaleString()}
//               </span>
//             </div>
//           ))}

//           <hr className="border-t border-dashed border-[#d0cdc8] my-3" />

//           {/* breakdown — all from backend schema */}
//           <div className="space-y-1">
//             <div className="flex justify-between py-1">
//               <span className="text-[14px] text-[#7a8a72]">Subtotal</span>
//               <span className="text-[14px] font-semibold text-[#262626]">
//                 Rs.{toRs(bill.subtotal)}
//               </span>
//             </div>
//             {bill.serviceCharge > 0 && (
//               <div className="flex justify-between py-1">
//                 <span className="text-[14px] text-[#7a8a72]">
//                   Service Charge
//                 </span>
//                 <span className="text-[14px] font-semibold text-[#262626]">
//                   Rs.{toRs(bill.serviceCharge)}
//                 </span>
//               </div>
//             )}
          
//             {bill.discount > 0 && (
//               <div className="flex justify-between py-1">
//                 <span className="text-[14px] text-[#7a8a72]">Discount</span>
//                 <span className="text-[14px] font-semibold text-[#4a7a3a]">
//                   − Rs.{toRs(bill.discount)}
//                 </span>
//               </div>
//             )}
//             {bill.paid > 0 && (
//               <div className="flex justify-between py-1">
//                 <span className="text-[14px] text-[#7a8a72]">Paid</span>
//                 <span className="text-[14px] font-semibold text-[#4a7a3a]">
//                   Rs.{toRs(bill.paid)}
//                 </span>
//               </div>
//             )}
//           </div>

//           {/* discount input — only if bill is payable */}
//           {canPay && (
//             <div className="bg-[#f2f0ec] rounded-lg p-3.5 my-3.5">
//               <p className="text-[11px] font-semibold text-[#ACBFA4] uppercase tracking-widest mb-2.5">
//                 Adjust Discount
//               </p>
//               <div className="flex gap-1.5 mb-2.5">
//                 {(["rs", "pct"] as DiscountType[]).map((t) => (
//                   <button
//                     key={t}
//                     onClick={() => {
//                       setDiscountType(t);
//                       setDiscountValue("");
//                     }}
//                     className={`flex-1 py-1.5 rounded-md text-[13px] font-semibold transition-colors ${
//                       discountType === t
//                         ? "bg-[#262626] text-white border border-[#262626]"
//                         : "bg-white text-[#7a8a72] border border-[#d0cdc8]"
//                     }`}
//                   >
//                     {t === "rs" ? "Rs." : "%"}
//                   </button>
//                 ))}
//               </div>
//               <div className="flex gap-2">
//                 <input
//                   type="number"
//                   min={0}
//                   placeholder={
//                     discountType === "rs" ? "Amount in Rs." : "e.g. 10"
//                   }
//                   value={discountValue}
//                   onChange={(e) =>
//                     setDiscountValue(
//                       e.target.value === ""
//                         ? ""
//                         : Math.max(0, Number(e.target.value)),
//                     )
//                   }
//                   className="flex-1 h-9 rounded-md border border-[#d0cdc8] bg-white px-3 text-[14px] text-[#262626] outline-none focus:ring-1 focus:ring-[#FF7F11]"
//                 />
//                 <button
//                   onClick={handleApplyDiscount}
//                   className="h-9 px-3.5 rounded-md bg-[#262626] text-white text-[13px] font-semibold hover:bg-[#3a3a3a] transition-colors"
//                 >
//                   Apply
//                 </button>
//                 <button
//                   onClick={() => setDiscountValue("")}
//                   className="h-9 px-3 rounded-md bg-white border border-[#d0cdc8] text-[13px] text-[#ACBFA4] hover:bg-gray-50"
//                 >
//                   Clear
//                 </button>
//               </div>
//             </div>
//           )}

//           <hr className="border-t border-solid border-[#e0ddd8] my-3" />

//           {/* total due */}
//           <div className="flex justify-between items-baseline py-0.5 mb-4">
//             <span className="text-[16px] font-bold text-[#262626] uppercase tracking-wide">
//               {bill.status === "PARTIALLY_PAID" ? "Due" : "Total"}
//             </span>
//             <span className="text-[26px] font-bold text-[#FF7F11]">
//               Rs.{toRs(canPay ? previewDue : bill.grandTotal)}
//             </span>
//           </div>

//           {/* payment method + reference — only if payable */}
//           {canPay && (
//             <>
//               <p className="text-[11px] font-semibold text-[#ACBFA4] uppercase tracking-widest mb-2">
//                 Payment Method
//               </p>
//               <div className="grid grid-cols-4 gap-1.5 mb-3">
//                 {(["CASH", "CARD", "QR", "MIXED"] as PaymentMethod[]).map(
//                   (m) => (
//                     <button
//                       key={m}
//                       onClick={() => setPaymentMethod(m)}
//                       className="flex flex-col items-center py-2 rounded-lg text-[11px] font-semibold transition-all gap-1"
//                       style={{
//                         background: paymentMethod === m ? "#262626" : "#fff",
//                         color: paymentMethod === m ? "#fff" : "#5a6652",
//                         border: `1px solid ${paymentMethod === m ? "#262626" : "rgba(172,191,164,0.4)"}`,
//                       }}
//                     >
//                       {METHOD_ICONS[m]}
//                       {m}
//                     </button>
//                   ),
//                 )}
//               </div>

//               {/* reference — shown for CARD and QR */}
//               {(paymentMethod === "CARD" || paymentMethod === "QR") && (
//                 <input
//                   type="text"
//                   placeholder="Transaction reference (optional)"
//                   value={reference}
//                   onChange={(e) => setReference(e.target.value)}
//                   className="w-full h-9 rounded-md border border-[#d0cdc8] bg-white px-3 text-[13px] text-[#262626] outline-none focus:ring-1 focus:ring-[#FF7F11] mb-2"
//                 />
//               )}

//               <input
//                 type="text"
//                 placeholder="Note (optional)"
//                 value={note}
//                 onChange={(e) => setNote(e.target.value)}
//                 className="w-full h-9 rounded-md border border-[#d0cdc8] bg-white px-3 text-[13px] text-[#262626] outline-none focus:ring-1 focus:ring-[#FF7F11] mb-3"
//               />

//               <button
//                 onClick={handlePayment}
//                 disabled={loading}
//                 className="w-full py-3.5 bg-[#FF7F11] text-white text-[15px] font-bold tracking-wide rounded-lg hover:bg-[#e56e0a] transition-colors disabled:opacity-60 mb-2"
//               >
//                 {loading
//                   ? "Processing..."
//                   : bill.status === "PARTIALLY_PAID"
//                     ? `Pay Remaining Rs.${toRs(bill.due)}`
//                     : "✓ Mark as Paid"}
//               </button>

//               <button
//                 onClick={() => window.print()}
//                 className="w-full py-2.5 rounded-lg text-[12px] font-semibold text-[#ACBFA4] hover:bg-[#E2E8CE] hover:text-[#5a7050] transition-colors"
//                 style={{
//                   background: "transparent",
//                   border: "1.5px dashed #d0cdc8",
//                 }}
//               >
//                 ⬡ Print Receipt
//               </button>
//             </>
//           )}

//           {/* paid state */}
//           {bill.status === "PAID" && (
//             <div className="text-center py-3">
//               <div className="w-full py-3 rounded-lg bg-[#E2E8CE] text-[#4a7a3a] text-[14px] font-bold tracking-wide mb-2">
//                 ✓ Fully Paid — Rs.{toRs(bill.grandTotal)}
//               </div>
//               <button
//                 onClick={() => window.print()}
//                 className="w-full py-2.5 rounded-lg text-[12px] font-semibold text-[#ACBFA4] hover:bg-[#E2E8CE] transition-colors"
//                 style={{
//                   background: "transparent",
//                   border: "1.5px dashed #d0cdc8",
//                 }}
//               >
//                 ⬡ Print Receipt
//               </button>
//             </div>
//           )}

//           {/* voided state */}
//           {bill.status === "VOIDED" && (
//             <div className="w-full py-3 rounded-lg bg-red-50 text-red-400 text-[14px] font-bold text-center tracking-wide">
//               ✕ Bill Voided
//             </div>
//           )}
//         </div>

//         {/* torn bottom */}
//         <div className="h-4 relative overflow-hidden bg-[#fafaf8]">
//           <div
//             className="absolute top-0 left-0 right-0 h-4"
//             style={{
//               background: `radial-gradient(circle at 10px 20px, transparent 8px, #fafaf8 8px) repeat-x, linear-gradient(#E2E8CE, #E2E8CE)`,
//               backgroundSize: "20px 16px",
//             }}
//           />
//         </div>
//       </div>
//     </>
//   );
// }
