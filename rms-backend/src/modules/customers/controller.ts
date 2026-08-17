import type { Context } from "hono";
import { getValidated } from "../../middleware/validate.js";
import { created, noContent, ok } from "../../utils/response.js";
import { customerService } from "./service.js";
import type {
  createCustomerSchema,
  customerIdParamSchema,
  listCustomersSchema,
  lookupCustomerSchema,
  updateCustomerSchema
} from "./schema.js";
import type { z } from "zod";

export const customerController = {
  list: async (c: Context) => {
    const result = await customerService.list(getValidated<z.infer<typeof listCustomersSchema>>(c, "query"));
    return ok(c, result.data, result.meta);
  },

  lookup: async (c: Context) =>
    ok(c, await customerService.lookup(getValidated<z.infer<typeof lookupCustomerSchema>>(c, "query"))),

  get: async (c: Context) =>
    ok(c, await customerService.get(getValidated<z.infer<typeof customerIdParamSchema>>(c, "param").id)),

  create: async (c: Context) =>
    created(c, await customerService.create(getValidated<z.infer<typeof createCustomerSchema>>(c, "json"))),

  update: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof customerIdParamSchema>>(c, "param");
    return ok(c, await customerService.update(id, getValidated<z.infer<typeof updateCustomerSchema>>(c, "json")));
  },

  remove: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof customerIdParamSchema>>(c, "param");
    await customerService.remove(id);
    return noContent(c);
  }
};
