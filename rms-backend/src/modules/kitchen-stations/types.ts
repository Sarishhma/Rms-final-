import { z } from "zod";
import {
  createKitchenStationSchema,
  updateKitchenStationSchema,
  listKitchenStationsSchema,
  assignRoutesSchema,
} from "./schema.js";

export type CreateKitchenStationInput = z.infer<typeof createKitchenStationSchema>;
export type UpdateKitchenStationInput = z.infer<typeof updateKitchenStationSchema>;
export type ListKitchenStationsInput = z.infer<typeof listKitchenStationsSchema>;
export type AssignRoutesInput = z.infer<typeof assignRoutesSchema>;
