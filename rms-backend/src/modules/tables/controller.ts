import type { Context } from "hono";
import { getValidated } from "../../middleware/validate.js";
import { created, ok } from "../../utils/response.js";
import { conflict } from "../../utils/app-error.js";
import { tableService } from "./service.js";
import type {
  assignOrderSchema,
  createTableSchema,
  createTableRequestSchema,
  listTablesSchema,
  tableCombineSchema,
  tableIdParamSchema,
  tableSplitSchema,
  tableSwapSchema,
  updateTableSchema,
} from "./schema.js";
import type { z } from "zod";

/** Guard: most table operations require a company-scoped user. */
const getCompanyId = (c: Context): string => {
  const companyId = c.get("authUser").companyId;
  if (!companyId) throw conflict("No company context for this user");
  return companyId;
};

export const tableController = {
  // ─── Core CRUD ──────────────────────────────────────────────────────────────

  list: async (c: Context) => {
    const input = getValidated<z.infer<typeof listTablesSchema>>(c, "query");
    const result = await tableService.list(input);
    return ok(c, result.data, result.meta);
  },

  occupied: async (c: Context) => ok(c, await tableService.occupied()),

  create: async (c: Context) => {
    const input = getValidated<z.infer<typeof createTableRequestSchema>>(c, "json");
    return created(c, await tableService.create(input));
  },

  update: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof tableIdParamSchema>>(c, "param");
    const input = getValidated<z.infer<typeof updateTableSchema>>(c, "json");
    return ok(c, await tableService.update(id, input));
  },

  remove: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof tableIdParamSchema>>(c, "param");
    return ok(c, await tableService.remove(id));
  },

  release: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof tableIdParamSchema>>(c, "param");
    const text = await c.req.text();
    const body = text ? JSON.parse(text) : {};
    return ok(c, await tableService.release(id, c.get("authUser").id, body.reason, body.force === true));
  },

  // ─── Assign / seat an order (table → order) ───────────────────────────────────

  assignOrder: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof tableIdParamSchema>>(c, "param");
    const input = getValidated<z.infer<typeof assignOrderSchema>>(c, "json");
    return created(c, await tableService.assignOrder(id, input, c.get("authUser").id));
  },

  // ─── Swap ────────────────────────────────────────────────────────────────────

  swap: async (c: Context) => {
    const companyId = getCompanyId(c);
    const input = getValidated<z.infer<typeof tableSwapSchema>>(c, "json");
    return ok(
      c,
      await tableService.swapTable(
        companyId,
        // input.orderId,
        input.fromTableId,
        input.toTableId,
        c.get("authUser").id,
        input.reason
      )
    );
  },

  // ─── Combine ─────────────────────────────────────────────────────────────────

  combine: async (c: Context) => {
    const companyId = getCompanyId(c);
    const input = getValidated<z.infer<typeof tableCombineSchema>>(c, "json");
    return created(
      c,
      await tableService.combineTable(
        companyId,
        input.tableIds,
        c.get("authUser").id,
        input.reason
      )
    );
  },

  // ─── Split ──────────────────────────────────────────────────────────────────

  split: async (c: Context) => {
    const companyId = getCompanyId(c);
    const input = getValidated<z.infer<typeof tableSplitSchema>>(c, "json");
    // Resolve fromTableId from the source order's current table
    const sourceOrder = await tableService.getOrderTable(input.sourceOrderId, companyId);
    return created(
      c,
      await tableService.splitTable(
        companyId,
        input.sourceOrderId,
        sourceOrder.tableId,
        input.toTableId,
        input.items,
        c.get("authUser").id,
        input.reason
      )
    );
  },
};
