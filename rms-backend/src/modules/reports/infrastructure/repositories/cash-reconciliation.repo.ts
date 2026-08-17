import { prisma } from "../../../../prisma/client.js";
import { ReportFilters } from "../../domain/report.types.js";
import { Prisma } from "../../../../prisma/client.js";
import { reportBaseSql } from "../sql/report-base.sql.js";

export const cashReconciliationRepo = {
  summary: async (f: ReportFilters) => {
    const result = await prisma.$queryRaw<Array<{
      opening_cash: number;
      cash_payments: number;
      cash_refunds: number;
      cash_pay_in: number;
      cash_pay_out: number;
      actual_closing_cash: number;
    }>>`
      SELECT
        COALESCE(SUM("openingCash"), 0)::float AS opening_cash,
        COALESCE(SUM("cashSales"), 0)::float AS cash_payments,
        COALESCE(SUM("cashRefunds"), 0)::float AS cash_refunds,
        COALESCE(SUM("payIns"), 0)::float AS cash_pay_in,
        COALESCE(SUM("payOuts"), 0)::float AS cash_pay_out,
        COALESCE(SUM("closingCash"), 0)::float AS actual_closing_cash
      FROM "Shift"
      WHERE ${reportBaseSql.baseWhere(f, '"Shift"', '"openedAt"')}
    `;
    return result;
  },
  
  shiftWiseReconciliation: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      shift_id: string;
      shift_number: string;
      cashier_id: string;
      cashier_name: string;
      opened_at: Date;
      closed_at: Date | null;
      opening_cash: number;
      cash_payments: number;
      cash_refunds: number;
      cash_pay_in: number;
      cash_pay_out: number;
      expected_cash: number;
      actual_closing_cash: number;
      cash_difference: number;
    }>>`
      SELECT
        s.id AS shift_id,
        s."shiftNumber" AS shift_number,
        s."openedById" AS cashier_id,
        u."name" AS cashier_name,
        s."openedAt" AS opened_at,
        s."closedAt" AS closed_at,
        COALESCE(s."openingCash", 0)::float AS opening_cash,
        COALESCE(s."cashSales", 0)::float AS cash_payments,
        COALESCE(s."cashRefunds", 0)::float AS cash_refunds,
        COALESCE(s."payIns", 0)::float AS cash_pay_in,
        COALESCE(s."payOuts", 0)::float AS cash_pay_out,
        COALESCE(s."expectedCash", 0)::float AS expected_cash,
        COALESCE(s."closingCash", 0)::float AS actual_closing_cash,
        COALESCE(s.variance, 0)::float AS cash_difference
      FROM "Shift" s
      LEFT JOIN "User" u ON s."openedById" = u.id
      WHERE ${reportBaseSql.baseWhere(f, 's', '"openedAt"')}
      ORDER BY s."openedAt" DESC
    `;
  }
};
