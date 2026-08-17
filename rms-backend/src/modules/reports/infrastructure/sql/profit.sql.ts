import { Prisma } from "../../../../prisma/client.js";
import { ReportFilters } from "../../domain/report.types.js";
import { reportBaseSql } from "./report-base.sql.js";

export const profitSql = {
  summary: (f: ReportFilters) => Prisma.sql`
    WITH base AS (
      SELECT
        COALESCE(SUM(oi."lineSubtotal"), 0)::float AS revenue,
        COALESCE(SUM(oi."quantity" * COALESCE(oi."unitCost", 0)), 0)::float AS cogs
      FROM "OrderItem" oi
      JOIN "Order" o ON oi."orderId" = o.id
      JOIN "MenuItem" m ON oi."menuItemId" = m.id
      WHERE ${reportBaseSql.baseWhere(f, 'o', '"createdAt"')} ${reportBaseSql.excludeMerged('o')}
        AND o."status" IN ('CONFIRMED', 'COMPLETED')
        AND oi."status" NOT IN ('CANCELLED', 'VOIDED')
        ${reportBaseSql.channelFilter(f, 'o."channel"')}
        ${reportBaseSql.categoryFilter(f, 'm."categoryId"')}
    )
    SELECT
      revenue AS total_revenue,
      cogs    AS total_cogs,
      (revenue - cogs)::float AS gross_profit,
      CASE WHEN revenue > 0 THEN ((revenue - cogs) / revenue * 100)::float ELSE 0 END AS margin_pct
    FROM base
  `,

  byPeriod: (f: ReportFilters) => Prisma.sql`
    SELECT
      ${reportBaseSql.truncSql(f.resolution, 'o."createdAt"')} AS period,
      COALESCE(SUM(oi."lineSubtotal"), 0)::float AS revenue,
      COALESCE(SUM(oi."quantity" * COALESCE(oi."unitCost", 0)), 0)::float AS cogs,
      COALESCE(SUM(oi."lineSubtotal" - (oi."quantity" * COALESCE(oi."unitCost", 0))), 0)::float AS profit,
      CASE WHEN SUM(oi."lineSubtotal") > 0
        THEN (SUM(oi."lineSubtotal" - (oi."quantity" * COALESCE(oi."unitCost", 0))) / SUM(oi."lineSubtotal") * 100)::float
        ELSE 0 END AS margin_pct
    FROM "OrderItem" oi
    JOIN "Order" o ON oi."orderId" = o.id
    JOIN "MenuItem" m ON oi."menuItemId" = m.id
    WHERE ${reportBaseSql.baseWhere(f, 'o', '"createdAt"')} ${reportBaseSql.excludeMerged('o')}
      AND o."status" IN ('CONFIRMED', 'COMPLETED')
      AND oi."status" NOT IN ('CANCELLED', 'VOIDED')
      ${reportBaseSql.channelFilter(f, 'o."channel"')}
      ${reportBaseSql.categoryFilter(f, 'm."categoryId"')}
    GROUP BY period ORDER BY period ASC
  `,

  byCategory: (f: ReportFilters) => Prisma.sql`
    SELECT
      m."categoryId" AS category_id, c."name" AS category_name,
      COALESCE(SUM(oi."lineSubtotal"), 0)::float AS revenue,
      COALESCE(SUM(oi."quantity" * COALESCE(oi."unitCost", 0)), 0)::float AS cogs,
      COALESCE(SUM(oi."lineSubtotal" - (oi."quantity" * COALESCE(oi."unitCost", 0))), 0)::float AS profit,
      CASE WHEN SUM(oi."lineSubtotal") > 0
        THEN (SUM(oi."lineSubtotal" - (oi."quantity" * COALESCE(oi."unitCost", 0))) / SUM(oi."lineSubtotal") * 100)::float
        ELSE 0 END AS margin_pct
    FROM "OrderItem" oi
    JOIN "Order" o ON oi."orderId" = o.id
    JOIN "MenuItem" m ON oi."menuItemId" = m.id
    LEFT JOIN "Category" c ON m."categoryId" = c.id
    WHERE ${reportBaseSql.baseWhere(f, 'o', '"createdAt"')} ${reportBaseSql.excludeMerged('o')}
      AND o."status" IN ('CONFIRMED', 'COMPLETED')
      AND oi."status" NOT IN ('CANCELLED', 'VOIDED')
      ${reportBaseSql.channelFilter(f, 'o."channel"')}
    GROUP BY m."categoryId", c."name"
    ORDER BY profit DESC
  `,

  topProfitItems: (f: ReportFilters) => Prisma.sql`
    SELECT
      oi."menuItemId" AS item_id, mi."name" AS item_name,
      COALESCE(SUM(oi."lineSubtotal"), 0)::float AS revenue,
      COALESCE(SUM(oi."quantity" * COALESCE(oi."unitCost", 0)), 0)::float AS cogs,
      COALESCE(SUM(oi."lineSubtotal" - (oi."quantity" * COALESCE(oi."unitCost", 0))), 0)::float AS profit,
      CASE WHEN SUM(oi."lineSubtotal") > 0
        THEN (SUM(oi."lineSubtotal" - (oi."quantity" * COALESCE(oi."unitCost", 0))) / SUM(oi."lineSubtotal") * 100)::float
        ELSE 0 END AS margin_pct,
      COALESCE(SUM(oi."quantity"), 0)::int AS quantity
    FROM "OrderItem" oi
    JOIN "Order" o ON oi."orderId" = o.id
    LEFT JOIN "MenuItem" mi ON oi."menuItemId" = mi.id
    WHERE ${reportBaseSql.baseWhere(f, 'o', '"createdAt"')} ${reportBaseSql.excludeMerged('o')}
      AND o."status" IN ('CONFIRMED', 'COMPLETED')
      AND oi."status" NOT IN ('CANCELLED', 'VOIDED')
    GROUP BY oi."menuItemId", mi."name"
    ORDER BY profit DESC
    LIMIT ${f.limit || 10}
  `
};
