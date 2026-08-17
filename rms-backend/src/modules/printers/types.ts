import { z } from "zod";
import {
  createPrinterSchema,
  updatePrinterSchema,
  listPrintersSchema,
} from "./schema.js";

export type CreatePrinterInput = z.infer<typeof createPrinterSchema>;
export type UpdatePrinterInput = z.infer<typeof updatePrinterSchema>;
export type ListPrintersInput = z.infer<typeof listPrintersSchema>;
