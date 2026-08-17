import type { Context } from "hono";
import { getValidated } from "../../middleware/validate.js";
import { created, ok } from "../../utils/response.js";
import { conflict } from "../../utils/app-error.js";
import { kitchenStationService } from "./service.js";
import type {
  listKitchenStationsSchema,
  createKitchenStationSchema,
  updateKitchenStationSchema,
  kitchenStationIdParamSchema,
  assignRoutesSchema,
} from "./schema.js";
import type { z } from "zod";

const getCompanyId = (c: Context): string => {
  const companyId = c.get("authUser")?.companyId;
  if (!companyId) throw conflict("No company context for this user");
  return companyId;
};

export const kitchenStationController = {
  list: async (c: Context) => {
    const companyId = getCompanyId(c);
    const input = getValidated<z.infer<typeof listKitchenStationsSchema>>(c, "query");
    const result = await kitchenStationService.list(companyId, input);
    return ok(c, result.data, result.meta);
  },

  get: async (c: Context) => {
    const companyId = getCompanyId(c);
    const { id } = getValidated<z.infer<typeof kitchenStationIdParamSchema>>(c, "param");
    return ok(c, await kitchenStationService.get(id, companyId));
  },

  create: async (c: Context) => {
    const companyId = getCompanyId(c);
    const input = getValidated<z.infer<typeof createKitchenStationSchema>>(c, "json");
    return created(c, await kitchenStationService.create(companyId, input));
  },

  update: async (c: Context) => {
    const companyId = getCompanyId(c);
    const { id } = getValidated<z.infer<typeof kitchenStationIdParamSchema>>(c, "param");
    const input = getValidated<z.infer<typeof updateKitchenStationSchema>>(c, "json");
    return ok(c, await kitchenStationService.update(id, companyId, input));
  },

  remove: async (c: Context) => {
    const companyId = getCompanyId(c);
    const { id } = getValidated<z.infer<typeof kitchenStationIdParamSchema>>(c, "param");
    return ok(c, await kitchenStationService.remove(id, companyId));
  },

  setDefault: async (c: Context) => {
    const companyId = getCompanyId(c);
    const { id } = getValidated<z.infer<typeof kitchenStationIdParamSchema>>(c, "param");
    return ok(c, await kitchenStationService.setDefault(id, companyId));
  },

  getAssignments: async (c: Context) => {
    const companyId = getCompanyId(c);
    const { id } = getValidated<z.infer<typeof kitchenStationIdParamSchema>>(c, "param");
    return ok(c, await kitchenStationService.getAssignments(id, companyId));
  },

  assignRoutes: async (c: Context) => {
    const companyId = getCompanyId(c);
    const { id } = getValidated<z.infer<typeof kitchenStationIdParamSchema>>(c, "param");
    const input = getValidated<z.infer<typeof assignRoutesSchema>>(c, "json");
    return ok(c, await kitchenStationService.assignRoutes(id, companyId, input));
  },

  routing: async (c: Context) => {
    const companyId = getCompanyId(c);
    return ok(c, await kitchenStationService.effectiveRouting(companyId));
  },
};
