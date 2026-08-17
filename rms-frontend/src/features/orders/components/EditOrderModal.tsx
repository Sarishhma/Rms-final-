import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Order } from "@/features/orders/types/index";
import { OrderChannel } from "@/features/orders/types";
import { Minus, Plus, ChevronDown } from "@/components/ui/Icons";
import { Search, ShoppingCart, X, Users } from "lucide-react";
import { useUpdateOrder } from "@/features/orders/hooks/useOrderMutation";
import { useMenuItems } from "@/features/menu/hooks/useMenuItems";
import { useAppDispatch } from "@/redux/hooks";
import { setLatestKotDiff } from "@/redux/orderSlice";
import { useCategories } from "@/features/menu/hooks/useCategories";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const editOrderSchema = z.object({
  guestCount: z.number().int().min(1).max(200).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string(),
        variantId: z.string().uuid().optional(),
        quantity: z.number().int().min(1),
      }),
    )
    .optional(),
});

type EditOrderForm = z.infer<typeof editOrderSchema>;

interface Props {
  order: Order;
  onClose: () => void;
  onPrintRequested?: (order: Order) => void;
  startEdit?: boolean;
}
export default function EditOrderModal({
  order,
  onClose,
  onPrintRequested,
  startEdit = true,
}: Props) {
  const [menuSearch, setMenuSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [isEditing, setIsEditing] = useState(startEdit);
  const categoriesContainerRef = useRef<HTMLDivElement | null>(null);
  const dispatch = useAppDispatch();

  const { mutate: updateOrder, isPending: isSubmitting } = useUpdateOrder();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(menuSearch);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [menuSearch]);

  const scrollCategories = (direction: "left" | "right") => {
    if (!categoriesContainerRef.current) return;
    categoriesContainerRef.current.scrollBy({
      left: direction === "left" ? -150 : 150,
      behavior: "smooth",
    });
  };

  const { data: categoriesData = [] } = useCategories();

  const { data, isLoading: isMenuLoading } = useMenuItems({
    page,
    limit: 20,
    categoryId,
    search: debouncedSearch || undefined,
  });

  const meta = data?.meta;
  const menuItems = data?.menuItems ?? [];

  const {
    register,
    handleSubmit,
    control,
    formState: { isDirty },
    reset,
    watch,
  } = useForm<EditOrderForm>({
    resolver: zodResolver(editOrderSchema),
    defaultValues: {
      guestCount: order.guestCount ?? undefined,
      items: order.items.map((item) => ({
        menuItemId: item.menuItem?.id,
        variantId: item.variant?.id || undefined,
        quantity: item.quantity,
      })),
    },
  });

  const { fields, update, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items") ?? [];

  const grandTotal = watchedItems.reduce((sum, field) => {
    const orderItem = order.items.find(
      (item) => item.menuItem?.id === field.menuItemId,
    );
    const menuItem = menuItems.find((m: any) => m.id === field.menuItemId);
    const price =
      orderItem?.unitPrice != null
        ? Number(orderItem.unitPrice)
        : menuItem?.basePrice != null
          ? Number(menuItem.basePrice)
          : 0;
    return sum + price * field.quantity;
  }, 0);

  const isAlreadyAdded = (menuItemId: string) =>
    fields.some((f) => f.menuItemId === menuItemId);

  const handleAddMenuItem = (menuItem: any) => {
    if (isAlreadyAdded(menuItem.id)) {
      const index = fields.findIndex((f) => f.menuItemId === menuItem.id);
      update(index, { ...fields[index], quantity: fields[index].quantity + 1 });
    } else {
      append({ menuItemId: menuItem.id, variantId: undefined, quantity: 1 });
    }
  };

  const onSubmit = (data: EditOrderForm) => {
    if (!isDirty) {
      onClose();
      return;
    }

    const kotDiff = data.items
      ?.map((newItem) => {
        const originalItem = order.items.find(
          (oldItem) =>
            oldItem.menuItem?.id === newItem.menuItemId &&
            (oldItem.variant?.id || undefined) ===
              (newItem.variantId || undefined),
        );
        const originalQty = originalItem ? originalItem.quantity : 0;
        const diffQty = newItem.quantity - originalQty;

        if (diffQty > 0) {
          const matchedMenuItem = menuItems.find(
            (m: any) => m.id === newItem.menuItemId,
          );
          const variantName =
            originalItem?.variant?.name ||
            matchedMenuItem?.variants?.find(
              (v: any) => v.id === newItem.variantId,
            )?.name;
          const baseName =
            originalItem?.menuItem?.name ||
            matchedMenuItem?.name ||
            "Unknown Item";
          const itemName = variantName
            ? `${baseName} (${variantName})`
            : baseName;
          return { name: itemName, quantity: diffQty };
        }
        return null;
      })
      .filter(Boolean);

    const cleanedItems = data.items?.map(({ variantId, ...rest }) => ({
      ...rest,
      ...(variantId ? { variantId } : {}),
    }));

    updateOrder(
      { id: order.id, payload: { ...data, items: cleanedItems } },
      {
        onSuccess: (updatedOrder) => {
          dispatch(setLatestKotDiff(kotDiff || null));

          onPrintRequested?.(updatedOrder.data);

          onClose();
        },
        onError: (_err) => {
        },
      },
    );
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b bg-white shrink-0">
        <div>
          <p className="text-2xl font-bold text-green-700 ">
            {order.channel === OrderChannel.DINE_IN && order.table
              ? `Table ${order.table.name}`
              : `${order.channel?.replace("_", " ")}${order.customer ? ` · ${order.customer.name}` : ""}`}
          </p>
          <h2 className="text-xs font-bold text-slate-800">
            #{order.orderNumber}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition"
            >
              Edit Order
            </button>
          )}

          {/* Guest count */}
          <div className="flex items-center gap-1.5 border rounded-lg px-3 py-1.5">
            <Users size={13} className="text-slate-400" />
            <input
              {...register("guestCount", { valueAsNumber: true })}
              type="number"
              min={1}
              max={200}
              disabled={!isEditing}
              className="w-8 text-sm font-semibold text-slate-700 outline-none text-center bg-transparent disabled:opacity-60"
            />
            <span className="text-xs text-slate-400">guests</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── BODY: LEFT MENU + RIGHT CART ── */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-1 min-h-0 overflow-hidden gap-4"
      >
        {/* ══ LEFT — MENU BROWSER ══ */}
        <div className="flex flex-col min-w-0 h-full flex-1 overflow-hidden border-r">
          {/* Search */}
          <div className="px-4 pt-3 pb-2 shrink-0">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                placeholder="Search menu..."
                className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-slate-50"
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-1 px-3 pb-2 shrink-0">
            <button
              type="button"
              onClick={() => scrollCategories("left")}
              className="shrink-0 w-7 h-7 rounded-full bg-white border flex items-center justify-center text-slate-400 hover:text-orange-500 transition"
            >
              <FiChevronLeft size={14} />
            </button>

            <div
              ref={categoriesContainerRef}
              className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1"
            >
              <button
                type="button"
                onClick={() => {
                  setCategoryId(undefined);
                  setPage(1);
                  setMenuSearch("");
                  setDebouncedSearch("");
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition border ${
                  categoryId === undefined
                    ? "bg-orange-500 text-white border-transparent"
                    : "bg-white text-slate-500 border-slate-200 hover:border-orange-300"
                }`}
              >
                All
              </button>
              {categoriesData.map((cat: any) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(cat.id);
                    setPage(1);
                    setMenuSearch("");
                    setDebouncedSearch("");
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition border ${
                    categoryId === cat.id
                      ? "bg-orange-500 text-white border-transparent"
                      : "bg-white text-slate-500 border-slate-200 hover:border-orange-300"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollCategories("right")}
              className="shrink-0 w-7 h-7 rounded-full bg-white border flex items-center justify-center text-slate-400 hover:text-orange-500 transition"
            >
              <FiChevronRight size={14} />
            </button>
          </div>

          {/* Menu grid */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {isMenuLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : menuItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <p className="text-sm">No items found</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {menuItems.map((item: any) => {
                  const added = isAlreadyAdded(item.id);
                  const addedField = fields.find(
                    (f) => f.menuItemId === item.id,
                  );
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        item.isAvailable && handleAddMenuItem(item)
                      }
                      disabled={!item.isAvailable}
                      className={`text-left rounded-xl p-3 border transition-all flex flex-col justify-between min-h-[90px] ${
                        added
                          ? "border-orange-300 bg-orange-50"
                          : "border-slate-200 bg-white hover:border-orange-300 hover:shadow-sm"
                      } ${!item.isAvailable ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-tight">
                          {item.name}
                        </p>
                        {(item.variants?.length ?? 0) > 0 && (
                          <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                            <ChevronDown size={10} /> {item.variants?.length}{" "}
                            options
                          </p>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                        <span className="text-sm font-bold text-orange-500">
                          NPR {item.basePrice}
                        </span>
                        {added ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">
                            {addedField?.quantity}×
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            + Add
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 px-4 py-3 border-t shrink-0">
              <button
                type="button"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="px-3 py-1 text-xs font-semibold border rounded-lg disabled:opacity-40 hover:border-orange-300 transition"
              >
                Prev
              </button>
              <span className="text-xs text-slate-400">
                {meta.page} / {meta.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= meta.totalPages}
                className="px-3 py-1 text-xs font-semibold border rounded-lg disabled:opacity-40 hover:border-orange-300 transition"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* ══ RIGHT — CART ══ */}
        <div className="w-[90vw] max-w-[500px]  shrink-0 flex flex-col bg-slate-50">
          {" "}
          {/* Cart header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-white shrink-0">
            <ShoppingCart size={15} className="text-orange-500" />
            <span className="text-sm font-bold text-slate-700">Order</span>
            <span className="ml-auto text-xs bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full">
              {fields.length} items
            </span>
          </div>
          {/* Cart items */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {fields.map((field, i) => {
              const orderItem = order.items.find(
                (item) =>
                  item.menuItem?.id === field.menuItemId &&
                  (item.variant?.id || undefined) ===
                    (field.variantId || undefined),
              );
              const matchedMenuItem = menuItems.find(
                (m: any) => m.id === field.menuItemId,
              );
              const itemName =
                orderItem?.menuItem?.name ??
                matchedMenuItem?.name ??
                "Unknown item";
              const variantName =
                orderItem?.variant?.name ??
                matchedMenuItem?.variants?.find(
                  (v: any) => v.id === field.variantId,
                )?.name;

              const unitPrice =
                orderItem?.unitPrice != null
                  ? Number(orderItem.unitPrice)
                  : matchedMenuItem?.basePrice != null
                    ? Number(matchedMenuItem.basePrice)
                    : 0;

              const isNew = !orderItem;
              const isIncreased =
                orderItem && field.quantity > orderItem.quantity;
              const isDecreased =
                orderItem && field.quantity < orderItem.quantity;

              const borderColor = isNew
                ? "border-l-emerald-400"
                : isIncreased
                  ? "border-l-orange-400"
                  : isDecreased
                    ? "border-l-rose-400"
                    : "border-l-slate-200";

              return (
                <div
                  key={field.id}
                  className={`bg-white rounded-xl p-3 border border-slate-100 border-l-4 ${borderColor}`}
                >
                  <div className="flex justify-between items-start gap-3">
                    {/* Main content */}
                    <div className="flex flex-1 w-full min-w-0 items-center justify-between gap-4">
                      {/* Item info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {itemName}
                          {variantName && (
                            <span className="text-xs text-slate-400 ml-1">
                              ({variantName})
                            </span>
                          )}
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          <span className="font-semibold text-slate-600">
                            NPR {unitPrice * field.quantity}
                          </span>
                        </p>
                      </div>

                      {/* Qty Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (field.quantity > 1) {
                              update(i, {
                                ...field,
                                quantity: field.quantity - 1,
                              });
                            }
                          }}
                          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
                        >
                          <Minus size={12} className="text-slate-600" />
                        </button>

                        <span className="text-sm font-bold w-5 text-center text-slate-800">
                          {field.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            update(i, {
                              ...field,
                              quantity: field.quantity + 1,
                            })
                          }
                          className="w-7 h-7 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center transition"
                        >
                          <Plus size={12} className="text-orange-600" />
                        </button>

                        {/* Status badge */}
                        {isNew && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 whitespace-nowrap">
                            NEW
                          </span>
                        )}

                        {isIncreased && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 whitespace-nowrap">
                            +{field.quantity - orderItem.quantity}
                          </span>
                        )}

                        {isDecreased && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 whitespace-nowrap">
                            -{orderItem.quantity - field.quantity}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      disabled={fields.length === 1}
                      className="shrink-0 text-slate-300 hover:text-red-400 transition disabled:opacity-20"
                    >
                      <X size={14} className="text-red-500 font-bold" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Cart footer — total + actions */}
          <div className="border-t bg-white px-4 py-4 space-y-3 shrink-0">
            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 font-medium">Total</span>
              <span className="text-lg font-bold text-slate-800">
                NPR {grandTotal}
              </span>
            </div>

            {/* Save / Cancel */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  reset();
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-bold transition"
              >
                {isSubmitting ? "Saving..." : "Confirm Order"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
