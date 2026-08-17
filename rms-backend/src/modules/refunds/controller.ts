import type { Context } from "hono";
import { getValidated } from "../../middleware/validate.js";
import { created, ok } from "../../utils/response.js";
import { refundService } from "./service.js";
import type {
  createRefundSchema,
  listRefundsSchema,
  refundIdParamSchema,
  voidRefundSchema
} from "./schema.js";
import type { z } from "zod";

export const refundController = {
  list: async (c: Context) => {
    const result = await refundService.list(getValidated<z.infer<typeof listRefundsSchema>>(c, "query"));
    return ok(c, result.data, result.meta);
  },

  get: async (c: Context) =>
    ok(c, await refundService.get(getValidated<z.infer<typeof refundIdParamSchema>>(c, "param").id)),

  create: async (c: Context) =>
    created(
      c,
      await refundService.create(
        getValidated<z.infer<typeof createRefundSchema>>(c, "json"),
        c.get("authUser").id
      )
    ),

  void: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof refundIdParamSchema>>(c, "param");
    return ok(
      c,
      await refundService.void(id, getValidated<z.infer<typeof voidRefundSchema>>(c, "json"), c.get("authUser").id)
    );
  }
};

export type RefundController = typeof refundController;
