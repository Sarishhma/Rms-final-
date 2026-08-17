import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Loader2, Package, Tag, Boxes } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useCreateInventoryItem } from "../hooks/useinventoryitem.hook";
import { useInventoryUnit } from "../../inventoryUnit/hooks/useInventoryUnit";
import { useCategories } from "@/features/menu/hooks/useCategories";
import { InventoryItemType } from "../../types/inventory.type";

// ── Schema — uses enums from types, categoryId optional ──────────────────────
const createItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(InventoryItemType),
  code: z.string().min(1, "Code is required"),
  categoryId: z.string().optional().or(z.literal("")),
  baseUnitId: z.string().min(1, "Unit is required"),
  reorderLevel: z.number().min(0),
  trackExpiry: z.boolean(),
  defaultPurchasePrice: z.number().min(0),
});

type CreateItemFormValues = z.infer<typeof createItemSchema>;

const ITEM_TYPES = [
  { value: "RAW_MATERIAL", label: "Raw material" },
  { value: "PACKAGED_ITEM", label: "Packaged item" },
  { value: "CONSUMABLE", label: "Consumable" },
  { value: "OTHER", label: "Other" },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: typeof Package;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-50 text-orange-600">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
    </div>
  );
}

function RequiredMark() {
  return <span className="text-orange-500">*</span>;
}

// ── Form ──────────────────────────────────────────────────────────────────────
export function CreateItemForm({ onSuccess }: { onSuccess?: () => void }) {
  const { inventoryUnits } = useInventoryUnit();
  const { data: categoriesData } = useCategories();
  const { mutate: createItem, isPending } = useCreateInventoryItem();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateItemFormValues>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      name: "",
      code: "",
      type: InventoryItemType.RAW_MATERIAL,
      categoryId: "",
      baseUnitId: "",
      reorderLevel: 0,
      trackExpiry: false,

      defaultPurchasePrice: 0,
    },
  });

  const trackExpiry = watch("trackExpiry");

  // only show active units
  const activeUnits = inventoryUnits?.filter((u) => u.isActive) ?? [];

  const onSubmit = (values: CreateItemFormValues) => {
    const payload = {
      ...values,
      categoryId: values.categoryId || undefined,
    };

    createItem(payload, {
      onSuccess: () => {
        toast.success("Item created");
        onSuccess?.();
      },
      onError: (err: any) => {
        const errorMsg = err?.response?.data?.message || err?.message || "";
        if (
          errorMsg.toLowerCase().includes("duplicate") ||
          errorMsg.toLowerCase().includes("already exists") ||
          errorMsg.toLowerCase().includes("code")
        ) {
          toast.error(
            "An item with this code already exists. Code must be unique.",
          );
        } else {
          toast.error("Couldn't create item — check the details and try again");
        }
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* ── Basic info ────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
        <SectionHeading icon={Package} title="Basic info" />
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Item name <RequiredMark />
            </Label>
            <Input
              id="name"
              placeholder="e.g. Chicken breast"
              className="bg-white"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="code">
              Item code <RequiredMark />
            </Label>
            <Input
              id="code"
              placeholder="e.g. RM-0123"
              className="bg-white"
              {...register("code")}
            />
            {errors.code && (
              <p className="text-xs text-red-500">{errors.code.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Item type</Label>
            <Select
              value={watch("type")}
              onValueChange={(val) =>
                setValue("type", val as InventoryItemType, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="z-[100]">
                {ITEM_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* ── Classification ────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
        <SectionHeading icon={Tag} title="Classification" />
        <div className="grid grid-cols-2 gap-3">
          {/* category is optional — no RequiredMark, no validation error shown */}
          <div className="space-y-1.5">
            <Label>Menu category</Label>
            <Select
              value={watch("categoryId")}
              onValueChange={(val) =>
                setValue("categoryId", val, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="z-[100]">
                {categoriesData?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              Base unit <RequiredMark />
            </Label>
            <Select
              value={watch("baseUnitId")}
              onValueChange={(val) =>
                setValue("baseUnitId", val, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent className="z-[100]">
                {/* only active units */}
                {activeUnits.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name} ({unit.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.baseUnitId && (
              <p className="text-xs text-red-500">
                {errors.baseUnitId.message}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Stock & costing ───────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
        <SectionHeading icon={Boxes} title="Stock & costing" />

        {/* reorder + price on one row */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="space-y-1.5">
            <Label htmlFor="reorderLevel">Reorder level</Label>
            <Input
              id="reorderLevel"
              type="number"
              min={0}
              placeholder="0"
              className="bg-white"
              {...register("reorderLevel", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="defaultPurchasePrice">Purchase price</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                Rs.
              </span>
              <Input
                id="defaultPurchasePrice"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                className="bg-white pl-9"
                {...register("defaultPurchasePrice", { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>

        {/* trackExpiry checkbox */}
        <label
          htmlFor="trackExpiry"
          className={`flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition `}
        >
          <input
            id="trackExpiry"
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
            checked={trackExpiry}
            onChange={(e) => {
              setValue("trackExpiry", e.target.checked);
            }}
          />
          <div>
            <p className="text-sm font-medium text-slate-700">Track expiry</p>
            <p className="text-xs text-slate-400">
              When enabled, expiry dates will be required each time this item is
              purchased
            </p>
          </div>
        </label>
      </section>

      {/* ── Footer actions ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSuccess?.()}
          className="rounded-xl"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-orange-600 px-6 text-white hover:bg-orange-700"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create item"
          )}
        </Button>
      </div>
    </form>
  );
}
