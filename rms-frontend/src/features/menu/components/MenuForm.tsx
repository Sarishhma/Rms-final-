import { useEffect, useMemo, useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { menuSchema } from "@/zod/table.schema";

import { useCategories } from "@/features/menu/hooks/useCategories";
import { useCreateCategory } from "@/features/menu/hooks/useCreateCategory";
import { useUpdateMenuItem } from "@/features/menu/hooks/useUpdateMenuItem";
import { useCreateSubCategory } from "@/features/menu/hooks/useCreateSubCategory";
import { useCreateMenuItem } from "@/features/menu/hooks/useCreateMenuItem";

import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import type { Category, Subcategory } from "../types";
import type { NormalizedError } from "@/lib/api/interceptor";

function MenuForm({
  initialData,
  onClose,
}: {
  initialData?: any;
  onClose?: () => void;
}) {
  const updateMenuMutation = useUpdateMenuItem();
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("");

  const [openCategoryModal, setOpenCategoryModal] = useState(false);

  const [openSubCategoryModal, setOpenSubCategoryModal] = useState(false);

  const [newCategory, setNewCategory] = useState("");

  const [newSubCategory, setNewSubCategory] = useState("");

  const { data: menuCategories = [] } = useCategories();

  const createCategoryMutation = useCreateCategory();

  const createSubCategoryMutation = useCreateSubCategory();

  const createMenuMutation = useCreateMenuItem();

  const safeCategories: Category[] = useMemo(() => {
    return (menuCategories || []).map((c: Category) => ({
      ...c,
      subcategories: Array.isArray(c.subcategories) ? c.subcategories : [],
    }));
  }, [menuCategories]);

  const selectedCategory = useMemo(() => {
    return safeCategories.find(
      (c) => String(c.id) === String(selectedCategoryId),
    );
  }, [safeCategories, selectedCategoryId]);

  const menuSubCategories: Subcategory[] = useMemo(() => {
    return selectedCategory?.subcategories ?? [];
  }, [selectedCategory]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(menuSchema),
  });

  const menudata = async (data: any) => {
    try {
      const payload = {
        ...data,
        basePrice: Number(data.basePrice),
        categoryId: selectedCategoryId,
        subcategoryId:
          selectedSubCategoryId && selectedSubCategoryId !== ""
            ? selectedSubCategoryId
            : undefined,
      };

      if (initialData?.id) {
        await updateMenuMutation.mutateAsync({
          id: initialData.id,
          payload,
        });
        toast.success("Menu Updated successfully");
      } else {
        await createMenuMutation.mutateAsync(payload);
        toast.success("menu Created successfully");
      }

      reset();
      setSelectedCategoryId("");
      setSelectedSubCategoryId("");
      onClose?.();
    } catch (error: any) {
      const err = error as NormalizedError;

      toast.error(err.message);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      const createdCategory =
        await createCategoryMutation.mutateAsync(newCategory);

      setSelectedCategoryId(createdCategory.id);

      setNewCategory("");

      setOpenCategoryModal(false);
    } catch (error) {
    }
  };

  const handleCreateSubCategory = async () => {
    if (!newSubCategory.trim() || !selectedCategoryId) return;

    try {
      const created = await createSubCategoryMutation.mutateAsync({
        categoryId: selectedCategoryId,
        name: newSubCategory,
      });

      setSelectedSubCategoryId(created.id);
      setNewSubCategory("");
      setOpenSubCategoryModal(false);
    } catch (error) {
      const err = error as NormalizedError;

      toast.error(err.message);
    }
  };

  //for update
  useEffect(() => {
    if (initialData) {
      setValue("name", initialData.name);
      setValue("sku", initialData.sku);
      setValue("description", initialData.description);
      setValue("basePrice", initialData.basePrice);

      setSelectedCategoryId(initialData.categoryId || "");

      setSelectedSubCategoryId(initialData.subcategoryId ?? "");
    }
  }, [initialData]);

  useEffect(() => {
    setValue("categoryId", selectedCategoryId);
  }, [selectedCategoryId]);
  useEffect(() => {
    setValue("subcategoryId", selectedSubCategoryId);
  }, [selectedSubCategoryId]);
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-semibold text-slate-800">
          Item Information
        </h2>
      </div>

      <form className="p-6 space-y-8" onSubmit={handleSubmit(menudata)}>
        {/* Item Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <input
            type="text"
            placeholder="Item Name"
            {...register("name")}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500"
          />

          <input
            type="text"
            placeholder="SKU"
            {...register("sku")}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input
            type="text"
            placeholder="description"
            {...register("description")}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <input
          {...register("basePrice")}
          placeholder="Price"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500"
        />
        <p className="text-red-600">{errors.basePrice?.message}</p>
        {/* Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Category */}
          <div>
            <label className="block text-sm mb-2">Category</label>

            <div className="flex gap-2">
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm"
              >
                <option value="">Select Category</option>

                {menuCategories.map((category: Category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setOpenCategoryModal(true)}
                className="w-12 rounded-xl bg-orange-600 text-white flex items-center justify-center"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Sub Category */}
          <div>
            <label className="block text-sm mb-2">Sub Category</label>

            <div className="flex gap-2">
              <select
                value={selectedSubCategoryId}
                onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm"
              >
                <option value="">Select Sub Category</option>

                {menuSubCategories.map((sub: Subcategory) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={!selectedCategoryId}
                onClick={() => setOpenSubCategoryModal(true)}
                className="w-12 rounded-xl bg-orange-600 disabled:bg-slate-300 text-white flex items-center justify-center"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={createMenuMutation.isPending}
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl text-sm font-semibold"
          >
            <Plus size={18} />

            {createMenuMutation.isPending ? "Creating..." : "Create Item"}
          </button>
        </div>
      </form>
      {openCategoryModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-5">Create Category</h2>

            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Category Name"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setOpenCategoryModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={createCategoryMutation.isPending}
                className="px-5 py-2 rounded-xl bg-orange-600 text-white"
              >
                {initialData
                  ? updateMenuMutation.isPending
                    ? "Updating..."
                    : "Update Item"
                  : createMenuMutation.isPending
                    ? "Creating..."
                    : "Create Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SubCategory Modal */}
      {openSubCategoryModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-5">Create Sub Category</h2>

            <input
              type="text"
              value={newSubCategory}
              onChange={(e) => setNewSubCategory(e.target.value)}
              placeholder="Sub Category Name"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setOpenSubCategoryModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateSubCategory}
                disabled={createSubCategoryMutation.isPending}
                className="px-5 py-2 rounded-xl bg-orange-600 text-white"
              >
                {createSubCategoryMutation.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuForm;
