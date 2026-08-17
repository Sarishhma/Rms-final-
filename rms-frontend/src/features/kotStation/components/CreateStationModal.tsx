import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  ChefHat,
  Printer,
  Hash,
  Star,
  Loader2,
  Users,
  ChevronDown,
} from "lucide-react";
import { kitchenStationSchema, type KitchenStationFormValues } from "../schemas/kitchenstation.schema";
import { useCreateKitchenStation } from "../hooks/useCreateKitchenStations";
import { useStaff } from "@/features/staff/hooks/useStaff";
import { Popover,PopoverContent, PopoverTrigger } from "@/components/ui/popover";


export const CreateKitchenStationModal = () => {
  const [open, setOpen] = useState(false);
  const { mutate: createStation, isPending } = useCreateKitchenStation();
  const { data: staff, isLoading: staffLoading } = useStaff();

  const kitchenStaff = (staff ?? []).filter((s) => s.role === "KITCHEN");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<KitchenStationFormValues>({
    resolver: zodResolver(kitchenStationSchema),
    defaultValues: {
      name: "",
      printerId: "",
      isActive: true,
      isDefault: false,
      sortOrder: 0,
      assignedStaffIds: [],
    },
  });

  const onSubmit = (values: KitchenStationFormValues) => {
    createStation(values, {
      onSuccess: () => {
        reset();
        setOpen(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold shadow-sm transition-all hover:bg-orange-600 hover:shadow-md text-white">
          <Plus className="h-4 w-4 text-white font-bold" />
          Add Station
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-2xl border-0 bg-white p-0 shadow-xl overflow-visible">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <ChefHat className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Add Kitchen Station
              </DialogTitle>
              <p className="text-xs text-gray-500">Create a new station for your kitchen</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-5 px-6 py-5">
            {/* Station Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <ChefHat className="h-3.5 w-3.5 text-gray-400" />
                Station Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. Hot Kitchen"
                className="h-11 rounded-xl border-gray-200 text-sm transition-all focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                {...register("name")}
              />
              {errors.name && (
                <p className="flex items-center gap-1.5 text-xs text-red-500">
                  <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Printer ID */}
            <div className="space-y-2">
              <Label htmlFor="printerId" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Printer className="h-3.5 w-3.5 text-gray-400" />
                Printer ID
              </Label>
              <Input
                id="printerId"
                placeholder="e.g. printer-hot-1"
                className="h-11 rounded-xl border-gray-200 text-sm transition-all focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                {...register("printerId")}
              />
              {errors.printerId && (
                <p className="flex items-center gap-1.5 text-xs text-red-500">
                  <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                  {errors.printerId.message}
                </p>
              )}
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label htmlFor="sortOrder" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Hash className="h-3.5 w-3.5 text-gray-400" />
                Sort Order
              </Label>
              <Input
                id="sortOrder"
                type="number"
                placeholder="0"
                className="h-11 rounded-xl border-gray-200 text-sm transition-all focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                {...register("sortOrder", { valueAsNumber: true })}
              />
              {errors.sortOrder && (
                <p className="flex items-center gap-1.5 text-xs text-red-500">
                  <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                  {errors.sortOrder.message}
                </p>
              )}
            </div>

            {/* Assigned Staff */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Users className="h-3.5 w-3.5 text-gray-400" />
                Assigned Staff
              </Label>
              <Controller
                control={control}
                name="assignedStaffIds"
                render={({ field }) => {
                  const selected = field.value ?? [];
                  const toggleStaff = (id: string) => {
                    field.onChange(
                      selected.includes(id)
                        ? selected.filter((s) => s !== id)
                        : [...selected, id]
                    );
                  };
                  const selectedNames = kitchenStaff
                    .filter((s) => selected.includes(s.id))
                    .map((s) => s.name);

                  return (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="flex h-11 w-full items-center justify-between rounded-xl border border-gray-200 px-3 text-sm transition-all hover:border-orange-300 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        >
                          <span className={selectedNames.length ? "text-gray-900" : "text-gray-400"}>
                            {selectedNames.length
                              ? selectedNames.join(", ")
                              : "Select staff to assign"}
                          </span>
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </button>
                      </PopoverTrigger>
                     <PopoverContent
  side="bottom"
  align="start"
  sideOffset={6}
  className="z-[9999] w-[var(--radix-popover-trigger-width)] rounded-xl border bg-white p-2 shadow-xl"
>
                        {staffLoading ? (
                          <p className="px-2 py-1.5 text-xs text-gray-400">Loading staff...</p>
                        ) : kitchenStaff.length > 0 ? (
                          <div className="max-h-48 space-y-1 overflow-y-auto">
                            {kitchenStaff.map((s) => (
                              <label
                                key={s.id}
                                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50"
                              >
                                <Checkbox
                                  checked={selected.includes(s.id)}
                                  onCheckedChange={() => toggleStaff(s.id)}
                                />
                                <span className="text-gray-700">{s.name}</span>
                                <span className="ml-auto text-xs text-gray-400">{s.email}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <p className="px-2 py-1.5 text-xs text-gray-400">No kitchen staff found</p>
                        )}
                      </PopoverContent>
                    </Popover>
                  );
                }}
              />
            </div>

            {/* Set as Default Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4 transition-colors hover:border-orange-200">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
                  <Star className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <Label htmlFor="isDefault" className="cursor-pointer text-sm font-medium text-gray-900">
                    Set as Default
                  </Label>
                  <p className="text-xs text-gray-500">Make this the primary station</p>
                </div>
              </div>
              <Controller
                control={control}
                name="isDefault"
                render={({ field }) => (
                  <Switch
                    id="isDefault"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-orange-500"
                  />
                )}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-gray-200 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-10 gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Station"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};