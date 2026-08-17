import { paginationMeta } from "../../utils/pagination.js";
import { auditRepository } from "./repository.js";
import type { listAuditSchema } from "./schema.js";
import type { z } from "zod";

export const auditService = {
  list: async (input: z.infer<typeof listAuditSchema>) => {
    const [total, rows] = await auditRepository.list(input);
    return { data: rows, meta: paginationMeta(input, total) };
  }
};
