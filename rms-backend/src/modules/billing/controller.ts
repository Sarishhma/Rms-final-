import type { Context } from "hono";
import { getValidated } from "../../middleware/validate.js";
import { created, ok } from "../../utils/response.js";
import { billingService } from "./service.js";
import type { billIdParamSchema, generateBillSchema, listBillsSchema } from "./schema.js";
import type { z } from "zod";

export const billingController = {
  list: async (c: Context) => {
    const result = await billingService.list(getValidated<z.infer<typeof listBillsSchema>>(c, "query"));
    return ok(c, result.data, result.meta);
  },
  get: async (c: Context) => ok(c, await billingService.get(getValidated<z.infer<typeof billIdParamSchema>>(c, "param").id)),
  generate: async (c: Context) =>
    created(c, await billingService.generate(getValidated<z.infer<typeof generateBillSchema>>(c, "json"), c.get("authUser").id))
};
