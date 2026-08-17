import type { Context } from "hono";
import { getValidated } from "../../middleware/validate.js";
import { created, ok } from "../../utils/response.js";
import { shiftService } from "./service.js";
import type {
  cashDrawerEventSchema,
  closeShiftSchema,
  listShiftsSchema,
  openShiftSchema,
  shiftIdParamSchema
} from "./schema.js";
import type { z } from "zod";

export const shiftController = {
  list: async (c: Context) => {
    const result = await shiftService.list(getValidated<z.infer<typeof listShiftsSchema>>(c, "query"));
    return ok(c, result.data, result.meta);
  },

  current: async (c: Context) =>
    ok(c, await shiftService.current(c.get("authUser").id)),

  get: async (c: Context) =>
    ok(c, await shiftService.get(getValidated<z.infer<typeof shiftIdParamSchema>>(c, "param").id)),

  open: async (c: Context) =>
    created(
      c,
      await shiftService.open(
        getValidated<z.infer<typeof openShiftSchema>>(c, "json"),
        c.get("authUser").id
      )
    ),

  close: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof shiftIdParamSchema>>(c, "param");
    return ok(
      c,
      await shiftService.close(
        id,
        getValidated<z.infer<typeof closeShiftSchema>>(c, "json"),
        c.get("authUser").id
      )
    );
  },

  addCashEvent: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof shiftIdParamSchema>>(c, "param");
    return created(
      c,
      await shiftService.addCashEvent(
        id,
        getValidated<z.infer<typeof cashDrawerEventSchema>>(c, "json"),
        c.get("authUser").id
      )
    );
  },

  zReport: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof shiftIdParamSchema>>(c, "param");
    return ok(c, await shiftService.zReport(id));
  }
};
