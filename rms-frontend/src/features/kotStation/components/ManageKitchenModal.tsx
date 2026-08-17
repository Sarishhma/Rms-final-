// src/features/kitchen-stations/components/ManageKitchenStationModal.tsx
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  X, 
  ChefHat, 
  Loader2, 
  Pencil, 
  Trash2, 
  Printer, 
  Hash, 
  Users, 
  ChevronDown 
} from "lucide-react";
import { useUpdateKitchenStation } from "../hooks/useUpdateKitchenStation";
import { useDeleteKitchenStation } from "../hooks/useDeleteKitchenStation";
import { useConfirm } from "@/providers/ConfirmProvider";
import { kitchenStationSchema, type KitchenStationFormValues } from "../schemas/kitchenstation.schema";
import { useStaff } from "@/features/staff/hooks/useStaff";
import type { KitchenStation } from "../types/kot.types";

// UI Components
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ManageKitchenStationModalProps {
  station: KitchenStation;
  onClose: () => void;
}

export function ManageKitchenStationModal({ station, onClose }: ManageKitchenStationModalProps) {
  const confirm = useConfirm();
  const { mutate: updateStation, isPending: isUpdating } = useUpdateKitchenStation();
  const { mutate: deleteStation, isPending: isDeleting } = useDeleteKitchenStation();
  const { data: staff, isLoading: staffLoading } = useStaff();
  
  // Filter only kitchen staff
  const kitchenStaff = (staff ?? []).filter((s) => s.role === "KITCHEN");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<KitchenStationFormValues>({
    resolver: zodResolver(kitchenStationSchema),
    defaultValues: {
      name: station.name,
      printerId: station.printerId ?? "",
      sortOrder: station.sortOrder,
      isActive: station.isActive,
      isDefault: station.isDefault,
      assignedStaffIds: station.assignedStaff?.map(staff => staff.id) ?? [],
    },
  });

  const isActive = watch("isActive");
  const isDefault = watch("isDefault");

  useEffect(() => {
    reset({
      name: station.name,
      printerId: station.printerId ?? "",
      sortOrder: station.sortOrder,
      isActive: station.isActive,
      isDefault: station.isDefault,
      assignedStaffIds: station.assignedStaff?.map(staff => staff.id) ?? [],
    });
  }, [station, reset]);

  const onSubmit = (data: KitchenStationFormValues) => {
    const payload = {
      name: data.name,
      printerId: data.printerId?.trim() || undefined,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
      isDefault: data.isDefault,
      staffIds: data.assignedStaffIds,
    };
    updateStation(
      { id: station.id, payload },
      { onSuccess: onClose }
    );
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete Kitchen Station",
      description: `Are you sure you want to delete "${station.name}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });
    if (!confirmed) return;
    deleteStation(station.id, { onSuccess: onClose });
  };

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2 transition duration-200 shadow-sm ${
      hasError
        ? "border-red-300 focus:ring-red-400 bg-red-50/30"
        : "border-slate-200 focus:ring-orange-500"
    }`;

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .drawer-slide {
          animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .drawer-fade {
          animation: fadeInOverlay 0.25s ease-out forwards;
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-xs drawer-fade"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-slate-50 shadow-2xl border-l border-slate-100 flex flex-col drawer-slide">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
              <ChefHat size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Manage Station</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{station.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition duration-200 cursor-pointer"
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Card */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Current Info
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div>
                <p className="text-xs text-slate-400 font-semibold">Name</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{station.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold">Printer ID</p>
                <p className="text-sm font-bold font-mono text-slate-800 mt-0.5">
                  {station.printerId || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold">Sort Order</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{station.sortOrder}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold">Status</p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full border mt-1 ${
                    station.isActive
                      ? "bg-green-50 text-green-700 border-green-100"
                      : "bg-red-50 text-red-700 border-red-100"
                  }`}
                >
                  {station.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-400 font-semibold">Default Station</p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full border mt-1 ${
                    station.isDefault
                      ? "bg-orange-50 text-orange-700 border-orange-100"
                      : "bg-gray-50 text-gray-500 border-gray-200"
                  }`}
                >
                  {station.isDefault ? "Yes" : "No"}
                </span>
              </div>
              {station.assignedStaff && station.assignedStaff.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 font-semibold">Assigned Staff</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {station.assignedStaff.map((staff) => (
                      <span
                        key={staff.id}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                      >
                        <Users size={12} />
                        {staff.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Edit Form */}
          <form
            id="manage-station-form"
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 space-y-4"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Pencil size={12} />
              Edit Details
            </h3>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Station Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("name")}
                placeholder="e.g., Grill Station"
                className={inputClass(!!errors.name)}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Printer ID */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Printer ID{" "}
                <span className="text-slate-400 font-normal text-xs">(optional)</span>
              </label>
              <div className="relative">
                <Printer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  {...register("printerId")}
                  placeholder="e.g., PR-001"
                  className={`${inputClass(!!errors.printerId)} pl-10`}
                />
              </div>
              {errors.printerId && (
                <p className="text-red-500 text-xs mt-1">{errors.printerId.message}</p>
              )}
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Sort Order <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  {...register("sortOrder", { valueAsNumber: true })}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  className={`${inputClass(!!errors.sortOrder)} pl-10`}
                />
              </div>
              {errors.sortOrder && (
                <p className="text-red-500 text-xs mt-1">{errors.sortOrder.message}</p>
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

            {/* Toggle Switches */}
            <div className="space-y-3 pt-2">
              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-700">Active Status</label>
                  <p className="text-xs text-slate-400">Station is available for use</p>
                </div>
                <button
                  type="button"
                  onClick={() => setValue("isActive", !isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                    isActive ? "bg-orange-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Default Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-700">Default Station</label>
                  <p className="text-xs text-slate-400">Set as the default kitchen station</p>
                </div>
                <button
                  type="button"
                  onClick={() => setValue("isDefault", !isDefault)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                    isDefault ? "bg-orange-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDefault ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 border-t border-slate-200 bg-white space-y-3">
          <button
            type="submit"
            form="manage-station-form"
            disabled={isSubmitting || isUpdating || !isDirty}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl transition duration-200 shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transform"
          >
            {isSubmitting || isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Pencil size={15} />
            )}
            {isSubmitting || isUpdating ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full py-3 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-100 hover:border-red-600 font-bold text-sm rounded-xl transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transform"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 size={15} />
            )}
            {isDeleting ? "Deleting..." : "Delete Station"}
          </button>
        </div>
      </div>
    </>
  );
}