import type { Context } from "hono";
import { getValidated } from "../../middleware/validate.js";
import { ok } from "../../utils/response.js";
import { auditService } from "./service.js";
import type { listAuditSchema } from "./schema.js";
import type { z } from "zod";

export const auditController = {
  list: async (c: Context) => {
    const result = await auditService.list(getValidated<z.infer<typeof listAuditSchema>>(c, "query"));
    return ok(c, result.data, result.meta);
  }
};
