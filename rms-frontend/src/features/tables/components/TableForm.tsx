import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tableSchema } from "@/zod/table.schema";
import { useCreateTable } from "@/features/tables/hooks/useTables";
import { toast } from "react-hot-toast";

type TableFormProps = {
  onClose?: () => void;
};

function TableForm({ onClose }: TableFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(tableSchema),
  });

  const { mutateAsync: createTable } = useCreateTable();

  const onSubmit = async (data: any) => {
    const payload = {
      ...data,
      capacity: Number(data.capacity),
    };

    await createTable(payload);
 toast.success("Table create successfully")
    reset();
    onClose?.(); // close form after successful create
  };

  return (
    <form className="p-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
      
      {/* Table Name */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Table Number
        </label>

        <input
          {...register("name")}
          className="w-full border px-4 py-3 rounded-xl"
          placeholder="e.g. 12"
        />

        <p className="text-red-500 text-sm">
          {errors.name?.message}
        </p>
      </div>

      {/* Capacity */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Capacity
        </label>

        <input
          type="number"
          {...register("capacity")}
          className="w-full border px-4 py-3 rounded-xl"
          placeholder="e.g. 4"
        />

        <p className="text-red-500 text-sm">
          {errors.capacity?.message}
        </p>
      </div>

      {/* Floor */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Floor
        </label>

        <input
          {...register("floor")}
          className="w-full border px-4 py-3 rounded-xl"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border rounded-xl"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-orange-600 text-white rounded-xl"
        >
          {isSubmitting ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}

export default TableForm;