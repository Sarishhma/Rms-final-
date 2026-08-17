import { useState, useMemo } from "react";
import { useMenuItems } from "@/features/menu/hooks/useMenuItems";

interface Item {
  id: string;
  menuItemId: string;
  menuItem: { name: string };
  quantity: number;
  unitPrice: number;
  addonIds: string[];
  specialInstructions: string;
}

interface OrderEditingPanelProps {
  order: any;
  items: Item[];
  isLocked: boolean;
  isDirty: boolean;
  loadingAction: string | null;
  onItemsChange: (items: Item[], isDirty: boolean) => void;
  onSave: () => void;
  onGenerateBill: () => void;
}

export function OrderEditingPanel({
  items,
  isLocked,
  isDirty,
  loadingAction,
  onItemsChange,
  onSave,
  onGenerateBill,
}: OrderEditingPanelProps) {
  const [openMenu, setOpenMenu] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");

  // Fetch menu items
  const { data: menuData } = useMenuItems({page:1});
  const menuItems = menuData?.menuItems ?? [];

  // Filter menu
  const filteredMenu = menuItems?.filter((m: any) =>
    m.name.toLowerCase().includes(menuSearch.toLowerCase())
  );

  // Calculate total
  const total = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.quantity * (item.unitPrice ?? 0), 0),
    [items]
  );

  // Item handlers
  const updateQty = (itemId: string, qty: number) => {
    const updated = items.map((it) =>
      it.id === itemId ? { ...it, quantity: Math.max(1, qty) } : it
    );
    onItemsChange(updated, true);
  };

  const removeItem = (itemId: string) => {
    const updated = items.filter((it) => it.id !== itemId);
    onItemsChange(updated, true);
  };

  const addItemToOrder = (menu: any) => {
    const existing = items.find((it) => it.menuItemId === menu.id);
    if (existing) {
      updateQty(existing.id, existing.quantity + 1);
      return;
    }

    const newItem: Item = {
      menuItemId: menu.id,
      menuItem: { name: menu.name },
      quantity: 1,
      unitPrice: menu.basePrice,
      addonIds: [],
      specialInstructions: "",
      id: Math.random().toString(),
    };

    onItemsChange([...items, newItem], true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      {/* ── LEFT: Order items ──────────────────────────────────────────── */}
      <div className="space-y-5">
        {/* Items card */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-bold text-zinc-900 tracking-tight">
              Order Items
            </h2>
            {!isLocked && (
              <button
                onClick={() => setOpenMenu(!openMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-700 transition"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Add Item
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-zinc-400 text-sm">No items in this order.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {items.map((item) => (
                <div
                  key={item.id ?? item.menuItemId}
                  className="flex items-center px-5 py-4 gap-4 hover:bg-zinc-50 transition"
                >
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 text-xs font-bold shrink-0">
                    {item.menuItem?.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">
                      {item.menuItem?.name}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Rs {item.unitPrice.toLocaleString()} / unit
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={isLocked}
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 transition text-sm font-bold"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-zinc-900">
                      {item.quantity}
                    </span>
                    <button
                      disabled={isLocked}
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 transition text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-sm font-bold text-zinc-900 w-24 text-right">
                    Rs {(item.quantity * item.unitPrice).toLocaleString()}
                  </div>
                  {!isLocked && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 transition"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div className="flex justify-between items-center px-5 py-3 bg-zinc-50 border-t border-zinc-100">
              <span className="text-xs text-zinc-500 font-medium">
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
              <span className="text-sm font-bold text-zinc-900">
                Rs {total.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Menu picker */}
        {openMenu && (
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-3">
              <h3 className="text-sm font-bold text-zinc-900 shrink-0">Menu</h3>
              <div className="relative flex-1">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search menu…"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
              <button
                onClick={() => setOpenMenu(false)}
                className="text-zinc-400 hover:text-zinc-700 transition"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 divide-x divide-y divide-zinc-100">
              {filteredMenu.map((menu: any) => (
                <button
                  key={menu.id}
                  onClick={() => addItemToOrder(menu)}
                  className="p-4 text-left hover:bg-zinc-50 transition group"
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 group-hover:bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-500 mb-2 transition">
                    {menu.name.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-xs font-semibold text-zinc-900 leading-tight line-clamp-2">
                    {menu.name}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Rs {menu.basePrice?.toLocaleString()}
                  </p>
                </button>
              ))}
              {filteredMenu.length === 0 && (
                <div className="col-span-3 py-10 text-center text-xs text-zinc-400">
                  No items match "{menuSearch}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: Summary & Actions ──────────────────────────────────── */}
      <div className="space-y-4">
        <div className="sticky top-[80px] space-y-4">
          {/* Summary Card */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
              Order Summary
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Subtotal</span>
                <span className="font-bold text-zinc-900">
                  Rs {total.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Items</span>
                <span className="font-bold text-zinc-900">{items.length}</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 mt-3">
              Save order changes before generating bill.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-2.5">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
              Actions
            </p>

            {/* Save button - only show if dirty */}
            {isDirty && !isLocked && (
              <button
                onClick={onSave}
                disabled={loadingAction === "save"}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-700 transition disabled:opacity-50"
              >
                {loadingAction === "save" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Save Order
                  </>
                )}
              </button>
            )}

            {/* Generate Bill button */}
            <button
              onClick={onGenerateBill}
              disabled={isLocked || loadingAction === "generateBill" || items.length === 0}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition ${
                !isLocked && items.length > 0
                  ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-100"
                  : "bg-zinc-100 text-zinc-400 cursor-default"
              } disabled:opacity-50`}
            >
              {loadingAction === "generateBill" ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                    />
                  </svg>
                  Generate Bill
                </>
              )}
            </button>

            {/* Info hint */}
            {isDirty && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-xs text-amber-700">
                  You have unsaved changes. Save before proceeding.
                </p>
              </div>
            )}

            {!isDirty && items.length === 0 && (
              <div className="mt-3 p-3 bg-zinc-50 border border-zinc-100 rounded-lg">
                <p className="text-xs text-zinc-600">
                  Add items to the order to continue.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
