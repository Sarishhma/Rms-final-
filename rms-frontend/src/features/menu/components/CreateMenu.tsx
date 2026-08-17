import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { useCreateMenuItem } from "@/features/menu/hooks/useCreateMenuItem";
import { MenuItemType } from "@/features/menu/types";
import { useCategories } from "@/features/menu/hooks/useCategories";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const defaultForm = {
  name: "",
  description: "",
  type: MenuItemType.FOOD,
  categoryId: "",
  subcategoryId: "",
  basePrice: 0,
  trackStock: false,
  stockQuantity: 0,
  variants: [] as { name: string; price: number }[],
  addons: [] as { name: string; price: number }[],
};

export default function CreateMenuItemModal({ isOpen, onClose }: Props) {
  const { data: categories = [] } = useCategories();
  const [form, setForm] = useState(defaultForm);
  const { mutate: createMenuItem, isPending } = useCreateMenuItem();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  // variants
  const addVariant = () =>
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { name: "", price: 0 }],
    }));

  const updateVariant = (
    index: number,
    field: "name" | "price",
    value: string,
  ) =>
    setForm((prev) => {
      const updated = [...prev.variants];
      updated[index] = {
        ...updated[index],
        [field]: field === "price" ? Number(value) : value,
      };
      return { ...prev, variants: updated };
    });

  const removeVariant = (index: number) =>
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));

  // addons
  const addAddon = () =>
    setForm((prev) => ({
      ...prev,
      addons: [...prev.addons, { name: "", price: 0 }],
    }));

  const updateAddon = (index: number, field: "name" | "price", value: string) =>
    setForm((prev) => {
      const updated = [...prev.addons];
      updated[index] = {
        ...updated[index],
        [field]: field === "price" ? Number(value) : value,
      };
      return { ...prev, addons: updated };
    });

  const removeAddon = (index: number) =>
    setForm((prev) => ({
      ...prev,
      addons: prev.addons.filter((_, i) => i !== index),
    }));

  // submit
  const handleSubmit = () => {
    if (!form.name || !form.categoryId || form.basePrice <= 0) return;


    const payload: any = {
      name: form.name,
      description: form.description || undefined,
      type: form.type,
      categoryId: form.categoryId,
      subcategoryId: form.subcategoryId || undefined,
      basePrice: Number(form.basePrice),
      trackStock: form.trackStock,
      variants: form.variants,
      addons: form.addons,
    };

    if (form.trackStock) {
      payload.stockQuantity = Number(form.stockQuantity);
      payload.remainingStock = Number(form.stockQuantity); 
    }

    createMenuItem(payload, {
      onSuccess: () => {
        setForm(defaultForm);
        onClose();
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-800">Add Menu Item</h2>
          <button onClick={onClose}>
            <X size={20} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto p-5 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-700">Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Americano"
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional description..."
              rows={2}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-sm font-medium text-gray-700">Type *</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {Object.values(MenuItemType).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

        
          <div>
            <label className="text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Subcategory
            </label>
            <select
              name="subcategoryId"
              value={form.subcategoryId}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">Select subcategory</option>
              {categories
                .find((cat) => cat.id === form.categoryId)
                ?.subcategories?.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Base Price */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Base Price (Rs.) *
            </label>
            <input
              name="basePrice"
              type="number"
              value={form.basePrice}
              onChange={handleChange}
              min={0}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Track Stock */}
          <div className="flex items-center gap-3">
            <input
              id="trackStock"
              name="trackStock"
              type="checkbox"
              checked={form.trackStock}
              onChange={handleChange}
              className="w-4 h-4 accent-orange-500"
            />
            <label
              htmlFor="trackStock"
              className="text-sm font-medium text-gray-700"
            >
              Track Stock
            </label>
          </div>

          {form.trackStock && (
            <div>
              <label className="text-sm font-medium text-gray-700">
                Stock Quantity
              </label>
              <input
                name="stockQuantity"
                type="number"
                value={form.stockQuantity}
                onChange={handleChange}
                min={0}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          )}

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Variants
              </label>
              <button
                onClick={addVariant}
                className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-medium"
              >
                <Plus size={12} /> Add Variant
              </button>
            </div>
            {form.variants.length === 0 ? (
              <p className="text-xs text-gray-400">No variants added</p>
            ) : (
              form.variants.map((v, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <input
                    value={v.name}
                    onChange={(e) => updateVariant(i, "name", e.target.value)}
                    placeholder="Variant name"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <input
                    type="number"
                    value={v.price}
                    onChange={(e) => updateVariant(i, "price", e.target.value)}
                    placeholder="Price"
                    className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <button onClick={() => removeVariant(i)}>
                    <Trash2
                      size={14}
                      className="text-red-400 hover:text-red-600"
                    />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Addons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Addons
              </label>
              <button
                onClick={addAddon}
                className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-medium"
              >
                <Plus size={12} /> Add Addon
              </button>
            </div>
            {form.addons.length === 0 ? (
              <p className="text-xs text-gray-400">No addons added</p>
            ) : (
              form.addons.map((a, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <input
                    value={a.name}
                    onChange={(e) => updateAddon(i, "name", e.target.value)}
                    placeholder="Addon name"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <input
                    type="number"
                    value={a.price}
                    onChange={(e) => updateAddon(i, "price", e.target.value)}
                    placeholder="Price"
                    className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <button onClick={() => removeAddon(i)}>
                    <Trash2
                      size={14}
                      className="text-red-400 hover:text-red-600"
                    />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 py-2 rounded-xl text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              isPending || !form.name || !form.categoryId || form.basePrice <= 0
            }
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-2 rounded-xl text-sm font-medium transition"
          >
            {isPending ? "Creating..." : "Create Item"}
          </button>
        </div>
      </div>
    </div>
  );
}
