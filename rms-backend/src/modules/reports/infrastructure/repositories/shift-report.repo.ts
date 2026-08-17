import { prisma } from "../../../../prisma/client.js";
import { ReportFilters } from "../../domain/report.types.js";
import { reportBaseSql } from "../sql/report-base.sql.js";

export const shiftReportRepo = {
  summary: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      total_shifts: number;
      open_shifts: number;
      closed_shifts: number;
      total_cash_variance: number;
    }>>`
      SELECT
        COUNT(*)::int AS total_shifts,
        COUNT(CASE WHEN status = 'OPEN' THEN 1 END)::int AS open_shifts,
        COUNT(CASE WHEN status = 'CLOSED' THEN 1 END)::int AS closed_shifts,
        COALESCE(SUM(variance), 0)::float AS total_cash_variance
      FROM "Shift"
      WHERE ${reportBaseSql.baseWhere(f, '"Shift"', '"openedAt"')}
    `;
  },
  
  shiftList: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      shift_id: string;
      shift_number: string;
      cashier_name: string;
      status: string;
      opened_at: Date;
      closed_at: Date | null;
      total_sales: number;
      total_refunds: number;
      expected_cash: number;
      variance: number;
    }>>`
      SELECT
        s.id AS shift_id,
        s."shiftNumber" AS shift_number,
        u."name" AS cashier_name,
        s.status::text AS status,
        s."openedAt" AS opened_at,
        s."closedAt" AS closed_at,
        COALESCE(s."totalSales", 0)::float AS total_sales,
        COALESCE(s."totalRefunds", 0)::float AS total_refunds,
        COALESCE(s."expectedCash", 0)::float AS expected_cash,
        COALESCE(s.variance, 0)::float AS variance
      FROM "Shift" s
      LEFT JOIN "User" u ON s."openedById" = u.id
      WHERE ${reportBaseSql.baseWhere(f, 's', '"openedAt"')}
      ORDER BY s."openedAt" DESC
    `;
  }
};
