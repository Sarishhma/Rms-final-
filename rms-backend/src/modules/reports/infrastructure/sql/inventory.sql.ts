import { Prisma } from "../../../../prisma/client.js";
import { ReportFilters } from "../../domain/report.types.js";
import { startOfDay } from "../../../../utils/dates.js";

export const inventorySql = {
  summary: (f: ReportFilters) => {
    const businessDate = startOfDay(f.from);
    return Prisma.sql`
      SELECT
        COUNT(*)::int                                                      AS total_items_tracked,
        COUNT(CASE WHEN status = 'IN_STOCK' THEN 1 END)::int              AS total_in_stock,
        COUNT(CASE WHEN status = 'LOW_STOCK' THEN 1 END)::int             AS total_low_stock,
        COUNT(CASE WHEN status = 'OUT_OF_STOCK' THEN 1 END)::int          AS total_out_of_stock,
        COALESCE(SUM("remainingQty"), 0)::int                              AS total_remaining_qty
      FROM "DailyStock"
      WHERE "companyId" = ${f.companyId} AND "businessDate" = ${businessDate}
    `;
  },

  byCategory: (f: ReportFilters) => {
    const businessDate = startOfDay(f.from);
    return Prisma.sql`
      SELECT
        m."categoryId" AS category_id, c."name" AS category_name,
        COUNT(ds.id)::int AS items_tracked,
        COALESCE(SUM(ds."remainingQty"), 0)::int AS remaining_qty
      FROM "DailyStock" ds
      JOIN "MenuItem" m ON ds."menuItemId" = m.id
      LEFT JOIN "Category" c ON m."categoryId" = c.id
      WHERE ds."companyId" = ${f.companyId} AND ds."businessDate" = ${businessDate}
      GROUP BY m."categoryId", c."name"
      ORDER BY remaining_qty DESC
    `;
  },

  criticalStock: (f: ReportFilters) => {
    const businessDate = startOfDay(f.from);
    return Prisma.sql`
      SELECT
        ds."menuItemId" AS item_id, mi."name" AS item_name,
        ds."remainingQty" AS remaining_qty, ds.status::text AS status
      FROM "DailyStock" ds
      LEFT JOIN "MenuItem" mi ON ds."menuItemId" = mi.id
      WHERE ds."companyId" = ${f.companyId}
        AND ds."businessDate" = ${businessDate}
        AND ds.status IN ('LOW_STOCK', 'OUT_OF_STOCK')
      ORDER BY ds."remainingQty" ASC
    `;
  },

  transactions: (f: ReportFilters) => {
    const businessDate = startOfDay(f.from);
    return Prisma.sql`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'PURCHASE' THEN quantity ELSE 0 END), 0)::int AS purchase_qty,
        COALESCE(SUM(CASE WHEN type = 'PURCHASE' THEN quantity * COALESCE("unitCost", 0) ELSE 0 END), 0)::float AS purchase_cost,
        COALESCE(SUM(CASE WHEN type = 'WASTAGE' THEN quantity ELSE 0 END), 0)::int AS wastage_qty,
        COALESCE(SUM(CASE WHEN type = 'WASTAGE' THEN quantity * COALESCE("unitCost", 0) ELSE 0 END), 0)::float AS wastage_cost
      FROM "InventoryTransaction"
      WHERE "companyId" = ${f.companyId}
        AND date_trunc('day', "createdAt") = ${businessDate}
    `;
  }
};
