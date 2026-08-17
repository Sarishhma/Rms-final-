import type { Context } from "hono";
import { getValidated } from "../../middleware/validate.js";
import { ok } from "../../utils/response.js";
import { kotService } from "./service.js";
import type { fireKotItemsSchema, kotIdParamSchema, kotItemIdParamSchema, kotOrderIdParamSchema, listKotSchema, updateKotStatusSchema } from "./schema.js";
import type { z } from "zod";

export const kotController = {
  list: async (c: Context) => {
    const result = await kotService.list(getValidated<z.infer<typeof listKotSchema>>(c, "query"));
    return ok(c, result.data, result.meta);
  },
  get: async (c: Context) => ok(c, await kotService.get(getValidated<z.infer<typeof kotIdParamSchema>>(c, "param").id)),
  listByOrder: async (c: Context) => ok(c, await kotService.listByOrder(getValidated<z.infer<typeof kotOrderIdParamSchema>>(c, "param").orderId)),
  updateStatus: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof kotIdParamSchema>>(c, "param");
    return ok(c, await kotService.updateStatus(id, getValidated<z.infer<typeof updateKotStatusSchema>>(c, "json")));
  },
  updateItemStatus: async (c: Context) => {
    const { itemId } = getValidated<z.infer<typeof kotItemIdParamSchema>>(c, "param");
    return ok(c, await kotService.updateItemStatus(itemId, getValidated<z.infer<typeof updateKotStatusSchema>>(c, "json")));
  },
  fireOrderItems: async (c: Context) => {
    const { orderId } = getValidated<z.infer<typeof kotOrderIdParamSchema>>(c, "param");
    return ok(c, await kotService.fireOrderItems(orderId, getValidated<z.infer<typeof fireKotItemsSchema>>(c, "json")));
  }
};
