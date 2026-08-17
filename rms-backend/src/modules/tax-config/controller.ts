import type { Context } from "hono";
import { getValidated } from "../../middleware/validate.js";
import { ok } from "../../utils/response.js";
import { taxConfigService } from "./service.js";
import type { updateTaxConfigSchema } from "./schema.js";
import type { z } from "zod";

export const taxConfigController = {
  get: async (c: Context) => ok(c, await taxConfigService.get()),

  update: async (c: Context) =>
    ok(c, await taxConfigService.update(getValidated<z.infer<typeof updateTaxConfigSchema>>(c, "json")))
};
