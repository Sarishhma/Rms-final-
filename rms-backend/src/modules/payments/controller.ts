import type { Context } from "hono";
import { getValidated } from "../../middleware/validate.js";
import { created, ok } from "../../utils/response.js";
import { paymentService } from "./service.js";
import type { createPaymentSchema, listPaymentsSchema, paymentIdParamSchema, voidPaymentSchema } from "./schema.js";
import type { z } from "zod";

export const paymentController = {
  list: async (c: Context) => {
    const result = await paymentService.list(getValidated<z.infer<typeof listPaymentsSchema>>(c, "query"));
    return ok(c, result.data, result.meta);
  },
  create: async (c: Context) =>
    created(c, await paymentService.create(getValidated<z.infer<typeof createPaymentSchema>>(c, "json"), c.get("authUser").id)),
  void: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof paymentIdParamSchema>>(c, "param");
    return ok(c, await paymentService.void(id, getValidated<z.infer<typeof voidPaymentSchema>>(c, "json"), c.get("authUser").id));
  }
};
