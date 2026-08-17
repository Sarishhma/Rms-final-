import { z } from "zod";

export const openShiftSchema = z.object({
  openingCash: z
    .number({ error: "Opening cash must be a number" })
    .min(0, "Opening cash cannot be negative"),
  openingNote: z.string().max(500, "Note is too long").optional(),
});

export type OpenShiftFormValues = z.infer<typeof openShiftSchema>;

export const closeShiftSchema = z.object({
  closingCash: z
    .number({ error: "Closing cash must be a number" })
    .min(0, "Closing cash cannot be negative"),
  closingNote: z.string().max(500, "Note is too long").optional(),
});

export type CloseShiftFormValues = z.infer<typeof closeShiftSchema>;

export const cashEventSchema = z.object({
  type: z.enum(["PAY_IN", "PAY_OUT"]),
  amount: z.number({ error: "Amount must be a number" }).positive("Amount must be greater than 0"),
  reason: z.string().min(1, "Reason is required").max(200, "Reason is too long"),
  reference: z.string().max(200, "Reference is too long").optional(),
});

export type CashEventFormValues = z.infer<typeof cashEventSchema>;