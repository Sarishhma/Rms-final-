import React, { createContext, useContext, useState } from "react";
import type { ConfirmOptions, ConfirmContextType } from "../types/confirm";
import ConfirmDialog from "@/features/shared/ConfirmDialog";

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside ConfirmProvider");
  return ctx.confirm;
};

export const ConfirmProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<{
    open: boolean;
    options: ConfirmOptions;
    resolve?: (value: boolean) => void;
  }>({
    open: false,
    options: {},
  });

  const confirm = (options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({
        open: true,
        options,
        resolve,
      });
    });
  };

 const handleClose = () => {
  state.resolve?.(false);

  setState((prev) => ({
    ...prev,
    open: false,
  }));
};

  const handleConfirm = () => {
    state.resolve?.(true);
    setState({ ...state, open: false });
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <ConfirmDialog
        open={state.open}
        options={state.options}
        onCancel={handleClose}
        onConfirm={handleConfirm}
      />
    </ConfirmContext.Provider>
  );
};