import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient, useQuery } from "@tanstack/react-query";

import api from "@/lib/client";

import type { MenuItem, Category } from "@/features/menu/types";
import { useCategories } from "@/features/menu/hooks/useCategories";
import type { NormalizedError } from "@/lib/api/interceptor";
import toast from "react-hot-toast";

const createMenuItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  type: z.enum(["FOOD", "BEVERAGE", "OTHER"]).default("FOOD"),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().optional(),
  basePrice: z.number().min(0),
  sku: z.string().trim().max(80).optional(),
  trackStock: z.boolean(),
  variants: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        price: z.number().min(0),
        sku: z.string().trim().max(80).optional(),
        trackStock: z.boolean(),
      }),
    )
    .default([]),

  addons: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        price: z.number().min(0),
      }),
    )
    .default([]),
});

const updateMenuItemSchema = createMenuItemSchema.partial();

type UpdateMenuItemForm = z.infer<typeof updateMenuItemSchema>;

interface Props {
  item: MenuItem;
  onClose: () => void;
}

export default function EditMenuItemModal({ item, onClose }: Props) {
  const queryClient = useQueryClient();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories = [] } = useCategories();
  const { data: subcategories = [] } = useQuery<Category[]>({
    queryKey: ["subcategories"],
    queryFn: async () => {
      const res = await api.get("/api/menu/subcategories");
      return res.data.data;
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<UpdateMenuItemForm>({
    resolver: zodResolver(updateMenuItemSchema),

    defaultValues: {
      name: item.name,
      description: item.description ?? undefined,
      type: item.type,
      categoryId: item.categoryId,
      subcategoryId: item.subcategoryId ?? undefined,
      basePrice: item.basePrice,
      sku: item.sku ?? undefined,
      trackStock: item.trackStock,

      variants:
        item.variants?.map((v) => ({
          name: v.name,
          price: v.price,
          sku: v.sku ?? undefined,
          trackStock: v.trackStock,
        })) ?? [],

      addons:
        item.addons?.map((a) => ({
          name: a.name,
          price: a.price,
        })) ?? [],
    },
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: "variants",
  });

  const {
    fields: addonFields,
    append: appendAddon,
    remove: removeAddon,
  } = useFieldArray({
    control,
    name: "addons",
  });

  const onSubmit = async (data: UpdateMenuItemForm) => {
    if (!isDirty) {
      return;
    }
    setIsSubmitting(true);

    try {
      const buildPatchPayload = (data: UpdateMenuItemForm, dirty: any) => {
        const payload: any = {};

        Object.keys(dirty).forEach((key) => {
          if (key === "variants" || key === "addons") return;
          payload[key] = data[key as keyof UpdateMenuItemForm];
        });

        // trim strings
        if (payload.sku) payload.sku = payload.sku.trim();
        if (payload.description)
          payload.description = payload.description.trim();

        // handle variants and addons separately
        if (dirty.variants) {
          payload.variants = data.variants?.map((v) => ({
            ...v,
            sku: v.sku?.trim() || undefined,
          }));
        }

        if (dirty.addons) {
          payload.addons = data.addons;
        }

        return payload;
      };

      const patchPayload = buildPatchPayload(data, dirtyFields);
      if (patchPayload) {
        await api.patch(`/api/menu/items/${item.id}`, patchPayload);

        await queryClient.invalidateQueries({
          queryKey: ["menuItems"],
        });
      }
      onClose();
    } catch (error) {
      const err = error as NormalizedError;

      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg mx-4 shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-lg font-bold text-gray-800">Edit Menu Item</h3>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 p-5 overflow-y-auto flex-1"
        >
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Name
            </label>

            <input
              {...register("name")}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-400"
            />

            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Description
            </label>

            <textarea
              {...register("description")}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-400 resize-none"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Type
            </label>

            <select
              {...register("type")}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-400 bg-white"
            >
              <option value="FOOD">Food</option>
              <option value="BEVERAGE">Beverage</option>
              <option value="OTHER">Other</option>
            </select>

            {errors.type && (
              <p className="text-red-400 text-xs mt-1">{errors.type.message}</p>
            )}
          </div>

          {/* Price + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Base Price
              </label>

              <input
                {...register("basePrice", {
                  valueAsNumber: true,
                })}
                type="number"
                min={0}
                step={0.01}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Category
              </label>

              <select
                {...register("categoryId")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-400 bg-white"
              >
                <option value="">Select category</option>

                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SubCategory */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Subcategory
              </label>

              <select
                {...register("subcategoryId")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-400 bg-white"
              >
                <option value="">Select subcategory</option>

                {subcategories.map((sub: any) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>

              {errors.subcategoryId && (
                <p className="text-red-400 text-xs mt-1">Invalid subcategory</p>
              )}
            </div>
          </div>

          {/* SKU + Track */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                SKU
              </label>

              <input
                {...register("sku")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-400"
              />
            </div>

            <div className="flex items-center gap-2 pb-2">
              <input
                {...register("trackStock")}
                type="checkbox"
                className="accent-orange-500"
              />

              <span className="text-sm text-gray-600">Track stock</span>
            </div>
          </div>

          {/* Variants */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Variants
              </label>

              <button
                type="button"
                onClick={() =>
                  appendVariant({ name: "", price: 0, trackStock: true })
                }
                className="text-xs text-orange-500 font-medium hover:underline"
              >
                + Add Variant
              </button>
            </div>

            {variantFields.map((field, i) => (
              <div
                key={field.id}
                className="flex gap-2 items-start mb-2 bg-gray-50 rounded-lg p-3"
              >
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    {...register(`variants.${i}.name`)}
                    placeholder="Name"
                    className="border border-gray-200 rounded px-2 py-1.5 text-xs"
                  />

                  <input
                    {...register(`variants.${i}.price`, {
                      valueAsNumber: true,
                    })}
                    type="number"
                    placeholder="Price"
                    className="border border-gray-200 rounded px-2 py-1.5 text-xs"
                  />

                  <input
                    {...register(`variants.${i}.sku`)}
                    placeholder="SKU"
                    className="border border-gray-200 rounded px-2 py-1.5 text-xs"
                  />

                  <div className="flex items-center gap-1">
                    <input
                      {...register(`variants.${i}.trackStock`)}
                      type="checkbox"
                    />

                    <span className="text-xs">Track stock</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  className="text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Addons */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Add-ons
              </label>

              <button
                type="button"
                onClick={() =>
                  appendAddon({
                    name: "",
                    price: 0,
                  })
                }
                className="text-xs text-orange-500 font-medium hover:underline"
              >
                + Add Addon
              </button>
            </div>

            {addonFields.map((field, i) => (
              <div
                key={field.id}
                className="flex gap-2 items-center mb-2 bg-gray-50 rounded-lg p-3"
              >
                <input
                  {...register(`addons.${i}.name`)}
                  placeholder="Addon name"
                  className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-xs"
                />

                <input
                  {...register(`addons.${i}.price`, {
                    valueAsNumber: true,
                  })}
                  type="number"
                  placeholder="Price"
                  className="w-24 border border-gray-200 rounded px-2 py-1.5 text-xs"
                />

                <button
                  type="button"
                  onClick={() => removeAddon(i)}
                  className="text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-lg py-2.5 text-sm font-medium"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
