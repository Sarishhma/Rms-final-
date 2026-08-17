import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreatePrinter } from "../hook/usePrinters";
import { useKitchenStations } from "@/features/kotStation/hooks/useKitchenStations";
import { Modal } from "./Dialog";
import { printerSchema } from "../schema";

type PrinterFormValues = z.infer<typeof printerSchema>;

interface AddPrinterDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddPrinterDialog({ open, onClose }: AddPrinterDialogProps) {
  const { mutate, isPending } = useCreatePrinter();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<PrinterFormValues>({
    resolver: zodResolver(printerSchema),
    defaultValues: {
      name: "",
      ipAddress: "",
      port: 9100,
      isKitchen: false,
      isEnabled: true,
      kitchenStationId: "",
      assignedUserId: "",
    },
  });

  const isKitchen = watch("isKitchen");

  // Only fetch stations when the kitchen checkbox is on — avoids an unnecessary call otherwise
  const { data: stationsData, isLoading: stationsLoading } = useKitchenStations(
    isKitchen ? { page: 1, limit: 100 } : undefined,
  );
  const stations = stationsData?.data ?? [];

  const onSubmit = (values: PrinterFormValues) => {
    mutate(
      {
        ...values,
        kitchenStationId: values.isKitchen
          ? values.kitchenStationId || null
          : null,
        assignedUserId: values.assignedUserId || null,
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Printer">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            {...register("name")}
            className="w-full border rounded-md px-3 py-2"
            placeholder="Kitchen Printer 1"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">IP Address</label>
            <input
              {...register("ipAddress")}
              className="w-full border rounded-md px-3 py-2"
              placeholder="192.168.1.50"
            />
            {errors.ipAddress && (
              <p className="text-red-500 text-xs mt-1">
                {errors.ipAddress.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Port</label>
            <input
              type="number"
              {...register("port", { valueAsNumber: true })}
              className="w-full border rounded-md px-3 py-2"
            />
            {errors.port && (
              <p className="text-red-500 text-xs mt-1">{errors.port.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("isKitchen")} />
            Kitchen Printer
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("isEnabled")} />
            Enabled
          </label>
        </div>

        {isKitchen && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Kitchen Station
            </label>
            <Controller
              name="kitchenStationId"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  value={field.value ?? ""}
                  className="w-full border rounded-md px-3 py-2 bg-white"
                  disabled={stationsLoading}
                >
                  <option value="">
                    {stationsLoading
                      ? "Loading stations..."
                      : "Select a station"}
                  </option>

                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.kitchenStationId && (
              <p className="text-red-500 text-xs mt-1">
                {errors.kitchenStationId.message}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">
            Assigned User ID (optional)
          </label>
          <input
            {...register("assignedUserId")}
            className="w-full border rounded-md px-3 py-2"
            placeholder="User UUID"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Add Printer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
