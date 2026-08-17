import type { Context } from "hono";
import { getValidated } from "../../middleware/validate.js";
import { created, ok } from "../../utils/response.js";
import { conflict } from "../../utils/app-error.js";
import { printerService } from "./service.js";
import type {
  listPrintersSchema,
  createPrinterSchema,
  updatePrinterSchema,
  printerIdParamSchema,
} from "./schema.js";
import type { z } from "zod";

const getCompanyId = (c: Context): string => {
  const companyId = c.get("authUser")?.companyId;
  if (!companyId) throw conflict("No company context for this user");
  return companyId;
};

export const printerController = {
  list: async (c: Context) => {
    const companyId = getCompanyId(c);
    const input = getValidated<z.infer<typeof listPrintersSchema>>(c, "query");
    const result = await printerService.list(companyId, input);
    return ok(c, result.data, result.meta);
  },

  get: async (c: Context) => {
    const companyId = getCompanyId(c);
    const { id } = getValidated<z.infer<typeof printerIdParamSchema>>(c, "param");
    return ok(c, await printerService.get(id, companyId));
  },

  create: async (c: Context) => {
    const companyId = getCompanyId(c);
    const input = getValidated<z.infer<typeof createPrinterSchema>>(c, "json");
    return created(c, await printerService.create(companyId, input));
  },

  update: async (c: Context) => {
    const companyId = getCompanyId(c);
    const { id } = getValidated<z.infer<typeof printerIdParamSchema>>(c, "param");
    const input = getValidated<z.infer<typeof updatePrinterSchema>>(c, "json");
    return ok(c, await printerService.update(id, companyId, input));
  },

  remove: async (c: Context) => {
    const companyId = getCompanyId(c);
    const { id } = getValidated<z.infer<typeof printerIdParamSchema>>(c, "param");
    return ok(c, await printerService.remove(id, companyId));
  },
};
