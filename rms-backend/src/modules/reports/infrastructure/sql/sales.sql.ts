import { Prisma } from "../../../../prisma/client.js";
import { ReportFilters } from "../../domain/report.types.js";
import { reportBaseSql } from "./report-base.sql.js";

export const salesSql = {
  summary: (f: ReportFilters) => Prisma.sql`
    SELECT
      COALESCE(SUM(b."subtotal"), 0)::float      AS gross_sales,
      COALESCE(SUM(b."discountAmount"), 0)::float      AS discount,
      COALESCE(SUM(b."grandTotal"), 0)::float    AS net_bill_amount,
      COUNT(*)::int                              AS total_orders,
      COALESCE(AVG(b."grandTotal"), 0)::float    AS avg_order_value,
      COALESCE(MAX(b."grandTotal"), 0)::float    AS max_order_value,
      COALESCE(MIN(b."grandTotal"), 0)::float    AS min_order_value
    FROM "Bill" b
    JOIN "Order" o ON b."orderId" = o.id
    WHERE ${reportBaseSql.baseWhere(f, 'b', '"createdAt"')}
      AND b."status" IN ('PAID', 'PARTIALLY_PAID')
      ${reportBaseSql.channelFilter(f, 'o."channel"')}
      ${reportBaseSql.staffFilter(f, 'o."createdById"')}
  `,

  byPeriod: (f: ReportFilters) => Prisma.sql`
    SELECT
      ${reportBaseSql.truncSql(f.resolution, 'b."createdAt"')} AS period,
      COALESCE(SUM(b."grandTotal"), 0)::float AS net_bill_amount,
      COUNT(*)::int                           AS orders,
      COALESCE(AVG(b."grandTotal"), 0)::float AS avg_value
    FROM "Bill" b
    JOIN "Order" o ON b."orderId" = o.id
    WHERE ${reportBaseSql.baseWhere(f, 'b', '"createdAt"')}
      AND b."status" IN ('PAID', 'PARTIALLY_PAID')
      ${reportBaseSql.channelFilter(f, 'o."channel"')}
      ${reportBaseSql.staffFilter(f, 'o."createdById"')}
    GROUP BY period ORDER BY period ASC
  `,

  byHour: (f: ReportFilters) => Prisma.sql`
    SELECT
      date_trunc('day', b."createdAt")           AS date,
      EXTRACT(HOUR FROM b."createdAt")::int      AS hour,
      COALESCE(SUM(b."grandTotal"), 0)::float    AS net_bill_amount,
      COUNT(*)::int                              AS orders
    FROM "Bill" b
    JOIN "Order" o ON b."orderId" = o.id
    WHERE ${reportBaseSql.baseWhere(f, 'b', '"createdAt"')}
      AND b."status" IN ('PAID', 'PARTIALLY_PAID')
      ${reportBaseSql.channelFilter(f, 'o."channel"')}
      ${reportBaseSql.staffFilter(f, 'o."createdById"')}
    GROUP BY date, hour ORDER BY date ASC, hour ASC
  `,

  byStaff: (f: ReportFilters) => Prisma.sql`
    SELECT
      o."createdById"                           AS staff_id,
      u."name"                                  AS staff_name,
      COALESCE(SUM(b."grandTotal"), 0)::float   AS net_bill_amount,
      COUNT(*)::int                             AS orders,
      COALESCE(AVG(b."grandTotal"), 0)::float   AS avg_value
    FROM "Bill" b
    JOIN "Order" o ON b."orderId" = o.id
    LEFT JOIN "User" u ON o."createdById" = u.id
    WHERE ${reportBaseSql.baseWhere(f, 'b', '"createdAt"')}
      AND b."status" IN ('PAID', 'PARTIALLY_PAID')
      ${reportBaseSql.channelFilter(f, 'o."channel"')}
      ${reportBaseSql.staffFilter(f, 'o."createdById"')}
    GROUP BY o."createdById", u."name"
    ORDER BY net_bill_amount DESC
  `,

  byChannel: (f: ReportFilters) => Prisma.sql`
    SELECT
      o.channel::text                           AS channel,
      COALESCE(SUM(b."grandTotal"), 0)::float   AS net_bill_amount,
      COUNT(*)::int                             AS orders
    FROM "Bill" b
    JOIN "Order" o ON b."orderId" = o.id
    WHERE ${reportBaseSql.baseWhere(f, 'b', '"createdAt"')}
      AND b."status" IN ('PAID', 'PARTIALLY_PAID')
      ${reportBaseSql.channelFilter(f, 'o."channel"')}
    GROUP BY o.channel ORDER BY net_bill_amount DESC
  `,

  periodComparison: (f: ReportFilters) => {
    const spanMs = f.to.getTime() - f.from.getTime();
    const prevFrom = new Date(f.from.getTime() - spanMs);
    const prevTo = f.from;
    return Prisma.sql`
      SELECT
        COALESCE(SUM(CASE WHEN b."createdAt" >= ${f.from} THEN b."grandTotal" ELSE 0 END), 0)::float AS current_revenue,
        COALESCE(SUM(CASE WHEN b."createdAt" < ${f.from}  THEN b."grandTotal" ELSE 0 END), 0)::float AS previous_revenue,
        COUNT(CASE WHEN b."createdAt" >= ${f.from} THEN 1 END)::int AS current_orders,
        COUNT(CASE WHEN b."createdAt" < ${f.from}  THEN 1 END)::int AS previous_orders
      FROM "Bill" b
      WHERE b."companyId" = ${f.companyId}
        AND b."createdAt" >= ${prevFrom} AND b."createdAt" < ${f.to}
        AND b."status" IN ('PAID', 'PARTIALLY_PAID')
    `;
  }
};
