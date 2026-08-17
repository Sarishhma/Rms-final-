import { describe, expect, it, vi, beforeAll, afterAll } from "vitest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/prisma/client.js";

const TEST_COMPANY_IDS = ["test-tenant", "other-tenant"];
const TEST_ORDER_IDS = ["order-1", "order-2", "order-other"];
const TEST_BILL_IDS = ["bill-1", "bill-other"];
const TEST_PAYMENT_IDS = ["pay-1"];
const TEST_REFUND_IDS = ["ref-1"];
const TEST_USER_IDS = ["user-test"];
const TEST_MENU_ITEM_IDS = ["item-1"];
const TEST_CATEGORY_IDS = ["cat-1"];

const cleanupReportsFixtures = async () => {
  await prisma.refund.deleteMany({ where: { id: { in: TEST_REFUND_IDS } } });
  await prisma.payment.deleteMany({ where: { id: { in: TEST_PAYMENT_IDS } } });
  await prisma.bill.deleteMany({ where: { id: { in: TEST_BILL_IDS } } });
  await prisma.kotItem.deleteMany({ where: { kotTicket: { orderId: { in: TEST_ORDER_IDS } } } });
  await prisma.kotTicket.deleteMany({ where: { orderId: { in: TEST_ORDER_IDS } } });
  await prisma.orderItem.deleteMany({ where: { orderId: { in: TEST_ORDER_IDS } } });
  await prisma.order.deleteMany({ where: { id: { in: TEST_ORDER_IDS } } });
  await prisma.menuItem.deleteMany({ where: { id: { in: TEST_MENU_ITEM_IDS } } });
  await prisma.category.deleteMany({ where: { id: { in: TEST_CATEGORY_IDS } } });
  await prisma.user.deleteMany({ where: { id: { in: TEST_USER_IDS } } });
  await prisma.company.deleteMany({ where: { id: { in: TEST_COMPANY_IDS } } });
};

vi.mock("../../src/middleware/auth.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/middleware/auth.js")>();
  return {
    ...actual,
    requireAuth: async (c: any, next: any) => {
      // Mock an authenticated user with a specific company ID
      c.set("authUser", { id: "user-test", companyId: "test-tenant", role: "ADMIN" });
      await next();
    }
  };
});

describe.skip("Reports API Integration", () => {
  beforeAll(async () => {
    await cleanupReportsFixtures();

    // Setup test tenant and some mock data to verify tenant isolation and date filtering
    await prisma.company.create({
      data: {
        id: "test-tenant",
        name: "Test Tenant",
        slug: "test-tenant"
      }
    });

    await prisma.company.create({
      data: {
        id: "other-tenant",
        name: "Other Tenant",
        slug: "other-tenant"
      }
    });

    await prisma.user.create({
      data: {
        id: "user-test",
        companyId: "test-tenant",
        email: "test@example.com",
        passwordHash: "hash"
      }
    });

    // Create catalog items first
    await prisma.category.create({
      data: {
        id: "cat-1",
        companyId: "test-tenant",
        name: "Test Cat"
      }
    });

    await prisma.menuItem.create({
      data: {
        id: "item-1",
        companyId: "test-tenant",
        name: "Test Item",
        categoryId: "cat-1",
        basePrice: 100
      }
    });

    // Valid order within tenant
    await prisma.order.create({
      data: {
        id: "order-1",
        companyId: "test-tenant",
        orderNumber: "1",
        createdById: "user-test",
        status: "COMPLETED",
        grandTotal: 100,
        createdAt: new Date("2026-06-05T10:00:00Z"),
        items: {
          create: [{
            id: "oi-1",
            menuItemId: "item-1",
            quantity: 1,
            unitPrice: 100,
            lineSubtotal: 100
          }]
        },
        bill: {
          create: {
            id: "bill-1",
            companyId: "test-tenant",
            billNumber: "1",
            subtotal: 100,
            grandTotal: 100,
            due: 0,
            status: "PAID",
            createdAt: new Date("2026-06-05T10:05:00Z")
          }
        }
      }
    });

    // Voided order (should be excluded from revenue)
    await prisma.order.create({
      data: {
        id: "order-2",
        companyId: "test-tenant",
        orderNumber: "2",
        createdById: "user-test",
        status: "VOIDED",
        grandTotal: 200,
        createdAt: new Date("2026-06-05T11:00:00Z")
      }
    });

    // Order from another tenant
    await prisma.order.create({
      data: {
        id: "order-other",
        companyId: "other-tenant",
        orderNumber: "3",
        createdById: "user-test",
        status: "COMPLETED",
        grandTotal: 500,
        createdAt: new Date("2026-06-05T10:00:00Z"),
        bill: {
          create: {
            id: "bill-other",
            companyId: "other-tenant",
            billNumber: "3",
            subtotal: 500,
            grandTotal: 500,
            due: 0,
            status: "PAID"
          }
        }
      }
    });

    // Valid payment
    await prisma.payment.create({
      data: {
        id: "pay-1",
        companyId: "test-tenant",
        billId: "bill-1",
        receivedById: "user-test",
        method: "CASH",
        amount: 100,
        status: "COMPLETED",
        createdAt: new Date("2026-06-05T10:05:00Z")
      }
    });

    // Refund
    await prisma.refund.create({
      data: {
        id: "ref-1",
        companyId: "test-tenant",
        paymentId: "pay-1",
        processedById: "user-test",
        method: "CASH",
        amount: 20,
        reason: "Test",
        status: "COMPLETED",
        createdAt: new Date("2026-06-05T10:10:00Z")
      }
    });
  });

  afterAll(async () => {
    await cleanupReportsFixtures();
  });

  it("verifies tenant isolation in sales report", async () => {
    const res = await app.request("/api/reports/sales?from=2026-06-01T00:00:00Z&to=2026-06-10T00:00:00Z", {
      method: "GET"
    });
    
    expect(res.status).toBe(200);
    const body = await res.json();
    
    // Should only see the 100 revenue from test-tenant, not the 500 from other-tenant
    // Also the voided 200 should be excluded
    expect(body.data.summary.net_bill_amount).toBe(100);
    expect(body.data.summary.total_orders).toBe(1);
  });

  it("verifies payment/refund calculation in payment report", async () => {
    const res = await app.request("/api/reports/payments?from=2026-06-01T00:00:00Z&to=2026-06-10T00:00:00Z", {
      method: "GET"
    });
    
    expect(res.status).toBe(200);
    const body = await res.json();
    
    // Received 100, Refunded 20 => Net 80
    expect(body.data.summary.total_received).toBe(100);
    expect(body.data.summary.total_refunded).toBe(20);
    expect(body.data.summary.net_revenue).toBe(80);
  });

  it("respects date range filtering", async () => {
    // Date range that excludes the created data (June 5th)
    const res = await app.request("/api/reports/sales?from=2026-07-01T00:00:00Z&to=2026-07-10T00:00:00Z", {
      method: "GET"
    });
    
    expect(res.status).toBe(200);
    const body = await res.json();
    
    expect(body.data.summary.net_bill_amount).toBe(0);
    expect(body.data.summary.total_orders).toBe(0);
  });
});
