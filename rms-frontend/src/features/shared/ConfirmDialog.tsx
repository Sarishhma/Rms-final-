import type { ConfirmOptions } from "../../types/confirm";

type Props = {
  open: boolean;
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  options,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  const {
    title = "Are you sure?",
    description = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "danger",
  } = options;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[420px] rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">{title}</h2>

        <p className="mt-2 text-sm text-gray-600">
          {description}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-md border px-4 py-2"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className={`rounded-md px-4 py-2 text-white ${
              type === "danger"
                ? "bg-red-600"
                : type === "warning"
                ? "bg-yellow-500"
                : "bg-blue-600"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}