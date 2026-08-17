import { Prisma } from "../../../../prisma/client.js";
import { ReportFilters } from "../../domain/report.types.js";

export const reportBaseSql = {
  /** Include hourly breakdown only if resolution is 'hour' */
  includeHourly: (resolution?: "hour" | "day" | "week" | "month") => resolution === "hour",

  /** Time truncation SQL based on resolution */
  truncSql: (resolution: "hour" | "day" | "week" | "month" | undefined, column: string) => {
    switch (resolution) {
      case "hour": return Prisma.sql`date_trunc('hour', ${Prisma.raw(column)})`;
      case "week": return Prisma.sql`date_trunc('week', ${Prisma.raw(column)})`;
      case "month": return Prisma.sql`date_trunc('month', ${Prisma.raw(column)})`;
      case "day":
      default:
        return Prisma.sql`date_trunc('day', ${Prisma.raw(column)})`;
    }
  },

  /** Base where clause for tenant and date range */
  baseWhere: (f: ReportFilters, tableAlias: string, dateColumn: string = '"createdAt"') => {
    return Prisma.sql`${Prisma.raw(tableAlias)}."companyId" = ${f.companyId} AND ${Prisma.raw(tableAlias)}.${Prisma.raw(dateColumn)} >= ${f.from} AND ${Prisma.raw(tableAlias)}.${Prisma.raw(dateColumn)} < ${f.to}`;
  },

  /** Optional filter for staff */
  staffFilter: (f: ReportFilters, column: string) => {
    return f.staffId ? Prisma.sql`AND ${Prisma.raw(column)} = ${f.staffId}` : Prisma.empty;
  },

  /** Optional filter for channel */
  channelFilter: (f: ReportFilters, column: string) => {
    return f.channel ? Prisma.sql`AND ${Prisma.raw(column)} = ${f.channel}::"OrderChannel"` : Prisma.empty;
  },

  /** Optional filter for category */
  categoryFilter: (f: ReportFilters, column: string) => {
    return f.categoryId ? Prisma.sql`AND ${Prisma.raw(column)} = ${f.categoryId}` : Prisma.empty;
  },

  /** Optional filter for item */
  itemFilter: (f: ReportFilters, column: string) => {
    return f.menuItemId ? Prisma.sql`AND ${Prisma.raw(column)} = ${f.menuItemId}` : Prisma.empty;
  },
  
  /** Optional filter for payment method */
  paymentMethodFilter: (f: ReportFilters, column: string) => {
    return f.paymentMethod ? Prisma.sql`AND ${Prisma.raw(column)} = ${f.paymentMethod}::"PaymentMethod"` : Prisma.empty;
  },

  /**
   * Exclude orders that were absorbed into a merged order (table combine). The
   * retired source orders are kept as COMPLETED rows linked via
   * `mergedIntoOrderId`, so any report that counts Order/OrderItem rows directly
   * must drop them or it double-counts against the merged order.
   * `alias` is the SQL alias of the "Order" table (e.g. 'o' or '"Order"').
   */
  excludeMerged: (alias: string) =>
    Prisma.sql`AND ${Prisma.raw(alias)}."mergedIntoOrderId" IS NULL`
};
