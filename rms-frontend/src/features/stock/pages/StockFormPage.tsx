import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stockSchema } from "@/zod/table.schema";
import { useStock } from "@/features/stock/hooks/useStock";
import { useMenuItems } from "@/features/menu/hooks/useMenuItems";
import z from "zod";

export type StockFormData = z.input<typeof stockSchema>;

export default function StockFormPage() {
  const { createStock, loading } = useStock();
  const { data, isLoading: menuLoading } = useMenuItems({page:1});
  const menuData = data?.menuItems ?? [];
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StockFormData>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      openingQty: 0,
      lowStockAt: 0,
      menuItemId: "",
      businessDate: "",
    },
  });

  const onSubmit = async (data: StockFormData) => {
    await createStock(data);
    reset();
    alert("Stock created successfully");
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-xl font-semibold mb-4">Stock Management</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Menu Item Dropdown */}
        <div>
          <label className="text-sm font-medium">Menu Item</label>

          <select
            {...register("menuItemId")}
            className="w-full border p-2 rounded"
            disabled={menuLoading}
          >
            <option value="">
              {menuLoading ? "Loading menu items..." : "Select menu item"}
            </option>

            {menuData?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          {errors.menuItemId && (
            <p className="text-red-500 text-sm">{errors.menuItemId.message}</p>
          )}
        </div>

        {/* Variant ID */}

        {/* Opening Qty */}
        <div>
          <label className="text-sm font-medium">Opening Quantity</label>
          <input
            type="number"
            {...register("openingQty", { valueAsNumber: true })}
            className="w-full border p-2 rounded"
          />
          {errors.openingQty && (
            <p className="text-red-500 text-sm">{errors.openingQty.message}</p>
          )}
        </div>

        {/* Low Stock At */}
        <div>
          <label className="text-sm font-medium">Low Stock Alert</label>
          <input
            type="number"
            {...register("lowStockAt", { valueAsNumber: true })}
            className="w-full border p-2 rounded"
          />
          {errors.lowStockAt && (
            <p className="text-red-500 text-sm">{errors.lowStockAt.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          {loading ? "Saving..." : "Create Stock"}
        </button>
      </form>
    </div>
  );
}
