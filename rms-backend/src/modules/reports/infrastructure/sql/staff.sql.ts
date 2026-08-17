import { Prisma } from "../../../../prisma/client.js";
import { ReportFilters } from "../../domain/report.types.js";
import { reportBaseSql } from "./report-base.sql.js";

export const staffSql = {
  summary: (f: ReportFilters) => Prisma.sql`
    WITH StaffTotals AS (
      SELECT
        o."createdById",
        COUNT(o.id)::int AS orders,
        COALESCE(SUM(b."grandTotal"), 0)::float AS revenue,
        COUNT(CASE WHEN o.status IN ('CANCELLED', 'VOIDED') THEN 1 END)::int AS cancelled,
        COALESCE(SUM(o."guestCount"), 0)::int AS guests
      FROM "Order" o
      LEFT JOIN "Bill" b ON o.id = b."orderId" AND b."status" IN ('PAID', 'PARTIALLY_PAID')
      WHERE ${reportBaseSql.baseWhere(f, 'o', '"createdAt"')} ${reportBaseSql.excludeMerged('o')}
        ${reportBaseSql.channelFilter(f, 'o."channel"')}
      GROUP BY o."createdById"
    )
    SELECT
      COUNT(*)::int                            AS total_staff,
      COALESCE(SUM(orders), 0)::int            AS total_orders,
      COALESCE(SUM(revenue), 0)::float         AS total_revenue,
      COALESCE(AVG(orders), 0)::float          AS avg_orders_per_staff,
      COALESCE(AVG(revenue), 0)::float         AS avg_revenue_per_staff,
      COALESCE(MAX(revenue), 0)::float         AS highest_staff_revenue,
      COALESCE(MIN(revenue), 0)::float         AS lowest_staff_revenue,
      COALESCE(SUM(cancelled), 0)::int         AS total_cancelled,
      0::int                                   AS total_voided,
      CASE WHEN SUM(orders) > 0
        THEN (SUM(cancelled)::float / SUM(orders)::float * 100)
        ELSE 0 END::float                     AS overall_cancellation_rate,
      0::int                                   AS total_items_sold,
      COALESCE(SUM(guests), 0)::int            AS total_guests_served
    FROM StaffTotals
  `,

  byPeriod: (f: ReportFilters) => Prisma.sql`
    SELECT
      ${reportBaseSql.truncSql(f.resolution, 'o."createdAt"')} AS period,
      COUNT(o.id)::int                           AS orders,
      COALESCE(SUM(b."grandTotal"), 0)::float    AS revenue
    FROM "Order" o
    LEFT JOIN "Bill" b ON o.id = b."orderId" AND b."status" IN ('PAID', 'PARTIALLY_PAID')
    WHERE ${reportBaseSql.baseWhere(f, 'o', '"createdAt"')} ${reportBaseSql.excludeMerged('o')}
      ${reportBaseSql.channelFilter(f, 'o."channel"')}
    GROUP BY period ORDER BY period ASC
  `,

  byStaff: (f: ReportFilters) => Prisma.sql`
    WITH staff_orders AS (
      SELECT
        o.id AS order_id,
        o."createdById" AS staff_id,
        o.status,
        o.channel,
        o."guestCount",
        o."createdAt",
        o."completedAt",
        o."discountAmount",
        b."grandTotal" AS bill_total
      FROM "Order" o
      LEFT JOIN "Bill" b ON o.id = b."orderId" AND b."status" IN ('PAID', 'PARTIALLY_PAID')
      WHERE ${reportBaseSql.baseWhere(f, 'o', '"createdAt"')} ${reportBaseSql.excludeMerged('o')}
        ${reportBaseSql.channelFilter(f, 'o."channel"')}
    ),
    staff_items AS (
      SELECT
        o."createdById" AS staff_id,
        COALESCE(SUM(oi.quantity), 0)::int AS items_sold,
        COALESCE(AVG(
          (SELECT COUNT(*)::float FROM "OrderItem" oi2 WHERE oi2."orderId" = o.id AND oi2.status != 'CANCELLED' AND oi2.status != 'VOIDED')
        ), 0)::float AS avg_items
      FROM "OrderItem" oi
      JOIN "Order" o ON oi."orderId" = o.id
      WHERE ${reportBaseSql.baseWhere(f, 'o', '"createdAt"')} ${reportBaseSql.excludeMerged('o')}
        AND oi.status NOT IN ('CANCELLED', 'VOIDED')
        ${reportBaseSql.channelFilter(f, 'o."channel"')}
      GROUP BY o."createdById"
    )
    SELECT
      so.staff_id,
      u."name"                                                                    AS staff_name,
      u."role"::text                                                              AS staff_role,
      COUNT(so.order_id)::int                                                     AS total_orders,
      COUNT(CASE WHEN so.status IN ('CONFIRMED', 'COMPLETED') THEN 1 END)::int    AS completed_orders,
      COUNT(CASE WHEN so.status = 'CANCELLED' THEN 1 END)::int                    AS cancelled_orders,
      COUNT(CASE WHEN so.status = 'VOIDED' THEN 1 END)::int                       AS voided_orders,
      CASE WHEN COUNT(so.order_id) > 0
        THEN (COUNT(CASE WHEN so.status IN ('CANCELLED', 'VOIDED') THEN 1 END)::float / COUNT(so.order_id)::float * 100)
        ELSE 0 END::float                                                         AS cancellation_rate,
      COALESCE(SUM(so.bill_total), 0)::float                                      AS total_revenue,
      COALESCE(AVG(so.bill_total), 0)::float                                      AS avg_order_value,
      COALESCE(MAX(so.bill_total), 0)::float                                      AS max_order_value,
      COALESCE(MIN(CASE WHEN so.bill_total > 0 THEN so.bill_total END), 0)::float AS min_order_value,
      COALESCE(SUM(so."discountAmount"), 0)::float                                        AS total_discount_given,
      COALESCE(si.items_sold, 0)::int                                             AS total_items_sold,
      COALESCE(SUM(so."guestCount"), 0)::int                                      AS total_guests_served,
      COALESCE(si.avg_items, 0)::float                                            AS avg_items_per_order,
      CASE WHEN COUNT(CASE WHEN so."guestCount" IS NOT NULL THEN 1 END) > 0
        THEN (SUM(so."guestCount")::float / COUNT(CASE WHEN so."guestCount" IS NOT NULL THEN 1 END)::float)
        ELSE 0 END::float                                                         AS avg_guests_per_order,
      COALESCE(AVG(
        CASE WHEN so."completedAt" IS NOT NULL
          THEN EXTRACT(EPOCH FROM (so."completedAt" - so."createdAt")) / 60
        END
      ), 0)::float                                                                AS avg_fulfillment_minutes,
      COUNT(CASE WHEN so.channel = 'DINE_IN' THEN 1 END)::int                     AS dine_in_orders,
      COUNT(CASE WHEN so.channel = 'TAKEAWAY' THEN 1 END)::int                    AS takeaway_orders,
      COUNT(CASE WHEN so.channel = 'DELIVERY' THEN 1 END)::int                    AS delivery_orders
    FROM staff_orders so
    LEFT JOIN "User" u ON so.staff_id = u.id
    LEFT JOIN staff_items si ON so.staff_id = si.staff_id
    GROUP BY so.staff_id, u."name", u."role", si.items_sold, si.avg_items
    ORDER BY total_revenue DESC
  `,

  staffPayments: (f: ReportFilters) => Prisma.sql`
    WITH pay AS (
      SELECT
        p."receivedById" AS staff_id,
        COALESCE(SUM(p.amount), 0)::float AS total_collected,
        COUNT(p.id)::int AS payment_count,
        COALESCE(SUM(CASE WHEN p.method = 'CASH' THEN p.amount ELSE 0 END), 0)::float AS cash_collected,
        COALESCE(SUM(CASE WHEN p.method = 'QR' THEN p.amount ELSE 0 END), 0)::float AS qr_collected,
        COALESCE(SUM(CASE WHEN p.method = 'CARD' THEN p.amount ELSE 0 END), 0)::float AS card_collected
      FROM "Payment" p
      WHERE ${reportBaseSql.baseWhere(f, 'p', '"createdAt"')}
        AND p."status" = 'COMPLETED'
      GROUP BY p."receivedById"
    ),
    ref AS (
      SELECT
        r."processedById" AS staff_id,
        COUNT(r.id)::int AS refunds_processed,
        COALESCE(SUM(r.amount), 0)::float AS refund_amount
      FROM "Refund" r
      WHERE ${reportBaseSql.baseWhere(f, 'r', '"createdAt"')}
        AND r."status" = 'COMPLETED'
      GROUP BY r."processedById"
    )
    SELECT
      COALESCE(pay.staff_id, ref.staff_id) AS staff_id,
      u."name" AS staff_name,
      COALESCE(pay.total_collected, 0)::float AS total_collected,
      COALESCE(pay.payment_count, 0)::int AS payment_count,
      COALESCE(pay.cash_collected, 0)::float AS cash_collected,
      COALESCE(pay.qr_collected, 0)::float AS qr_collected,
      COALESCE(pay.card_collected, 0)::float AS card_collected,
      COALESCE(ref.refunds_processed, 0)::int AS refunds_processed,
      COALESCE(ref.refund_amount, 0)::float AS refund_amount,
      (COALESCE(pay.total_collected, 0) - COALESCE(ref.refund_amount, 0))::float AS net_collected
    FROM pay
    FULL OUTER JOIN ref ON pay.staff_id = ref.staff_id
    LEFT JOIN "User" u ON COALESCE(pay.staff_id, ref.staff_id) = u.id
    ORDER BY net_collected DESC
  `,

  staffTopItems: (f: ReportFilters) => Prisma.sql`
    WITH ranked AS (
      SELECT
        o."createdById" AS staff_id,
        oi."menuItemId" AS item_id,
        COALESCE(SUM(oi.quantity), 0)::int AS quantity,
        COALESCE(SUM(oi."lineSubtotal"), 0)::float AS sales,
        ROW_NUMBER() OVER (
          PARTITION BY o."createdById"
          ORDER BY SUM(oi.quantity) DESC
        )::int AS rank
      FROM "OrderItem" oi
      JOIN "Order" o ON oi."orderId" = o.id
      WHERE ${reportBaseSql.baseWhere(f, 'o', '"createdAt"')} ${reportBaseSql.excludeMerged('o')}
        AND o."status" IN ('CONFIRMED', 'COMPLETED')
        AND oi."status" NOT IN ('CANCELLED', 'VOIDED')
        ${reportBaseSql.channelFilter(f, 'o."channel"')}
      GROUP BY o."createdById", oi."menuItemId"
    )
    SELECT
      r.staff_id, u."name" AS staff_name,
      r.item_id, mi."name" AS item_name,
      r.quantity, r.sales, r.rank
    FROM ranked r
    LEFT JOIN "User" u ON r.staff_id = u.id
    LEFT JOIN "MenuItem" mi ON r.item_id = mi.id
    WHERE r.rank <= ${f.limit || 10}
    ORDER BY r.staff_id, r.rank ASC
  `,

  staffByPhase: (f: ReportFilters) => Prisma.sql`
    SELECT
      o."createdById"                         AS staff_id,
      u."name"                                AS staff_name,
      ${reportBaseSql.truncSql(f.resolution, 'o."createdAt"')} AS period,
      COUNT(o.id)::int                        AS orders,
      COALESCE(SUM(b."grandTotal"), 0)::float AS revenue
    FROM "Order" o
    LEFT JOIN "Bill" b ON o.id = b."orderId" AND b."status" IN ('PAID', 'PARTIALLY_PAID')
    LEFT JOIN "User" u ON o."createdById" = u.id
    WHERE ${reportBaseSql.baseWhere(f, 'o', '"createdAt"')} ${reportBaseSql.excludeMerged('o')}
      ${reportBaseSql.channelFilter(f, 'o."channel"')}
    GROUP BY o."createdById", u."name", period
    ORDER BY period ASC, revenue DESC
  `,

  staffAuditActivity: (f: ReportFilters) => Prisma.sql`
    SELECT
      a."actorId" AS staff_id,
      u."name" AS staff_name,
      COUNT(*)::int AS total_actions,
      COUNT(CASE WHEN a.action = 'ORDER_CANCELLED' THEN 1 END)::int   AS order_cancels,
      COUNT(CASE WHEN a.action = 'ORDER_VOIDED' THEN 1 END)::int      AS order_voids,
      COUNT(CASE WHEN a.action = 'DISCOUNT_APPLIED' THEN 1 END)::int  AS discounts_applied,
      COUNT(CASE WHEN a.action = 'PAYMENT_VOIDED' THEN 1 END)::int    AS payment_voids,
      COUNT(CASE WHEN a.action = 'REFUND_CREATED' THEN 1 END)::int    AS refunds_created
    FROM "AuditLog" a
    LEFT JOIN "User" u ON a."actorId" = u.id
    WHERE ${reportBaseSql.baseWhere(f, 'a', '"createdAt"')}
      AND a."actorId" IS NOT NULL
      AND a.action IN (
        'ORDER_CANCELLED', 'ORDER_VOIDED', 'DISCOUNT_APPLIED',
        'PAYMENT_VOIDED', 'REFUND_CREATED', 'REFUND_VOIDED',
        'ORDER_EDITED', 'PAYMENT_CREATED', 'PAYMENT_EDITED'
      )
    GROUP BY a."actorId", u."name"
    ORDER BY total_actions DESC
  `
};
