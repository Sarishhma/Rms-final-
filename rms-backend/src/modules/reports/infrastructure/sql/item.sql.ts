import { Prisma } from "../../../../prisma/client.js";
import { ReportFilters } from "../../domain/report.types.js";
import { reportBaseSql } from "./report-base.sql.js";

export const itemSql = {
  summary: (f: ReportFilters) => Prisma.sql`
    SELECT
      COALESCE(SUM(oi."quantity"), 0)::int           AS total_quantity,
      COUNT(DISTINCT oi."menuItemId")::int           AS unique_items,
      COALESCE(SUM(oi."lineSubtotal"), 0)::float     AS total_sales,
      COALESCE(AVG(oi."unitPrice"), 0)::float        AS avg_item_price
    FROM "OrderItem" oi
    JOIN "Order" o ON oi."orderId" = o.id
    JOIN "MenuItem" m ON oi."menuItemId" = m.id
    WHERE ${reportBaseSql.baseWhere(f, 'o', '"createdAt"')} ${reportBaseSql.excludeMerged('o')}
      AND o."status" IN ('CONFIRMED', 'COMPLETED')
      AND oi."status" NOT IN ('CANCELLED', 'VOIDED')
      ${reportBaseSql.channelFilter(f, 'o."channel"')}
      ${reportBaseSql.categoryFilter(f, 'm."categoryId"')}
  `,

  byPeriod: (f: ReportFilters) => Prisma.sql`
    SELECT
      ${reportBaseSql.truncSql(f.resolution, 'o."createdAt"')} AS period,
      COALESCE(SUM(oi."quantity"), 0)::int       AS quantity,
      COALESCE(SUM(oi."lineSubtotal"), 0)::float AS sales
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

  byHour: (f: ReportFilters) => Prisma.sql`
    SELECT
      date_trunc('day', o."createdAt")            AS date,
      EXTRACT(HOUR FROM o."createdAt")::int       AS hour,
      COALESCE(SUM(oi."quantity"), 0)::int         AS quantity,
      COALESCE(SUM(oi."lineSubtotal"), 0)::float   AS sales
    FROM "OrderItem" oi
    JOIN "Order" o ON oi."orderId" = o.id
    JOIN "MenuItem" m ON oi."menuItemId" = m.id
    WHERE ${reportBaseSql.baseWhere(f, 'o', '"createdAt"')} ${reportBaseSql.excludeMerged('o')}
      AND o."status" IN ('CONFIRMED', 'COMPLETED')
      AND oi."status" NOT IN ('CANCELLED', 'VOIDED')
      ${reportBaseSql.channelFilter(f, 'o."channel"')}
      ${reportBaseSql.categoryFilter(f, 'm."categoryId"')}
    GROUP BY date, hour ORDER BY date ASC, hour ASC
  `,

  byCategory: (f: ReportFilters) => Prisma.sql`
    SELECT
      m."categoryId"                                AS category_id,
      c."name"                                      AS category_name,
      COALESCE(SUM(oi."quantity"), 0)::int           AS quantity,
      COALESCE(SUM(oi."lineSubtotal"), 0)::float     AS sales,
      COUNT(DISTINCT oi."menuItemId")::int           AS item_count
    FROM "OrderItem" oi
    JOIN "Order" o ON oi."orderId" = o.id
    JOIN "MenuItem" m ON oi."menuItemId" = m.id
    LEFT JOIN "Category" c ON m."categoryId" = c.id
    WHERE ${reportBaseSql.baseWhere(f, 'o', '"createdAt"')} ${reportBaseSql.excludeMerged('o')}
      AND o."status" IN ('CONFIRMED', 'COMPLETED')
      AND oi."status" NOT IN ('CANCELLED', 'VOIDED')
      ${reportBaseSql.channelFilter(f, 'o."channel"')}
      ${reportBaseSql.categoryFilter(f, 'm."categoryId"')}
    GROUP BY m."categoryId", c."name"
    ORDER BY sales DESC
  `,

  topItems: (f: ReportFilters) => Prisma.sql`
    SELECT
      oi."menuItemId"                                AS item_id,
      mi."name"                                      AS item_name,
      COALESCE(SUM(oi."quantity"), 0)::int           AS quantity,
      COALESCE(SUM(oi."lineSubtotal"), 0)::float     AS sales,
      COUNT(DISTINCT oi."orderId")::int              AS order_count
    FROM "OrderItem" oi
    JOIN "Order" o ON oi."orderId" = o.id
    LEFT JOIN "MenuItem" mi ON oi."menuItemId" = mi.id
    WHERE ${reportBaseSql.baseWhere(f, 'o', '"createdAt"')} ${reportBaseSql.excludeMerged('o')}
      AND o."status" IN ('CONFIRMED', 'COMPLETED')
      AND oi."status" NOT IN ('CANCELLED', 'VOIDED')
      ${reportBaseSql.channelFilter(f, 'o."channel"')}
    GROUP BY oi."menuItemId", mi."name"
    ORDER BY quantity DESC
    LIMIT ${f.limit || 10}
  `,

  bottomItems: (f: ReportFilters) => Prisma.sql`
    SELECT
      oi."menuItemId"                                AS item_id,
      mi."name"                                      AS item_name,
      COALESCE(SUM(oi."quantity"), 0)::int           AS quantity,
      COALESCE(SUM(oi."lineSubtotal"), 0)::float     AS sales,
      COUNT(DISTINCT oi."orderId")::int              AS order_count
    FROM "OrderItem" oi
    JOIN "Order" o ON oi."orderId" = o.id
    LEFT JOIN "MenuItem" mi ON oi."menuItemId" = mi.id
    WHERE ${reportBaseSql.baseWhere(f, 'o', '"createdAt"')} ${reportBaseSql.excludeMerged('o')}
      AND o."status" IN ('CONFIRMED', 'COMPLETED')
      AND oi."status" NOT IN ('CANCELLED', 'VOIDED')
      ${reportBaseSql.channelFilter(f, 'o."channel"')}
    GROUP BY oi."menuItemId", mi."name"
    ORDER BY quantity ASC
    LIMIT ${f.limit || 10}
  `,

  neverOrdered: (f: ReportFilters) => Prisma.sql`
    SELECT
      mi.id                    AS item_id,
      mi."name"                AS item_name,
      c."name"                 AS category_name,
      mi."basePrice"::float    AS base_price
    FROM "MenuItem" mi
    LEFT JOIN "Category" c ON mi."categoryId" = c.id
    WHERE mi."companyId" = ${f.companyId}
      AND mi."isDeleted" = false
      AND mi."isAvailable" = true
      AND NOT EXISTS (
        SELECT 1 FROM "OrderItem" oi
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE oi."menuItemId" = mi.id
          AND o."createdAt" >= ${f.from} AND o."createdAt" < ${f.to}
          AND o."status" IN ('CONFIRMED', 'COMPLETED')
          AND o."mergedIntoOrderId" IS NULL
          AND oi."status" NOT IN ('CANCELLED', 'VOIDED')
      )
    ORDER BY mi."name" ASC
    LIMIT ${f.limit || 10}
  `
};
