import { prisma } from "../../../../prisma/client.js";
import { ReportFilters } from "../../domain/report.types.js";
import { reportBaseSql } from "../sql/report-base.sql.js";

export const executiveDashboardRepo = {
  getKPIs: async (f: ReportFilters) => {
    // A single optimized query or multiple queries to gather high-level KPIs.
    // For simplicity, we can reuse summary functions from other repositories or write a unified query.
    return prisma.$queryRaw<Array<{
      total_revenue: number;
      total_orders: number;
      avg_order_value: number;
      gross_profit: number;
      margin_pct: number;
    }>>`
      WITH sales AS (
        SELECT
          COALESCE(SUM(b."grandTotal"), 0)::float AS total_revenue,
          COUNT(b.id)::int AS total_orders,
          COALESCE(AVG(b."grandTotal"), 0)::float AS avg_order_value
        FROM "Bill" b
        WHERE ${reportBaseSql.baseWhere(f, 'b', '"createdAt"')}
          AND b."status" IN ('PAID', 'PARTIALLY_PAID')
      ),
      profit AS (
        SELECT
          COALESCE(SUM(oi."lineSubtotal" - (oi."quantity" * COALESCE(oi."unitCost", 0))), 0)::float AS gross_profit,
          CASE WHEN SUM(oi."lineSubtotal") > 0
            THEN (SUM(oi."lineSubtotal" - (oi."quantity" * COALESCE(oi."unitCost", 0))) / SUM(oi."lineSubtotal") * 100)::float
            ELSE 0 END AS margin_pct
        FROM "OrderItem" oi
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE ${reportBaseSql.baseWhere(f, 'o', '"createdAt"')} ${reportBaseSql.excludeMerged('o')}
          AND o."status" IN ('CONFIRMED', 'COMPLETED')
          AND oi."status" NOT IN ('CANCELLED', 'VOIDED')
      )
      SELECT
        (SELECT total_revenue FROM sales) AS total_revenue,
        (SELECT total_orders FROM sales) AS total_orders,
        (SELECT avg_order_value FROM sales) AS avg_order_value,
        (SELECT gross_profit FROM profit) AS gross_profit,
        (SELECT margin_pct FROM profit) AS margin_pct
    `;
  },

  getTodayOrders: async (companyId: string) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return prisma.$queryRaw<Array<{
      all_orders: number;
      active_orders: number;
      cancelled_orders: number;
      voided_orders: number;
      completed_orders: number;
    }>>`
      SELECT
        COUNT(id)::int AS all_orders,
        COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END)::int AS active_orders,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END)::int AS cancelled_orders,
        COUNT(CASE WHEN status = 'VOIDED' THEN 1 END)::int AS voided_orders,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::int AS completed_orders
      FROM "Order"
      WHERE "companyId" = ${companyId}
        AND "createdAt" >= ${startOfToday}
        AND "mergedIntoOrderId" IS NULL
    `;
  }
};
