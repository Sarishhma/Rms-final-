export type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
};

export type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};