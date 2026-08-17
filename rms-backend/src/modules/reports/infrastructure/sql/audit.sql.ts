import { Prisma } from "../../../../prisma/client.js";
import { ReportFilters } from "../../domain/report.types.js";
import { reportBaseSql } from "./report-base.sql.js";

export const auditSql = {
  summary: (f: ReportFilters) => Prisma.sql`
    SELECT
      COUNT(*)::int                   AS total_actions,
      COUNT(DISTINCT "actorId")::int  AS unique_actors,
      COUNT(DISTINCT "entity")::int   AS unique_entities
    FROM "AuditLog"
    WHERE ${reportBaseSql.baseWhere(f, '"AuditLog"', '"createdAt"')}
      ${reportBaseSql.staffFilter(f, '"actorId"')}
  `,

  byPeriod: (f: ReportFilters) => Prisma.sql`
    SELECT ${reportBaseSql.truncSql(f.resolution, '"createdAt"')} AS period, COUNT(*)::int AS count
    FROM "AuditLog"
    WHERE ${reportBaseSql.baseWhere(f, '"AuditLog"', '"createdAt"')}
      ${reportBaseSql.staffFilter(f, '"actorId"')}
    GROUP BY period ORDER BY period ASC
  `,

  byHour: (f: ReportFilters) => Prisma.sql`
    SELECT
      date_trunc('day', "createdAt")              AS date,
      EXTRACT(HOUR FROM "createdAt")::int         AS hour,
      COUNT(*)::int AS count
    FROM "AuditLog"
    WHERE ${reportBaseSql.baseWhere(f, '"AuditLog"', '"createdAt"')}
      ${reportBaseSql.staffFilter(f, '"actorId"')}
    GROUP BY date, hour ORDER BY date ASC, hour ASC
  `,

  byAction: (f: ReportFilters) => Prisma.sql`
    SELECT action::text AS action, COUNT(*)::int AS count
    FROM "AuditLog"
    WHERE ${reportBaseSql.baseWhere(f, '"AuditLog"', '"createdAt"')}
    GROUP BY action ORDER BY count DESC
  `,

  byEntity: (f: ReportFilters) => Prisma.sql`
    SELECT entity::text AS entity, COUNT(*)::int AS count
    FROM "AuditLog"
    WHERE ${reportBaseSql.baseWhere(f, '"AuditLog"', '"createdAt"')}
    GROUP BY entity ORDER BY count DESC
  `,

  byStaff: (f: ReportFilters) => Prisma.sql`
    SELECT a."actorId" AS staff_id, u."name" AS staff_name, COUNT(*)::int AS count
    FROM "AuditLog" a
    LEFT JOIN "User" u ON a."actorId" = u.id
    WHERE ${reportBaseSql.baseWhere(f, 'a', '"createdAt"')}
      AND a."actorId" IS NOT NULL
      ${reportBaseSql.staffFilter(f, 'a."actorId"')}
    GROUP BY a."actorId", u."name"
    ORDER BY count DESC
  `
};
