import { useState, useRef } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ChevronDown,
} from "@/components/ui/Icons";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  updateNotes,
  setPendingItem,
} from "@/redux/cartSlice";
import type { RootState } from "@/redux/store";
import { OrderChannel, type Order } from "@/features/orders/types";
import type { Variant } from "@/features/menu/types/index";
import { LoadingSpinner } from "@/features/shared/LoadingSpinner";
import { useMenuItems } from "@/features/menu/hooks/useMenuItems";
import { usePlaceOrder } from "@/features/orders/hooks/usePlaceOrder";

import { useLookupCustomer } from "@/features/customer/hooks/useLookupCustomer";

import { useCategories } from "@/features/menu/hooks/useCategories";
import type { MenuItem } from "@/features/menu/types";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCreateCustomer } from "@/features/customer/hooks/useCreateCustomerhook";
import PrintKotModal from "@/features/kot/component/PrintKotModal";


export default function Neworders() {
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search")?.toLowerCase() ?? "";
  const [menuSearch, setMenuSearch] = useState(search);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dispatch = useDispatch();

  const cart = useSelector((state: RootState) => state.cart.items);
  const table = useSelector((state: RootState) => state.cart.table);

  const [showTableModal, setShowTableModal] = useState(false);
  const [channel, setChannel] = useState<OrderChannel>(OrderChannel.DINE_IN);
  const [phoneQuery, setPhoneQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string;
    phone: string;
  } | null>(null);
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState<string | "">(
    "",
  );
  const [guestCount, setGuestCount] = useState<number | "">(1);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [variantModal, setVariantModal] = useState<MenuItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [orderKey, setOrderKey] = useState(() => uuidv4());
  const categoriesContainerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const limit = 20;

  // Replace useMenuItems call
  const { data: categoriesData = [] } = useCategories();

  const {
    data: menu,
    isLoading,
    isError,
  } = useMenuItems({
    page,
    limit,
    categoryId,
    search: search || undefined,
  });

  // 2. Add the search handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMenuSearch(value); // Instantly updates what you see in the input

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    searchTimerRef.current = setTimeout(() => {
      // After 400ms of no typing, update the URL (which triggers useMenuItems!)
      setSearchParams(value ? { search: value } : {});
      setPage(1); // Reset to page 1 on new search
    }, 400);
  };

  const menuItems = menu?.menuItems ?? [];
  const meta = menu?.meta;

  const scrollCategories = (direction: "left" | "right") => {
    if (categoriesContainerRef.current) {
      const scrollAmount = 200;
      const newScrollLeft =
        categoriesContainerRef.current.scrollLeft +
        (direction === "left" ? -scrollAmount : scrollAmount);
      categoriesContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  const handleAddToCart = (item: MenuItem, variant?: Variant) => {
    if (channel === OrderChannel.DINE_IN && !table) {
      dispatch(
        setPendingItem({
          id: item.id,
          variantId: variant ? variant.id : null,
          name: variant ? `${item.name} (${variant.name})` : item.name,
          description: item.description ?? "",
          category: item.category?.name ?? "Uncategorized",
          price: variant?.price ?? item.basePrice,
        }),
      );
      setShowTableModal(true);
      return;
    }

    dispatch(
      addToCart({
        id: item.id,
        variantId: variant ? variant.id : null,
        name: variant ? `${item.name} (${variant.name})` : item.name,
        description: item.description ?? "",
        category: item.category?.name ?? "Uncategorized",
        price: variant?.price ?? item.basePrice,
      }),
    );
  };

  const handleItemClick = (item: MenuItem) => {
    if ((item.variants?.length ?? 0) > 0) {
      setVariantModal(item);
      setSelectedVariant(item.variants[0]);
    } else {
      handleAddToCart(item);
    }
  };

  const handleVariantConfirm = () => {
    if (variantModal) {
      handleAddToCart(variantModal, selectedVariant ?? undefined);
      setVariantModal(null);
      setSelectedVariant(null);
    }
  };

  const handleRemoveFromCart = (id: string) => dispatch(removeFromCart(id));

  const handleUpdateQuantity = (id: string, type: "increase" | "decrease") =>
    dispatch(updateQuantity({ id, type }));

  const handleUpdateNotes = (id: string, note: string) =>
    dispatch(updateNotes({ id, note }));

  const total = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0);

  const navigate = useNavigate();

  const { mutate: placeOrder, isPending: isPlacingOrder } = usePlaceOrder({
    table: channel === OrderChannel.DINE_IN ? table : null,
    cart,
    total,
    channel,
    customerId: selectedCustomer?.id,
    guestCount: guestCount === "" ? undefined : Number(guestCount),

    onSuccess: (order) => {
      setOrderKey(uuidv4());
      setGuestCount(1);
      setSpecialInstructions("");
      setSelectedCustomer(null);

      // Show print preview
      setPrintOrder(order);
    },
  });
  

  const { data: matchedCustomer, isLoading: isLookingUp } =
    useLookupCustomer(phoneQuery);
  const { mutate: registerCustomer, isPending: isSavingCustomer } =
    useCreateCustomer();

  if (isLoading) {
    return (
      <div className="max-h-screen w-full flex bg-gray-50 items-center justify-center ">
        <LoadingSpinner message="Loading menu..." size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen w-full flex bg-gray-50 items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <p className="text-red-500 font-semibold text-base mb-2">
            Error loading menu items
          </p>
          <p className="text-gray-500 text-sm">
            Please check connection and reload.
          </p>
        </div>
      </div>
    );
  }

  const renderCartContent = (isMobile = false) => {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-orange-500" />
            <h2 className="text-base font-bold text-gray-800">Order Cart</h2>
            {cart.length > 0 && (
              <span className="bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ml-2">
                {cart.length}
              </span>
            )}
          </div>
          {isMobile && (
            <button
              onClick={() => setIsMobileCartOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 cursor-pointer"
            >
              &times;
            </button>
          )}
        </div>

        {/* Channel Selector Tab Buttons */}
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 m-3">
          {Object.values(OrderChannel).map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => {
                setChannel(ch);
                setSelectedCustomer(null);
                setPhoneQuery("");
                setIsAddingNewCustomer(false);
              }}
              className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                channel === ch
                  ? "bg-white text-orange-500 shadow-sm border border-gray-200/50"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {ch.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="p-4 bg-gray-50/50 border-b border-gray-100">
          {channel === OrderChannel.DINE_IN ? (
            table ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Active Table
                  </span>
                  <span className="text-xs font-bold bg-orange-100 text-orange-600 px-3 py-1 rounded-full">
                    Table {table.name}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (isMobile) setIsMobileCartOpen(false);
                  navigate("/tables");
                }}
                className="w-full text-center text-xs text-orange-500 hover:text-orange-600 font-semibold py-1 hover:underline cursor-pointer"
              >
                Select a table to place order
              </button>
            )
          ) : (
            <div className="flex flex-col gap-2.5">
              {!selectedCustomer ? (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Customer Phone
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="Enter phone (e.g., 0987654321)..."
                    value={phoneQuery}
                    onChange={(e) =>
                      setPhoneQuery(e.target.value.replace(/\D/g, ""))
                    }
                    className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400"
                  />

                  {phoneQuery.length >= 7 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm mt-1">
                      {isLookingUp ? (
                        <p className="text-[10px] text-gray-500">
                          Searching...
                        </p>
                      ) : matchedCustomer ? (
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-800 font-bold">
                            {matchedCustomer.name}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(matchedCustomer);
                              setPhoneQuery("");
                            }}
                            className="text-[10px] bg-green-600 text-white font-bold px-2 py-1 rounded cursor-pointer"
                          >
                            Select
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <p className="text-[10px] text-red-500">
                            Customer not found.
                          </p>

                          {!isAddingNewCustomer ? (
                            <button
                              type="button"
                              onClick={() => setIsAddingNewCustomer(true)}
                              className="text-left text-[11px] font-bold text-orange-500 hover:underline cursor-pointer"
                            >
                              + Add New Customer
                            </button>
                          ) : (
                            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                              <input
                                type="text"
                                placeholder="Enter Customer Name"
                                value={newCustomerName}
                                onChange={(e) =>
                                  setNewCustomerName(e.target.value)
                                }
                                className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-orange-400"
                              />
                              <button
                                type="button"
                                disabled={
                                  isSavingCustomer || !newCustomerName.trim()
                                }
                                onClick={() => {
                                  registerCustomer(
                                    {
                                      name: newCustomerName,
                                      phone: phoneQuery,
                                    },
                                    {
                                      onSuccess: (data) => {
                                        setSelectedCustomer(data);
                                        setIsAddingNewCustomer(false);
                                        setNewCustomerName("");
                                        setPhoneQuery("");
                                      },
                                    },
                                  );
                                }}
                                className="bg-orange-500 text-white text-[10px] font-bold py-1.5 rounded disabled:opacity-50 cursor-pointer"
                              >
                                {isSavingCustomer
                                  ? "Saving..."
                                  : "Save & Select"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-2.5 shadow-sm">
                  <div>
                    <p className="text-xs font-bold text-green-800">
                      {selectedCustomer.name}
                    </p>
                    <p className="text-[10px] text-green-600">
                      Phone: {selectedCustomer.phone}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="text-xs text-red-500 hover:text-red-700 font-extrabold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="overflow-y-auto p-4 flex-1">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center py-16">
              <ShoppingCart size={44} className="text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm font-medium">
                No items added yet
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Tap items in the menu to add
              </p>
            </div>
          ) : (
            <div className="flex flex-col min-h-full">
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={`${item.menuItem.id}-${item.menuItem.variantId || ""}`}
                    className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-800 leading-tight truncate">
                          {item.menuItem.name}
                        </h4>
                        <p className="text-[10px] sm:text-xs text-orange-500 font-extrabold mt-0.5">
                          Rs.{item.menuItem.price}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(item.menuItem.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-gray-50">
                      <input
                        type="text"
                        placeholder="Add note..."
                        value={item.notes || ""}
                        onChange={(e) =>
                          handleUpdateNotes(item.menuItem.id, e.target.value)
                        }
                        className="text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100 focus:outline-none focus:border-orange-200 flex-1 mr-3 max-w-[130px]"
                      />

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item.menuItem.id, "decrease")
                          }
                          className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition cursor-pointer text-gray-600"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-xs font-bold text-gray-800 w-4 text-center select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item.menuItem.id, "increase")
                          }
                          className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition cursor-pointer text-gray-600"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order special instructions */}
              <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-gray-100">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Order Notes
                </label>
                <input
                  type="text"
                  placeholder="E.g., No onions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400"
                />
              </div>

              <div
                className={`pt-4 mt-2 border-t border-gray-100 ${cart.length === 1 ? "pb-0" : "pb-4"}`}
              >
                <div className="mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-800">
                      Grand Total
                    </span>
                    <span className="text-base font-extrabold text-orange-500">
                      Rs.{total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => placeOrder({ actionKey: orderKey })}
                  disabled={
                    isPlacingOrder ||
                    (channel === OrderChannel.DINE_IN && !table) ||
                    (channel !== OrderChannel.DINE_IN && !selectedCustomer) // Requires customer for Take-Away/Delivery
                  }
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-2.5 rounded-xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <span>Place Order</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-hidden w-full flex bg-gray-50">
      {/* Variant Modal */}
      {variantModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-1">{variantModal.name}</h3>
            <p className="text-gray-500 text-sm mb-4">Select a variant</p>
            <div className="flex flex-col gap-2 mb-4">
              {variantModal.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`flex justify-between items-center px-4 py-3 rounded-lg border-2 transition ${
                    selectedVariant?.id === v.id
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200"
                  }`}
                >
                  <span className="font-medium">{v.name}</span>
                  <span className="text-orange-500 font-bold">
                    Rs.{v.price}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleVariantConfirm}
                className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-medium"
              >
                Add to Cart
              </button>
              <button
                onClick={() => {
                  setVariantModal(null);
                  setSelectedVariant(null);
                }}
                className="flex-1 border border-gray-300 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-2">Table Required</h3>
            <p className="text-gray-600 mb-4">
              Please select a table before adding items.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigate("/tables");
                  setShowTableModal(false);
                }}
                className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-medium"
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
      )}

      {/* LEFT — menu items */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          {/* Identity — left, fixed */}
          <div className="shrink-0 flex items-center gap-3">
            <div className="w-1 h-9 rounded-full bg-gradient-to-b from-orange-500 to-amber-500" />
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">
                New Order
              </h1>
              <p className="text-slate-400 text-xs font-medium mt-1">
                Select items to add to order
              </p>
            </div>
          </div>

          {/* Tools — right, grouped */}
          <div className="flex items-center gap-3 flex-1 justify-end m-5 ">
            <div className="rounded-2xl border border-slate-200  bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all duration-200">
              <Input
                icon={<Search />}
                value={menuSearch}
                onChange={handleSearchChange}
                placeholder="Search menu..."
              />
            </div>

            <button
              onClick={() => setIsMobileCartOpen(true)}
              className="lg:hidden relative p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition shadow-sm cursor-pointer shrink-0"
            >
              <ShoppingCart size={20} className="text-orange-500" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Horizontal Category Selector with arrows */}
        <div className="flex items-center gap-1 pb-3 mb-6 border-b border-gray-100 -mx-6 px-6">
          <button
            onClick={() => scrollCategories("left")}
            className="shrink-0 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-orange-100 hover:text-orange-600 transition-all duration-200"
          >
            <FiChevronLeft size={16} />
          </button>

          <div
            ref={categoriesContainerRef}
            className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1"
            style={{ scrollBehavior: "smooth" }}
          >
            {/* ALL tab */}
            <button
              onClick={() => {
                setCategoryId(undefined);
                setPage(1);
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-200 whitespace-nowrap cursor-pointer border shadow-sm ${
                categoryId === undefined
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent"
                  : "bg-white text-gray-600 border-gray-200/70 hover:border-gray-300"
              }`}
            >
              All
            </button>

            {/* Category tabs from API */}
            {categoriesData.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => {
                  setCategoryId(cat.id);
                  setPage(1);
                }}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-200 whitespace-nowrap cursor-pointer border shadow-sm ${
                  categoryId === cat.id
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent"
                    : "bg-white text-gray-600 border-gray-200/70 hover:border-gray-300"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollCategories("right")}
            className="shrink-0 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-orange-100 hover:text-orange-600 transition-all duration-200"
          >
            <FiChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-2 xl:grid-cols-4 gap-1.5 sm:gap-4 cursor-pointer">
          {menuItems.length === 0 ? (
            <p className="col-span-full text-center text-gray-400 py-10 text-sm">
              No items found.
            </p>
          ) : (
            menuItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`bg-white rounded-xl sm:rounded-2xl p-1.5 sm:p-4 shadow-sm border border-gray-200/50 transition-all duration-200 flex flex-col justify-between select-none`}
              >
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-1 mb-1">
                      <h3 className="font-bold text-gray-900 text-[10px] sm:text-xs lg:text-base leading-tight flex-1 ">
                        {item.name}
                      </h3>

                      {item.trackStock && (
                        <span
                          className={`text-[7px] sm:text-[8px] uppercase font-bold tracking-wider px-1 sm:px-1.5 py-0.5 rounded-full shrink-0`}
                        ></span>
                      )}
                    </div>

                    {item.description && (
                      <p className="hidden sm:block text-[9px] lg:text-xs text-gray-500 mt-1 line-clamp-2 leading-tight">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div>
                    {(item.variants?.length ?? 0) > 0 && (
                      <p className="text-[9px] font-medium text-gray-400 mt-1 flex items-center gap-0.5">
                        <ChevronDown size={8} /> {item.variants?.length} Options
                      </p>
                    )}

                    <div className="flex justify-between items-center mt-1.5 pt-1 border-t border-gray-50">
                      <span className="font-extrabold text-orange-500 text-[11px] lg:text-lg">
                        Rs.{item.basePrice}
                      </span>
                    </div>
                  </div>
                </div>{" "}
              </div>
            ))
          )}
        </div>

        {/* PAGINATION — add below the grid */}
        {meta && meta.totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-6 pb-4">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:border-orange-300 transition"
            >
              Prev
            </button>
            <span className="text-xs text-gray-500 font-medium">
              {meta.page} / {meta.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= meta.totalPages}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:border-orange-300 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* RIGHT — cart (Desktop) */}
      <div className="hidden lg:flex flex-col w-80 bg-white border-l border-gray-200/50 shadow-sm max-h-screen">
        {renderCartContent(false)}
      </div>

      {/* Mobile Cart Drawer */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileCartOpen(false)}
          />
          <div className="relative w-full max-w-sm h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {renderCartContent(true)}
          </div>
        </div>
      )}

      {printOrder && (
        <PrintKotModal
          order={printOrder}
          onClose={() => {
            setPrintOrder(null);
            navigate("/active-orders");
          }}
        />
      )}
    </div>
  );
}
