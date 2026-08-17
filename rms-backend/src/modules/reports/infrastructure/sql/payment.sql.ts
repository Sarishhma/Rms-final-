import { Prisma } from "../../../../prisma/client.js";
import { ReportFilters } from "../../domain/report.types.js";
import { reportBaseSql } from "./report-base.sql.js";

export const paymentSql = {
  summary: (f: ReportFilters) => Prisma.sql`
    WITH pd AS (
      SELECT
        COALESCE(SUM(amount), 0)::float AS received,
        COUNT(*)::int                   AS cnt,
        COALESCE(AVG(amount), 0)::float AS avg_amt
      FROM "Payment"
      WHERE ${reportBaseSql.baseWhere(f, '"Payment"', '"createdAt"')}
        AND "status" = 'COMPLETED'
        ${reportBaseSql.staffFilter(f, '"receivedById"')}
    ),
    rd AS (
      SELECT
        COALESCE(SUM(amount), 0)::float AS refunded,
        COUNT(*)::int                   AS cnt
      FROM "Refund"
      WHERE ${reportBaseSql.baseWhere(f, '"Refund"', '"createdAt"')}
        AND "status" = 'COMPLETED'
    )
    SELECT
      (SELECT received FROM pd) AS total_received,
      (SELECT cnt FROM pd)      AS total_payments,
      (SELECT avg_amt FROM pd)  AS avg_payment,
      (SELECT refunded FROM rd) AS total_refunded,
      (SELECT cnt FROM rd)      AS total_refunds,
      ((SELECT received FROM pd) - (SELECT refunded FROM rd))::float AS net_revenue
  `,

  byPeriod: (f: ReportFilters) => Prisma.sql`
    SELECT
      ${reportBaseSql.truncSql(f.resolution, '"createdAt"')} AS period,
      COUNT(*)::int AS count,
      COALESCE(SUM(amount), 0)::float AS amount
    FROM "Payment"
    WHERE ${reportBaseSql.baseWhere(f, '"Payment"', '"createdAt"')}
      AND "status" = 'COMPLETED'
      ${reportBaseSql.staffFilter(f, '"receivedById"')}
    GROUP BY period ORDER BY period ASC
  `,

  byHour: (f: ReportFilters) => Prisma.sql`
    SELECT
      date_trunc('day', "createdAt")              AS date,
      EXTRACT(HOUR FROM "createdAt")::int         AS hour,
      COUNT(*)::int AS count,
      COALESCE(SUM(amount), 0)::float AS amount
    FROM "Payment"
    WHERE ${reportBaseSql.baseWhere(f, '"Payment"', '"createdAt"')}
      AND "status" = 'COMPLETED'
      ${reportBaseSql.staffFilter(f, '"receivedById"')}
    GROUP BY date, hour ORDER BY date ASC, hour ASC
  `,

  byMethod: (f: ReportFilters) => Prisma.sql`
    WITH totals AS (
      SELECT COALESCE(SUM(amount), 0)::float AS total
      FROM "Payment"
      WHERE ${reportBaseSql.baseWhere(f, '"Payment"', '"createdAt"')}
        AND "status" = 'COMPLETED'
    )
    SELECT
      method::text AS method,
      COUNT(*)::int AS count,
      COALESCE(SUM(amount), 0)::float AS amount,
      CASE WHEN (SELECT total FROM totals) > 0
        THEN (SUM(amount) / (SELECT total FROM totals) * 100)::float
        ELSE 0 END AS percentage
    FROM "Payment"
    WHERE ${reportBaseSql.baseWhere(f, '"Payment"', '"createdAt"')}
      AND "status" = 'COMPLETED'
    GROUP BY method ORDER BY amount DESC
  `,

  byStaff: (f: ReportFilters) => Prisma.sql`
    SELECT
      p."receivedById" AS staff_id, u."name" AS staff_name,
      COUNT(*)::int AS count,
      COALESCE(SUM(p.amount), 0)::float AS amount
    FROM "Payment" p
    LEFT JOIN "User" u ON p."receivedById" = u.id
    WHERE ${reportBaseSql.baseWhere(f, 'p', '"createdAt"')}
      AND p."status" = 'COMPLETED'
      ${reportBaseSql.staffFilter(f, 'p."receivedById"')}
    GROUP BY p."receivedById", u."name"
    ORDER BY amount DESC
  `
};
