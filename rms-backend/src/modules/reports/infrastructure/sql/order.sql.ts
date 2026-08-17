import { Prisma } from "../../../../prisma/client.js";
import { ReportFilters } from "../../domain/report.types.js";
import { reportBaseSql } from "./report-base.sql.js";

export const orderSql = {
  summary: (f: ReportFilters) => Prisma.sql`
    WITH base AS (
      SELECT
        o.id,
        o.status,
        o."grandTotal",
        o."guestCount",
        (SELECT COUNT(*)::int FROM "OrderItem" oi WHERE oi."orderId" = o.id AND oi.status != 'CANCELLED' AND oi.status != 'VOIDED') AS item_count
      FROM "Order" o
      WHERE ${reportBaseSql.baseWhere(f, 'o', '"createdAt"')} ${reportBaseSql.excludeMerged('o')}
        ${reportBaseSql.channelFilter(f, 'o."channel"')}
        ${reportBaseSql.staffFilter(f, 'o."createdById"')}
    )
    SELECT
      COUNT(*)::int                                                                       AS total_orders,
      COUNT(CASE WHEN status IN ('COMPLETED', 'CONFIRMED') THEN 1 END)::int               AS completed_orders,
      COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END)::int                               AS cancelled_orders,
      COUNT(CASE WHEN status = 'VOIDED' THEN 1 END)::int                                  AS voided_orders,
      COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END)::int                                   AS pending_orders,
      COALESCE(AVG("grandTotal"), 0)::float                                                AS avg_order_value,
      COALESCE(MAX("grandTotal"), 0)::float                                                AS max_order_value,
      COALESCE(MIN(CASE WHEN "grandTotal" > 0 THEN "grandTotal" END), 0)::float            AS min_order_value,
      COALESCE(AVG("guestCount"), 0)::float                                                AS avg_guest_count,
      COALESCE(AVG(item_count), 0)::float                                                  AS avg_items_per_order,
      CASE WHEN COUNT(*) > 0
        THEN (COUNT(CASE WHEN status IN ('CANCELLED', 'VOIDED') THEN 1 END)::float / COUNT(*)::float * 100)
        ELSE 0 END::float                                                                  AS cancellation_rate
    FROM base
  `,

  byPeriod: (f: ReportFilters) => Prisma.sql`
    SELECT
      ${reportBaseSql.truncSql(f.resolution, '"createdAt"')} AS period,
      COUNT(*)::int                                                      AS orders,
      COALESCE(SUM("grandTotal"), 0)::float                              AS revenue,
      COUNT(CASE WHEN status IN ('CANCELLED', 'VOIDED') THEN 1 END)::int AS cancelled,
      CASE WHEN COUNT(*) > 0
        THEN (COUNT(CASE WHEN status IN ('CANCELLED', 'VOIDED') THEN 1 END)::float / COUNT(*)::float * 100)
        ELSE 0 END::float                                                AS cancellation_rate
    FROM "Order"
    WHERE ${reportBaseSql.baseWhere(f, '"Order"', '"createdAt"')} ${reportBaseSql.excludeMerged('"Order"')}
      ${reportBaseSql.channelFilter(f, '"channel"')}
      ${reportBaseSql.staffFilter(f, '"createdById"')}
    GROUP BY period ORDER BY period ASC
  `,

  byHour: (f: ReportFilters) => Prisma.sql`
    SELECT
      date_trunc('day', "createdAt")              AS date,
      EXTRACT(HOUR FROM "createdAt")::int         AS hour,
      COUNT(*)::int                               AS orders,
      COALESCE(SUM("grandTotal"), 0)::float       AS revenue
    FROM "Order"
    WHERE ${reportBaseSql.baseWhere(f, '"Order"', '"createdAt"')} ${reportBaseSql.excludeMerged('"Order"')}
      ${reportBaseSql.channelFilter(f, '"channel"')}
      ${reportBaseSql.staffFilter(f, '"createdById"')}
    GROUP BY date, hour ORDER BY date ASC, hour ASC
  `,

  byChannel: (f: ReportFilters) => Prisma.sql`
    SELECT
      channel::text                                                         AS channel,
      COUNT(*)::int                                                         AS orders,
      COALESCE(SUM("grandTotal"), 0)::float                                 AS revenue,
      COALESCE(AVG("grandTotal"), 0)::float                                 AS avg_value,
      CASE WHEN COUNT(*) > 0
        THEN (COUNT(CASE WHEN status IN ('CANCELLED', 'VOIDED') THEN 1 END)::float / COUNT(*)::float * 100)
        ELSE 0 END::float                                                   AS cancellation_rate
    FROM "Order"
    WHERE ${reportBaseSql.baseWhere(f, '"Order"', '"createdAt"')} ${reportBaseSql.excludeMerged('"Order"')}
    GROUP BY channel ORDER BY revenue DESC
  `,

  avgFulfillmentTime: (f: ReportFilters) => Prisma.sql`
    SELECT
      COALESCE(AVG(EXTRACT(EPOCH FROM ("completedAt" - "createdAt")) / 60), 0)::float AS avg_minutes,
      COALESCE(MIN(EXTRACT(EPOCH FROM ("completedAt" - "createdAt")) / 60), 0)::float AS min_minutes,
      COALESCE(MAX(EXTRACT(EPOCH FROM ("completedAt" - "createdAt")) / 60), 0)::float AS max_minutes
    FROM "Order"
    WHERE ${reportBaseSql.baseWhere(f, '"Order"', '"createdAt"')} ${reportBaseSql.excludeMerged('"Order"')}
      AND "completedAt" IS NOT NULL
      ${reportBaseSql.channelFilter(f, '"channel"')}
  `
};
