/**
 * seed-multi-company.ts
 * Seeds 4 companies with operational data to verify reset-company-data.sql
 *
 * Password for ALL users: ChangeMe123!
 * Email pattern: admin1@demo.com, waiter1@demo.com, cashier1@demo.com, kitchen1@demo.com
 *                admin2@demo.com, waiter2@demo.com, ...
 *
 * Run: npx tsx prisma/seed-multi-company.ts
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { hashPassword } from "../src/utils/password.js";

const prisma = new PrismaClient();
const D = (v: number) => new Prisma.Decimal(v);
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)]!;

const COMPANIES = [
  { name: "Everest Kitchen",       slug: "everest-kitchen" },
  { name: "Himalayan Bites",       slug: "himalayan-bites" },
  { name: "Thamel Dine",           slug: "thamel-dine" },
  { name: "Kathmandu Street Food", slug: "kathmandu-street-food" },
];

async function main() {
  console.log("🌱 Seeding 4 companies for reset-company-data.sql verification…\n");

  // Truncate all tables first (idempotent re-runs)
  const rows = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'`;
  const names = rows.map(r => r.tablename).filter(n => n !== "_prisma_migrations")
    .map(n => `"public"."${n}"`).join(", ");
  if (names.length) await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${names} CASCADE;`);

  const pw = await hashPassword("ChangeMe123!");

  // Master user
  await prisma.user.upsert({
    where: { email: "master@demo.com" },
    update: {},
    create: { email: "master@demo.com", passwordHash: pw, name: "Platform Master", role: "MASTER", companyId: null },
  });

  for (let ci = 0; ci < COMPANIES.length; ci++) {
    const num = ci + 1;
    const c = COMPANIES[ci]!;
    console.log(`\n━━━ [${num}] ${c.name} ━━━`);

    const company = await prisma.company.create({ data: { name: c.name, slug: c.slug } });
    const cid = company.id;

    // ── Kitchen Station ──
    const station = await prisma.kitchenStation.create({
      data: { companyId: cid, name: "Main Kitchen", sortOrder: 0 },
    });

    // ── Users (same password, numbered emails) ──
    const roles = [
      { role: "ADMIN"   as const, email: `admin${num}@demo.com`,    name: `Admin ${num}`,   phone: `984${num}000001` },
      { role: "CASHIER" as const, email: `cashier${num}@demo.com`,  name: `Cashier ${num}`, phone: `984${num}000002` },
      { role: "WAITER"  as const, email: `waiter${num}@demo.com`,   name: `Waiter ${num}`,  phone: `984${num}000003` },
      { role: "KITCHEN" as const, email: `kitchen${num}@demo.com`,  name: `Kitchen ${num}`, phone: `984${num}000004` },
      { role: "CASHIER_WAITER" as const, email: `cw${num}@demo.com`, name: `CW ${num}`,     phone: `984${num}000005` },
    ];
    const users: Record<string, any> = {};
    for (const r of roles) {
      users[r.role] = await prisma.user.create({
        data: { email: r.email, passwordHash: pw, name: r.name, role: r.role, companyId: cid, phoneNumber: r.phone },
      });
    }

    // ── Tax Config ──
    await prisma.taxConfig.create({
      data: {
        companyId: cid, taxJurisdiction: "NP", taxRegistrationNumber: `VAT-${1000 + num}`,
        businessName: c.name, businessAddress: `Location ${num}, Kathmandu`,
        invoiceFooter: "Thank you!", currency: "NPR",
      },
    });

    // ── Tables (4 per company) ──
    const tables = [];
    for (let t = 1; t <= 4; t++) {
      tables.push(await prisma.diningTable.create({
        data: { companyId: cid, name: `T${t}`, capacity: t * 2, floor: t <= 2 ? "Ground" : "First" },
      }));
    }

    // ── Categories & Subcategories ──
    const catFood = await prisma.category.create({ data: { companyId: cid, name: "Food", sortOrder: 1 } });
    const catBev  = await prisma.category.create({ data: { companyId: cid, name: "Beverages", sortOrder: 2 } });
    const subNep  = await prisma.subcategory.create({ data: { companyId: cid, categoryId: catFood.id, name: "Nepali", sortOrder: 1 } });
    const subChi  = await prisma.subcategory.create({ data: { companyId: cid, categoryId: catFood.id, name: "Chinese", sortOrder: 2 } });

    // ── Menu Items (6 per company) ──
    const items = [];
    const itemDefs = [
      { name: "Chicken Momo", cat: catFood.id, sub: subNep.id, price: 250, cost: 120, type: "FOOD" as const, sku: `MOMO-${num}` },
      { name: "Chowmein",     cat: catFood.id, sub: subChi.id, price: 200, cost: 80,  type: "FOOD" as const, sku: `CHOW-${num}` },
      { name: "Dal Bhat",     cat: catFood.id, sub: subNep.id, price: 350, cost: 130, type: "FOOD" as const, sku: `DAL-${num}` },
      { name: "Fried Rice",   cat: catFood.id, sub: subChi.id, price: 280, cost: 100, type: "FOOD" as const, sku: `FRICE-${num}` },
      { name: "Milk Tea",     cat: catBev.id,  sub: null,      price: 50,  cost: 20,  type: "BEVERAGE" as const, sku: `TEA-${num}` },
      { name: "Coke",         cat: catBev.id,  sub: null,      price: 100, cost: 40,  type: "BEVERAGE" as const, sku: `COKE-${num}` },
    ];
    for (const m of itemDefs) {
      items.push(await prisma.menuItem.create({
        data: { companyId: cid, name: m.name, categoryId: m.cat, subcategoryId: m.sub, basePrice: m.price, baseCost: m.cost, type: m.type, sku: m.sku },
      }));
    }

    // Variant on first item
    const variant = await prisma.menuVariant.create({
      data: { companyId: cid, menuItemId: items[0]!.id, name: "Fried", price: 280, cost: 140, sku: `MOMO-F-${num}` },
    });

    // Addon on first item
    const addon = await prisma.menuAddon.create({
      data: { companyId: cid, menuItemId: items[0]!.id, name: "Extra Sauce", price: 30 },
    });

    // ── Customers (3 per company) ──
    const customers = [];
    for (let k = 1; k <= 3; k++) {
      customers.push(await prisma.customer.create({
        data: { companyId: cid, name: `Customer ${num}-${k}`, phone: `98${num}${k}00000` },
      }));
    }

    // ── Inventory Units & Items ──
    const unit = await prisma.inventoryUnit.create({
      data: { companyId: cid, name: "Kilogram", symbol: "kg", type: "WEIGHT", isBaseUnit: true, createdById: users.ADMIN.id },
    });
    const invItem = await prisma.inventoryItem.create({
      data: { companyId: cid, name: "Chicken", code: `CHK-${num}`, type: "RAW_MATERIAL", baseUnitId: unit.id, createdById: users.ADMIN.id },
    });
    const invSupplier = await prisma.inventorySupplier.create({
      data: { companyId: cid, name: `Supplier ${num}`, phone: `98${num}0000000`, createdById: users.ADMIN.id },
    });
    const unit2 = await prisma.inventoryUnit.create({
      data: { companyId: cid, name: "Gram", symbol: "g", type: "WEIGHT", isBaseUnit: false, createdById: users.ADMIN.id },
    });
    await prisma.inventoryUnitConversion.create({
      data: { companyId: cid, fromUnitId: unit.id, toUnitId: unit2.id, factor: 1000 },
    });
    await prisma.inventorySetting.create({ data: { companyId: cid } });

    // ── Generate 5 days of orders/KOT/bills/payments/shifts ──
    let orderSeq = 1, kotSeq = 1, billSeq = 1, shiftSeq = 1;
    const now = new Date();

    for (let d = 4; d >= 0; d--) {
      const dayStart = new Date(now); dayStart.setDate(dayStart.getDate() - d); dayStart.setHours(9, 0, 0, 0);

      // Shift
      const shiftEnd = new Date(dayStart); shiftEnd.setHours(22, 0, 0, 0);
      const shift = await prisma.shift.create({
        data: {
          companyId: cid, shiftNumber: `SHF-${shiftSeq++}`,
          openedById: users.CASHIER.id, closedById: users.CASHIER.id,
          status: "CLOSED", openingCash: 5000, closingCash: 8000, expectedCash: 8000, variance: 0,
          cashSales: D(3000), totalSales: D(3000), openedAt: dayStart, closedAt: shiftEnd,
        },
      });

      // Cash drawer event
      await prisma.cashDrawerEvent.create({
        data: { companyId: cid, shiftId: shift.id, actorId: users.CASHIER.id, type: "PAY_IN", amount: 500, reason: "Change" },
      });

      // 4 orders per day
      for (let o = 0; o < 4; o++) {
        const oTime = new Date(dayStart.getTime() + (o + 1) * 3600000);
        const mi = items[o % items.length]!;
        const price = Number(mi.basePrice);
        const qty = rand(1, 3);
        const subtotal = price * qty;
        const isCompleted = o < 3; // last order = CONFIRMED (still open)
        const isCancelled = o === 3 && d === 0; // edge case

        const status = isCancelled ? "CANCELLED" : isCompleted ? "COMPLETED" : "CONFIRMED";

        const order = await prisma.order.create({
          data: {
            companyId: cid, orderNumber: `ORD-${orderSeq++}`,
            channel: o === 0 ? "DINE_IN" : o === 1 ? "TAKEAWAY" : "DINE_IN",
            tableId: o % 2 === 0 ? tables[o % tables.length]!.id : null,
            createdById: users.WAITER.id, customerId: o === 0 ? customers[0]!.id : null,
            status: status as any, subtotal: D(subtotal), discountAmount: D(0), discountPercentage: D(0), grandTotal: D(subtotal),
            confirmedAt: oTime,
            completedAt: isCompleted ? new Date(oTime.getTime() + 1800000) : null,
            cancelledAt: isCancelled ? new Date(oTime.getTime() + 600000) : null,
            createdAt: oTime, updatedAt: oTime,
            items: {
              create: [{
                menuItemId: mi.id, quantity: qty, unitPrice: D(price),
                unitCost: mi.baseCost, addonTotal: o === 0 ? D(30) : D(0), lineSubtotal: o === 0 ? D(subtotal + 30) : D(subtotal),
                status: "PENDING", createdAt: oTime, updatedAt: oTime,
                addons: o === 0 ? { create: [{ addonId: addon.id, quantity: 1, unitPrice: D(30), total: D(30) }] } : undefined,
              }],
            },
          },
          include: { items: true },
        });

        if (o === 0 && d === 4) { // One table group & split per company
           await prisma.tableGroup.create({
             data: { companyId: cid, orderId: order.id, combinedById: users.WAITER.id, members: { create: [{ tableId: tables[0]!.id }, { tableId: tables[1]!.id }] } }
           });
           const newOrder = await prisma.order.create({
             data: { companyId: cid, orderNumber: `ORD-SPLIT-${num}`, channel: "DINE_IN", createdById: users.WAITER.id, subtotal: D(0), discountAmount: D(0), discountPercentage: D(0), grandTotal: D(0), status: "CONFIRMED" }
           });
           await prisma.tableSplit.create({
             data: { companyId: cid, sourceOrderId: order.id, newOrderId: newOrder.id, fromTableId: tables[0]!.id, toTableId: tables[1]!.id, splitById: users.WAITER.id }
           });
        }

        // KOT
        if (status !== "CANCELLED") {
          await prisma.kotTicket.create({
            data: {
              companyId: cid, kotNumber: `KOT-${kotSeq++}`, orderId: order.id,
              status: isCompleted ? "SERVED" : "PENDING",
              items: { create: (order as any).items.map((it: any) => ({ orderItemId: it.id, quantity: it.quantity, status: isCompleted ? "SERVED" : "PENDING" })) },
            },
          });
        }

        // Bill + Payment (completed only)
        if (isCompleted) {
          const bill = await prisma.bill.create({
            data: {
              companyId: cid, billNumber: `BIL-${billSeq++}`, orderId: order.id,
              subtotal: D(subtotal), discountAmount: D(0), discountPercentage: D(0), grandTotal: D(subtotal),
              paid: D(subtotal), due: D(0), status: "PAID",
              taxJurisdiction: "NP", currency: "NPR", businessName: c.name,
              splits: o === 0 ? { create: [{ label: "Split 1", amount: D(subtotal/2) }, { label: "Split 2", amount: D(subtotal/2) }] } : undefined
            },
          });
          const payment = await prisma.payment.create({
            data: {
              companyId: cid, billId: bill.id, receivedById: users.CASHIER.id,
              shiftId: shift.id, method: pick(["CASH", "CARD", "QR"] as const), status: "COMPLETED", amount: D(subtotal),
            },
          });

          // 1 refund per company (first day, first order)
          if (d === 4 && o === 0) {
            await prisma.refund.create({
              data: {
                companyId: cid, paymentId: payment.id, processedById: users.ADMIN.id,
                shiftId: shift.id, method: "CASH", amount: D(Math.round(subtotal / 2)), reason: "Customer complaint", status: "COMPLETED",
              },
            });
          }
        }

        // Audit log for cancelled
        if (isCancelled) {
          await prisma.auditLog.create({
            data: { companyId: cid, action: "ORDER_CANCELLED", entity: "ORDER", entityId: order.id, actorId: users.ADMIN.id, reason: "Wrong order" },
          });
        }
      }

      // DailyStock
      await prisma.dailyStock.create({
        data: { companyId: cid, businessDate: dayStart, menuItemId: items[0]!.id, openingQty: 50, remainingQty: rand(10, 40), lowStockAt: 10 },
      });

      // InventoryTransaction
      await prisma.inventoryTransaction.create({
        data: { companyId: cid, menuItemId: items[0]!.id, type: "PURCHASE", quantity: 20, createdById: users.ADMIN.id },
      });

      // Advanced Inventory Operations
      if (d === 4) { 
        const purchase = await prisma.inventoryPurchase.create({
          data: { companyId: cid, purchaseNumber: `PUR-${num}`, supplierId: invSupplier.id, status: "POSTED", subtotal: D(100), vatAmount: D(0), grandTotal: D(100), createdById: users.ADMIN.id }
        });
        const purItem = await prisma.inventoryPurchaseItem.create({
          data: { purchaseId: purchase.id, itemId: invItem.id, unitId: unit.id, quantity: D(10), baseQuantity: D(10), unitCost: D(10), total: D(100) }
        });
        const batch = await prisma.stockBatch.create({
          data: { companyId: cid, itemId: invItem.id, purchaseItemId: purItem.id, receivedQty: D(10), remainingQty: D(8), unitCost: D(10), totalCost: D(100) }
        });
        await prisma.stockBalance.create({
          data: { companyId: cid, itemId: invItem.id, quantityOnHand: D(8), averageCost: D(10), totalValue: D(80) }
        });
        const stockOut = await prisma.stockOut.create({
          data: { companyId: cid, stockOutNumber: `OUT-${num}`, status: "POSTED", reason: "WASTE", createdById: users.ADMIN.id }
        });
        await prisma.stockOutItem.create({
          data: { stockOutId: stockOut.id, itemId: invItem.id, unitId: unit.id, quantity: D(1), baseQuantity: D(1) }
        });
        const adj = await prisma.inventoryAdjustment.create({
          data: { companyId: cid, adjustmentNumber: `ADJ-${num}`, status: "POSTED", reason: "Stock take", createdById: users.ADMIN.id }
        });
        await prisma.inventoryAdjustmentItem.create({
          data: { adjustmentId: adj.id, itemId: invItem.id, unitId: unit.id, systemQuantity: D(8), actualQuantity: D(7), differenceQuantity: D(-1), baseSystemQuantity: D(8), baseActualQuantity: D(7), baseDifferenceQuantity: D(-1) }
        });
        await prisma.stockMovement.create({
          data: { companyId: cid, itemId: invItem.id, batchId: batch.id, type: "PURCHASE_IN", direction: "IN", quantity: D(10), previousQuantity: D(0), newQuantity: D(10), purchaseItemId: purItem.id, createdById: users.ADMIN.id }
        });
      }
    }

    // Number sequences
    for (const [kind, val] of [["ORDER", orderSeq], ["KOT", kotSeq], ["BILL", billSeq], ["SHIFT", shiftSeq]] as const) {
      await prisma.numberSequence.create({ data: { companyId: cid, kind: kind as any, lastValue: val as number } });
    }

    // Idempotency key (so the reset deletes it)
    await prisma.idempotencyKey.create({
      data: { companyId: cid, key: `test-key-${num}`, route: "/api/orders", userId: users.WAITER.id, responseStatus: 200, responseBody: "{}" },
    });

    // Refresh token
    await prisma.refreshToken.create({
      data: { userId: users.ADMIN.id, tokenHash: `fakehash-${num}-${Date.now()}`, expiresAt: new Date(Date.now() + 86400000) },
    });

    console.log(`   ✅ ${c.name}: 5 users, 4 tables, 6 menu items, 20 orders, 5 shifts`);
  }

  // ── Summary ──
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("✅ Multi-company seed completed!");
  console.log("═══════════════════════════════════════════════════════");
  console.log("\n🔐 Credentials (password: ChangeMe123! for ALL):\n");
  console.log("   master@demo.com           [MASTER]");
  for (let i = 1; i <= 4; i++) {
    const comp = COMPANIES[i-1]!;
    console.log(`\n   Company ${i}: ${comp.name} (slug: ${comp.slug})`);
    console.log(`     admin${i}@demo.com        [ADMIN]`);
    console.log(`     cashier${i}@demo.com      [CASHIER]`);
    console.log(`     waiter${i}@demo.com       [WAITER]`);
    console.log(`     kitchen${i}@demo.com      [KITCHEN]`);
    console.log(`     cw${i}@demo.com            [CASHIER_WAITER]`);
  }
  console.log("\n📋 To test reset-company-data.sql:");
  console.log("   1. SELECT id, name, slug FROM \"Company\";");
  console.log("   2. Copy a company id into the v_company_id variable");
  console.log("   3. Run the SQL script");
  console.log("   4. Verify master data preserved, operational data wiped");
  console.log("═══════════════════════════════════════════════════════\n");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
