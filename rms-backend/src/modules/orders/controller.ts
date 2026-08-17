import type { Context } from "hono";
import { getValidated } from "../../middleware/validate.js";
import { created, ok } from "../../utils/response.js";
import { orderService } from "./service.js";
import { createOrderSchema, listOrdersSchema, orderIdParamSchema, orderActionSchema, updateOrderSchema } from "./schema.js";
import type { z } from "zod";
import { publishEvent } from "../../websocket/socket.js";
import { websocketEvents } from "../../websocket/events.js";
import { badRequest } from "../../utils/app-error.js";

export const orderController = {
  list: async (c: Context) => {
    const result = await orderService.list(getValidated<z.infer<typeof listOrdersSchema>>(c, "query"));
    return ok(c, result.data, result.meta);
  },

  get: async (c: Context) => ok(c, await orderService.get(getValidated<z.infer<typeof orderIdParamSchema>>(c, "param").id)),

  create: async (c: Context) =>
    created(c, await orderService.create(getValidated<z.infer<typeof createOrderSchema>>(c, "json"), c.get("authUser").id)),

  update: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof orderIdParamSchema>>(c, "param");
    return ok(c, await orderService.update(id, getValidated<z.infer<typeof updateOrderSchema>>(c, "json"), c.get("authUser").id));
  },

  action: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof orderIdParamSchema>>(c, "param");
    const payload = getValidated<z.infer<typeof orderActionSchema>>(c, "json");
    const actorId = c.get("authUser").id;

    let order;
    switch (payload.action) {

      case "CANCEL":
        order = await orderService.cancel(id, { reason: payload.reason! }, actorId);
        break;
      case "VOID":
        order = await orderService.void(id, { reason: payload.reason! }, actorId);
        break;
      default:
        throw badRequest("Invalid action");
    }

    return ok(c, order);
  }
};