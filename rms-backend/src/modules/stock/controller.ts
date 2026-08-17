import type { Context } from "hono";
import { getValidated } from "../../middleware/validate.js";
import { created, ok } from "../../utils/response.js";
import { stockService } from "./service.js";
import type { adjustStockSchema, listStockSchema, stockIdParamSchema, openStockSchema } from "./schema.js";
import type { z } from "zod";

export const stockController = {
  list: async (c: Context) => {
    const result = await stockService.list(getValidated<z.infer<typeof listStockSchema>>(c, "query"));
    return ok(c, result.data, result.meta);
  },
  open: async (c: Context) => created(c, await stockService.open(getValidated<z.infer<typeof openStockSchema>>(c, "json"))),
  updateOpening: async (c: Context) => ok(c, await stockService.open(getValidated<z.infer<typeof openStockSchema>>(c, "json"))),
  adjust: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof stockIdParamSchema>>(c, "param");
    return ok(c, await stockService.adjust(id, getValidated<z.infer<typeof adjustStockSchema>>(c, "json"), c.get("authUser").id));
  }
};
