import { PrismaClient, Prisma } from "@prisma/client";
import { hashPassword } from "../src/utils/password.js";
import {
  ROLES, TABLES, CATEGORIES, SUBCATEGORIES, MENU_ITEMS,
  CUSTOMERS, AUDIT_REASONS, CASH_DRAWER_REASONS,
} from "./seed-data.js";

const prisma = new PrismaClient();
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)]!;
const D = (v: number) => new Prisma.Decimal(v);

async function main() {
  console.log("🌱 Starting comprehensive seed…");

  // ── Truncate ──
  const rows = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'`;
  const names = rows.map(r => r.tablename).filter(n => n !== "_prisma_migrations")
    .map(n => `"public"."${n}"`).join(", ");
  if (names.length) await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${names} CASCADE;`);

  // ── 1. Master user ──
  const pw = await hashPassword("ChangeMe123!");
  await prisma.user.create({
    data: { email: "master@demo.com", passwordHash: pw, name: "Platform Master", role: "MASTER", companyId: null },
  });

  // ── 2. Company ──
  const company = await prisma.company.create({
    data: { name: "Demo Restaurant", slug: "demo-company" },
  });
  const cid = company.id;

  // Default kitchen station — routing fallback for non-routed items.
  await prisma.kitchenStation.create({
    data: { companyId: cid, name: "Main Kitchen", isDefault: true, sortOrder: 0 },
  });

  // ── 3. Users (multiple per role for staff-report diversity) ──
  const users: Record<string, any> = {};
  const allWaiters: any[] = [];
  const allCashiers: any[] = [];
  for (const r of ROLES) {
    const u = await prisma.user.create({
      data: {
        email: r.email, passwordHash: pw, name: r.name,
        role: r.role as any, companyId: cid, phoneNumber: r.phone,
      },
    });
    if (!users[r.role]) users[r.role] = u;
    if (r.role === "WAITER") allWaiters.push(u);
    if (r.role === "CASHIER") allCashiers.push(u);
  }

  // ── 4. Tax Config ──
  await prisma.taxConfig.create({
    data: {
      companyId: cid, taxJurisdiction: "NP", taxRegistrationNumber: "VAT-9876543",
      businessName: "Demo Restaurant Pvt Ltd", businessAddress: "Thamel, Kathmandu",
      invoiceFooter: "Thank you for dining with us!", currency: "NPR",
    },
  });

  // ── 5. Tables (multiple floors + null floor edge case) ──
  const tables: any[] = [];
  for (const t of TABLES) {
    const tbl = await prisma.diningTable.create({
      data: { companyId: cid, name: t.name, capacity: t.capacity, floor: t.floor },
    });
    tables.push(tbl);
  }
  // Set some tables to non-AVAILABLE statuses for status-filter testing
  await prisma.diningTable.update({ where: { id: tables[tables.length - 1].id }, data: { status: "MAINTENANCE" } });
  await prisma.diningTable.update({ where: { id: tables[tables.length - 3].id }, data: { status: "RESERVED" } });
  console.log(`✅ ${tables.length} tables across ${new Set(TABLES.map(t => t.floor || "null")).size} floors`);

  // ── 6. Categories & Subcategories ──
  const catMap: Record<string, any> = {};
  for (const c of CATEGORIES) {
    catMap[c.name] = await prisma.category.create({
      data: { companyId: cid, name: c.name, sortOrder: c.sortOrder },
    });
  }
  const subMap: Record<string, any> = {};
  for (const s of SUBCATEGORIES) {
    const key = `${s.catName}::${s.name}`;
    subMap[key] = await prisma.subcategory.create({
      data: { companyId: cid, categoryId: catMap[s.catName].id, name: s.name, sortOrder: s.sortOrder },
    });
  }
  // Make one category unavailable for availability-filter
  await prisma.category.update({ where: { id: catMap["Specials"].id }, data: { isAvailable: false } });

  // ── 7. Menu Items with Variants & Addons ──
  const menuItems: any[] = [];
  const menuVariants: any[] = [];
  const menuAddons: any[] = [];
  for (const m of MENU_ITEMS) {
    const catId = catMap[m.cat].id;
    const subKey = m.sub ? `${m.cat}::${m.sub}` : null;
    const subId = subKey && subMap[subKey] ? subMap[subKey].id : null;

    const item = await prisma.menuItem.create({
      data: {
        companyId: cid, name: m.name, type: m.type as any,
        categoryId: catId, subcategoryId: subId,
        basePrice: m.price, baseCost: m.cost, sku: m.sku,
        trackStock: m.trackStock ?? true,
      },
    });
    menuItems.push(item);

    if (m.variants) {
      for (const v of m.variants) {
        const mv = await prisma.menuVariant.create({
          data: {
            companyId: cid, menuItemId: item.id,
            name: v.name, price: v.price, cost: v.cost, sku: v.sku,
          },
        });
        menuVariants.push({ ...mv, menuItemId: item.id });
      }
    }
    if (m.addons) {
      for (const a of m.addons) {
        const ma = await prisma.menuAddon.create({
          data: { companyId: cid, menuItemId: item.id, name: a.name, price: a.price },
        });
        menuAddons.push({ ...ma, menuItemId: item.id });
      }
    }
  }
  // Make 2 items unavailable for filter testing
  await prisma.menuItem.update({ where: { id: menuItems[menuItems.length - 1].id }, data: { isAvailable: false } });
  await prisma.menuItem.update({ where: { id: menuItems[menuItems.length - 2].id }, data: { isAvailable: false } });
  console.log(`✅ ${menuItems.length} menu items, ${menuVariants.length} variants, ${menuAddons.length} addons`);

  // ── 8. Customers ──
  const customers: any[] = [];
  for (const c of CUSTOMERS) {
    const cust = await prisma.customer.create({
      data: { companyId: cid, name: c.name, phone: c.phone, email: c.email, notes: c.notes },
    });
    customers.push(cust);
  }
  // Soft-delete last customer for includeDeleted filter
  await prisma.customer.update({ where: { id: customers[customers.length - 1].id }, data: { isDeleted: true, isActive: false } });

  // ── 9. Generate 30 days of rich transactional data ──
  let orderSeq = 1, kotSeq = 1, billSeq = 1, shiftSeq = 1;
  const now = new Date();
  const DAYS = 30;
  const channels: ("DINE_IN" | "TAKEAWAY" | "DELIVERY")[] = ["DINE_IN", "TAKEAWAY", "DELIVERY"];
  const payMethods: ("CASH" | "CARD" | "QR")[] = ["CASH", "CARD", "QR"];
  let totalOrders = 0, totalRefunds = 0, totalAudits = 0;

  console.log(`⏳ Generating ${DAYS} days of data…`);

  for (let d = DAYS; d >= 0; d--) {
    const dayStart = new Date(now); dayStart.setDate(dayStart.getDate() - d); dayStart.setHours(9, 0, 0, 0);
    const dayEnd = new Date(dayStart); dayEnd.setHours(22, 0, 0, 0);

    // ── Shift (2 per day for shift-report coverage) ──
    const shifts: any[] = [];
    for (let s = 0; s < 2; s++) {
      const sStart = new Date(dayStart); sStart.setHours(s === 0 ? 9 : 15, 0, 0, 0);
      const sEnd = new Date(dayStart); sEnd.setHours(s === 0 ? 15 : 22, 0, 0, 0);
      const cashier = pick(allCashiers);
      const shift = await prisma.shift.create({
        data: {
          companyId: cid, shiftNumber: `SHF-${shiftSeq++}`,
          openedById: cashier.id, closedById: cashier.id,
          status: "CLOSED", openingCash: s === 0 ? 5000 : 3000,
          openedAt: sStart, closedAt: sEnd,
          openingNote: s === 0 ? "Morning shift" : "Evening shift",
          closingNote: "End of shift",
        },
      });
      shifts.push({ shift, cashier, start: sStart, end: sEnd, cash: 0, card: 0, qr: 0, mixed: 0 });
    }

    // Cash drawer events for each shift
    for (const s of shifts) {
      const cdType = pick(CASH_DRAWER_REASONS);
      await prisma.cashDrawerEvent.create({
        data: {
          companyId: cid, shiftId: s.shift.id, actorId: s.cashier.id,
          type: cdType.type, amount: rand(200, 2000), reason: pick(cdType.reasons),
          createdAt: new Date(s.start.getTime() + rand(60, 180) * 60000),
        },
      });
    }

    // ── Orders for the day ──
    const numOrders = rand(12, 25); // More orders per day for richer reports
    for (let o = 0; o < numOrders; o++) {
      const orderTime = new Date(dayStart.getTime() + rand(0, 13 * 3600000));
      const activeShift = orderTime.getHours() < 15 ? shifts[0] : shifts[1];

      // Channel distribution: 60% dine-in, 25% takeaway, 15% delivery
      const rChan = Math.random();
      const channel = rChan < 0.6 ? "DINE_IN" : rChan < 0.85 ? "TAKEAWAY" : "DELIVERY";
      const table = channel === "DINE_IN" ? pick(tables.slice(0, -2)) : null; // avoid maintenance/reserved
      const waiter = pick(allWaiters);
      const customer = Math.random() < 0.3 ? pick(customers.slice(0, -1)) : null;

      // Status distribution: 80% completed, 8% cancelled, 7% voided, 5% confirmed (in-progress)
      const rStat = Math.random();
      const status = rStat < 0.80 ? "COMPLETED" : rStat < 0.88 ? "CANCELLED" : rStat < 0.95 ? "VOIDED" : "CONFIRMED";

      // Build items (1-5 per order)
      const numItems = rand(1, 5);
      const orderItems: any[] = [];
      let subtotal = 0;

      for (let i = 0; i < numItems; i++) {
        const mi = pick(menuItems);
        // 30% chance of using a variant if item has variants
        const itemVariants = menuVariants.filter(v => v.menuItemId === mi.id);
        const variant = itemVariants.length && Math.random() < 0.3 ? pick(itemVariants) : null;
        const unitPrice = variant ? Number(variant.price) : Number(mi.basePrice);
        const unitCost = variant ? Number(variant.cost) : Number(mi.baseCost);
        const qty = rand(1, 3);

        // 20% chance of addons
        const itemAddons = menuAddons.filter(a => a.menuItemId === mi.id);
        let addonTotal = 0;
        const selectedAddons: any[] = [];
        if (itemAddons.length && Math.random() < 0.2) {
          const addon = pick(itemAddons);
          addonTotal = Number(addon.price) * qty;
          selectedAddons.push({ addonId: addon.id, quantity: 1, unitPrice: addon.price, total: D(addonTotal) });
        }

        const lineSubtotal = (unitPrice * qty) + addonTotal;
        const itemStatus = status === "VOIDED" && i === 0 ? "VOIDED" : "PENDING";
        if (itemStatus !== "VOIDED" && status !== "CANCELLED") subtotal += lineSubtotal;

        orderItems.push({
          menuItemId: mi.id, variantId: variant?.id || null,
          quantity: qty, unitPrice: D(unitPrice), unitCost: D(unitCost),
          addonTotal: D(addonTotal), lineSubtotal: D(lineSubtotal),
          status: itemStatus, addons: selectedAddons,
          createdAt: orderTime, updatedAt: orderTime,
        });
      }

      // Discount on ~15% of orders
      const hasDiscount = Math.random() < 0.15 && subtotal > 0;
      const discountPct = hasDiscount ? pick([5, 10, 15, 20]) : 0;
      const discount = Math.round(subtotal * discountPct / 100);
      const grandTotal = subtotal - discount;

      const order = await prisma.order.create({
        data: {
          companyId: cid, orderNumber: `ORD-${orderSeq++}`,
          channel, tableId: table?.id, createdById: waiter.id,
          customerId: customer?.id, customerName: customer?.name,
          guestCount: channel === "DINE_IN" ? rand(1, 6) : null,
          status: status as any, subtotal: D(subtotal), discountAmount: D(discount), discountPercentage: D(0), grandTotal: D(grandTotal),
          confirmedAt: new Date(orderTime.getTime() + 60000),
          completedAt: status === "COMPLETED" ? new Date(orderTime.getTime() + rand(20, 60) * 60000) : null,
          cancelledAt: status === "CANCELLED" ? new Date(orderTime.getTime() + rand(5, 15) * 60000) : null,
          voidedAt: status === "VOIDED" ? new Date(orderTime.getTime() + rand(5, 15) * 60000) : null,
          createdAt: orderTime, updatedAt: orderTime,
          items: {
            create: orderItems.map(it => ({
              menuItemId: it.menuItemId, variantId: it.variantId,
              quantity: it.quantity, unitPrice: it.unitPrice, unitCost: it.unitCost,
              addonTotal: it.addonTotal, lineSubtotal: it.lineSubtotal,
              status: it.status, createdAt: it.createdAt, updatedAt: it.updatedAt,
              addons: it.addons.length ? { create: it.addons } : undefined,
            })),
          },
        },
        include: { items: true },
      });
      totalOrders++;

      // Audit logs for cancels/voids/discounts
      if (status === "CANCELLED") {
        await prisma.auditLog.create({
          data: {
            companyId: cid, action: "ORDER_CANCELLED", entity: "ORDER", entityId: order.id,
            actorId: users.ADMIN.id, reason: pick(AUDIT_REASONS),
            createdAt: new Date(orderTime.getTime() + 120000),
          },
        });
        totalAudits++;
      }
      if (status === "VOIDED") {
        await prisma.auditLog.create({
          data: {
            companyId: cid, action: "ORDER_VOIDED", entity: "ORDER", entityId: order.id,
            actorId: users.ADMIN.id, reason: pick(AUDIT_REASONS),
            createdAt: new Date(orderTime.getTime() + 120000),
          },
        });
        totalAudits++;
      }
      if (hasDiscount) {
        await prisma.auditLog.create({
          data: {
            companyId: cid, action: "DISCOUNT_APPLIED", entity: "ORDER", entityId: order.id,
            actorId: users.ADMIN.id, reason: `${discountPct}% discount applied`,
            after: { discountPct, discount },
            createdAt: new Date(orderTime.getTime() + 60000),
          },
        });
        totalAudits++;
      }

      // Skip billing for cancelled/voided/zero-total
      if (status === "CANCELLED" || status === "VOIDED" || grandTotal <= 0) continue;

      // KOT
      const kotTime = new Date(orderTime.getTime() + 60000);
      const pendingItems = (order as any).items.filter((i: any) => i.status !== "VOIDED");
      if (pendingItems.length > 0) {
        await prisma.kotTicket.create({
          data: {
            companyId: cid, kotNumber: `KOT-${kotSeq++}`, orderId: order.id,
            status: status === "COMPLETED" ? "SERVED" : "PENDING",
            createdAt: kotTime, updatedAt: new Date(kotTime.getTime() + rand(10, 30) * 60000),
            items: {
              create: pendingItems.map((it: any) => ({
                orderItemId: it.id, quantity: it.quantity,
                status: status === "COMPLETED" ? "SERVED" : "PENDING",
                createdAt: kotTime, updatedAt: new Date(kotTime.getTime() + rand(10, 30) * 60000),
              })),
            },
          },
        });
      }

      if (status !== "COMPLETED") continue;

      // Bill
      const billTime = new Date(orderTime.getTime() + rand(25, 50) * 60000);
      const bill = await prisma.bill.create({
        data: {
          companyId: cid, billNumber: `BIL-${billSeq++}`, orderId: order.id,
          subtotal: D(subtotal), discountAmount: D(discount), discountPercentage: D(0), grandTotal: D(grandTotal),
          paid: D(grandTotal), due: D(0), status: "PAID",
          taxJurisdiction: "NP", taxRegistrationNumber: "VAT-9876543",
          businessName: "Demo Restaurant Pvt Ltd", businessAddress: "Thamel, Kathmandu",
          invoiceFooter: "Thank you!", currency: "NPR",
          createdAt: billTime, updatedAt: billTime,
        },
      });

      // Payment (with MIXED method support)
      const payTime = new Date(billTime.getTime() + rand(1, 5) * 60000);
      const useMixed = Math.random() < 0.1 && grandTotal > 200;
      if (useMixed) {
        const cashPart = Math.round(grandTotal * 0.6);
        const cardPart = grandTotal - cashPart;
        const p = await prisma.payment.create({
          data: {
            companyId: cid, billId: bill.id, receivedById: activeShift.cashier.id,
            shiftId: activeShift.shift.id, method: "MIXED", status: "COMPLETED",
            amount: D(grandTotal), note: `Cash: ${cashPart}, Card: ${cardPart}`,
            createdAt: payTime, updatedAt: payTime,
          },
        });
        activeShift.mixed += grandTotal;
        activeShift.cash += cashPart;
        activeShift.card += cardPart;
      } else {
        const method = pick(payMethods);
        const p = await prisma.payment.create({
          data: {
            companyId: cid, billId: bill.id, receivedById: activeShift.cashier.id,
            shiftId: activeShift.shift.id, method, status: "COMPLETED",
            amount: D(grandTotal), createdAt: payTime, updatedAt: payTime,
          },
        });
        activeShift[method.toLowerCase() as "cash" | "card" | "qr"] += grandTotal;

        // 8% refund chance
        if (Math.random() < 0.08) {
          const refAmt = Math.random() < 0.5 ? grandTotal : Math.round(grandTotal * 0.5);
          await prisma.refund.create({
            data: {
              companyId: cid, paymentId: p.id, processedById: users.ADMIN.id,
              shiftId: activeShift.shift.id, method, amount: D(refAmt),
              reason: pick(AUDIT_REASONS), status: "COMPLETED",
              createdAt: new Date(payTime.getTime() + 300000),
            },
          });
          await prisma.auditLog.create({
            data: {
              companyId: cid, action: "REFUND_CREATED", entity: "PAYMENT", entityId: p.id,
              actorId: users.ADMIN.id, reason: "Customer complaint refund",
              createdAt: new Date(payTime.getTime() + 300000),
            },
          });
          totalRefunds++; totalAudits++;
        }
      }
    }

    // ── Shift close totals ──
    for (const s of shifts) {
      const total = s.cash + s.card + s.qr + s.mixed;
      await prisma.shift.update({
        where: { id: s.shift.id },
        data: {
          cashSales: D(s.cash), cardSales: D(s.card), qrSales: D(s.qr), mixedSales: D(s.mixed),
          totalSales: D(total), closingCash: D(Number(s.shift.openingCash) + s.cash),
          expectedCash: D(Number(s.shift.openingCash) + s.cash),
          variance: D(rand(-50, 50)), // realistic small variance
          cashRefunds: D(0), qrRefunds: D(0), cardRefunds: D(0), mixedRefunds: D(0), totalRefunds: D(0),
          payIns: D(rand(500, 2000)), payOuts: D(rand(200, 1500)),
          paymentsCount: rand(5, 15), refundsCount: rand(0, 2), billsCount: rand(5, 15),
        },
      });
    }

    // ── Daily Stock ──
    for (const item of menuItems.filter(m => m.trackStock)) {
      const remaining = rand(0, 50);
      await prisma.dailyStock.create({
        data: {
          companyId: cid, businessDate: dayStart, menuItemId: item.id,
          openingQty: 50, remainingQty: remaining, lowStockAt: 10,
          status: remaining === 0 ? "OUT_OF_STOCK" : remaining <= 10 ? "LOW_STOCK" : "IN_STOCK",
        },
      });
    }

    // ── Inventory Transactions (2-3 per day) ──
    const txTypes = ["PURCHASE", "WASTAGE", "MANUAL_ADJUSTMENT"];
    for (let t = 0; t < rand(2, 3); t++) {
      const txItem = pick(menuItems.filter(m => m.trackStock));
      const txType = pick(txTypes);
      await prisma.inventoryTransaction.create({
        data: {
          companyId: cid, menuItemId: txItem.id,
          type: txType, quantity: txType === "WASTAGE" ? -rand(1, 5) : rand(5, 30),
          unitCost: txItem.baseCost, notes: `${txType} - day ${DAYS - d + 1}`,
          createdById: users.ADMIN.id,
          createdAt: new Date(dayStart.getTime() + rand(1, 12) * 3600000),
        },
      });
    }
  }

  // ── 10. Extra audit logs for audit-report diversity ──
  const auditActions = [
    "TABLE_SWAPPED", "TABLE_COMBINED", "TABLE_RELEASED",
    "STOCK_ADJUSTED", "MENU_AVAILABILITY_CHANGED",
    "SHIFT_OPENED", "SHIFT_CLOSED", "PAYMENT_VOIDED",
  ] as const;
  for (let a = 0; a < 20; a++) {
    const action = pick([...auditActions]);
    await prisma.auditLog.create({
      data: {
        companyId: cid, action: action as any,
        entity: action.startsWith("TABLE") ? "TABLE" : action.startsWith("SHIFT") ? "SHIFT" : "MENU_ITEM",
        entityId: pick(tables).id, actorId: pick([users.ADMIN, ...allWaiters, ...allCashiers]).id,
        reason: pick(AUDIT_REASONS),
        createdAt: new Date(now.getTime() - rand(0, 30 * 86400000)),
      },
    });
    totalAudits++;
  }

  // ── 11. Sequences ──
  for (const [kind, val] of [["ORDER", orderSeq], ["KOT", kotSeq], ["BILL", billSeq], ["SHIFT", shiftSeq]] as const) {
    await prisma.numberSequence.create({
      data: { companyId: cid, kind: kind as any, lastValue: val },
    });
  }

  // ── Summary ──
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("✅ Seed completed successfully!");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`📊 Data Summary:`);
  console.log(`   Tables:     ${tables.length} (across ${new Set(TABLES.map(t => t.floor)).size} floors)`);
  console.log(`   Menu Items: ${menuItems.length} (${menuVariants.length} variants, ${menuAddons.length} addons)`);
  console.log(`   Categories: ${CATEGORIES.length} (${SUBCATEGORIES.length} subcategories)`);
  console.log(`   Customers:  ${customers.length}`);
  console.log(`   Orders:     ${totalOrders} (30 days)`);
  console.log(`   Refunds:    ${totalRefunds}`);
  console.log(`   Audit Logs: ${totalAudits}`);
  console.log(`   Shifts:     ${shiftSeq - 1} (2/day × 31 days)`);
  console.log("\n🔐 Login Credentials (password: ChangeMe123!):");
  console.log("   master@demo.com          [MASTER]");
  for (const r of ROLES) console.log(`   ${r.email.padEnd(28)} [${r.role}]`);
  console.log("\n🏢 Floors: Ground Floor, First Floor, Rooftop, Private Dining, Outdoor, (null)");
  console.log("═══════════════════════════════════════════════════════\n");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
