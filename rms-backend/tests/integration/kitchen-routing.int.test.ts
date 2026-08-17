import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../src/prisma/client.js";
import { tenantContext } from "../../src/utils/context.js";
import { kitchenStationService } from "../../src/modules/kitchen-stations/service.js";
import { kotService } from "../../src/modules/kot/service.js";

// Guarded: only runs when pointed at a disposable DB via INTEGRATION_DB.
// The default `vitest run` (which loads .env → the shared remote DB) skips it.
const RUN = !!process.env.INTEGRATION_DB;

describe.skipIf(!RUN)("kitchen routing (DB integration)", () => {
  const companyId = randomUUID();
  let userId = "";
  let mainId = "";
  let grillId = "";
  let barId = "";
  let pastryId = "";
  let itemDefault = "";
  let itemCat = "";
  let itemSub = "";
  let itemOverride = "";

  const ctx = <T>(fn: () => Promise<T>): Promise<T> => tenantContext.run({ companyId, userId }, fn);

  beforeAll(async () => {
    await prisma.company.create({ data: { id: companyId, name: "IntCo", slug: `int-${companyId}` } });
    const user = await prisma.user.create({
      data: { email: `u-${companyId}@test.co`, passwordHash: "x", name: "Tester", role: "ADMIN", companyId },
    });
    userId = user.id;

    // Main is created first, so the service marks it the company default.
    const main = await kitchenStationService.create(companyId, { name: "Main Kitchen", sortOrder: 0 });
    expect(main.isDefault).toBe(true);
    mainId = main.id;
    grillId = (await kitchenStationService.create(companyId, { name: "Grill", sortOrder: 1 })).id;
    barId = (await kitchenStationService.create(companyId, { name: "Bar", sortOrder: 2 })).id;
    pastryId = (await kitchenStationService.create(companyId, { name: "Pastry", sortOrder: 3 })).id;

    const food = await prisma.category.create({ data: { companyId, name: "Food", sortOrder: 0 } });
    const drinks = await prisma.category.create({ data: { companyId, name: "Drinks", sortOrder: 1 } });
    const fry = await prisma.subcategory.create({ data: { companyId, categoryId: food.id, name: "Fry", sortOrder: 0 } });

    const mkItem = (name: string, categoryId: string, subcategoryId: string | null) =>
      prisma.menuItem.create({ data: { companyId, name, categoryId, subcategoryId, basePrice: "10.0000" } });

    itemDefault = (await mkItem("Cola", drinks.id, null)).id; // no rule anywhere  -> default
    itemCat = (await mkItem("Burger", food.id, null)).id; //     category rule    -> Grill
    itemSub = (await mkItem("Fries", food.id, fry.id)).id; //    subcategory rule -> Pastry
    itemOverride = (await mkItem("Churros", food.id, fry.id)).id; // item override -> Bar

    await ctx(() => kitchenStationService.assignRoutes(grillId, companyId, { categoryIds: [food.id], subcategoryIds: [], menuItemIds: [] }));
    await ctx(() => kitchenStationService.assignRoutes(pastryId, companyId, { categoryIds: [], subcategoryIds: [fry.id], menuItemIds: [] }));
    await ctx(() => kitchenStationService.assignRoutes(barId, companyId, { categoryIds: [], subcategoryIds: [], menuItemIds: [itemOverride] }));
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("resolves effective routing by most-specific precedence", async () => {
    const res = await ctx(() => kitchenStationService.effectiveRouting(companyId));
    const byId = new Map(res.items.map((i) => [i.menuItemId, i.station.name]));

    expect(res.defaultStation.name).toBe("Main Kitchen");
    expect(byId.get(itemDefault)).toBe("Main Kitchen");
    expect(byId.get(itemCat)).toBe("Grill");
    expect(byId.get(itemSub)).toBe("Pastry");
    expect(byId.get(itemOverride)).toBe("Bar");
  });

  it("fires one KOT ticket per resolved station with the id + name snapshot", async () => {
    const order = await prisma.order.create({
      data: {
        companyId,
        orderNumber: `ORD-${Date.now()}`,
        createdById: userId,
        status: "CONFIRMED",
        items: {
          create: [
            { menuItemId: itemDefault, quantity: 1, unitPrice: "10.0000", lineSubtotal: "10.0000", status: "PENDING" },
            { menuItemId: itemCat, quantity: 2, unitPrice: "10.0000", lineSubtotal: "20.0000", status: "PENDING" },
            { menuItemId: itemSub, quantity: 1, unitPrice: "10.0000", lineSubtotal: "10.0000", status: "PENDING" },
            { menuItemId: itemOverride, quantity: 1, unitPrice: "10.0000", lineSubtotal: "10.0000", status: "PENDING" },
          ],
        },
      },
      include: { items: true },
    });

    const tickets = await ctx(() =>
      prisma.$transaction((tx: Prisma.TransactionClient) => kotService.generateForOrder(order.id, tx))
    );

    expect(tickets).toHaveLength(4);
    // Exactly one ticket per station (items grouped by resolved station id).
    expect(new Set(tickets.map((t) => t.stationId)).size).toBe(4);

    const menuItemByOrderItem = new Map(order.items.map((oi) => [oi.id, oi.menuItemId]));
    const routeByMenuItem = new Map<string, { id: string | null; name: string | null }>();
    for (const ticket of tickets) {
      for (const kotItem of ticket.items) {
        const menuItemId = menuItemByOrderItem.get(kotItem.orderItemId);
        if (menuItemId) routeByMenuItem.set(menuItemId, { id: ticket.stationId, name: ticket.station?.name ?? null });
      }
    }

    expect(routeByMenuItem.get(itemDefault)).toEqual({ id: mainId, name: "Main Kitchen" });
    expect(routeByMenuItem.get(itemCat)).toEqual({ id: grillId, name: "Grill" });
    expect(routeByMenuItem.get(itemSub)).toEqual({ id: pastryId, name: "Pastry" });
    expect(routeByMenuItem.get(itemOverride)).toEqual({ id: barId, name: "Bar" });
  });

  describe("default station invariant", () => {
    const cid = randomUUID();

    beforeAll(async () => {
      await prisma.company.create({ data: { id: cid, name: "DefCo", slug: `def-${cid}` } });
    });

    it("keeps exactly one default and blocks deleting it", async () => {
      const a = await kitchenStationService.create(cid, { name: "A", sortOrder: 0 });
      expect(a.isDefault).toBe(true); // first station is forced default

      const b = await kitchenStationService.create(cid, { name: "B", sortOrder: 1 });
      expect(b.isDefault).toBe(false);

      const promoted = await kitchenStationService.setDefault(b.id, cid);
      expect(promoted.isDefault).toBe(true);
      expect((await kitchenStationService.get(a.id, cid)).isDefault).toBe(false);

      // Invariant: never two defaults at once.
      expect(await prisma.kitchenStation.count({ where: { companyId: cid, isDefault: true } })).toBe(1);

      await expect(kitchenStationService.remove(b.id, cid)).rejects.toThrow(/default/i);
      expect((await kitchenStationService.remove(a.id, cid)).deleted).toBe(true);
    });

    it("clears routing references when a non-default station is deleted", async () => {
      const keep = await kitchenStationService.create(cid, { name: "Keep", sortOrder: 2 });
      const temp = await kitchenStationService.create(cid, { name: "Temp", sortOrder: 3 });
      // Ensure a default exists so `keep`/`temp` are non-default and deletable.
      await kitchenStationService.setDefault(keep.id, cid);

      const cat = await prisma.category.create({ data: { companyId: cid, name: "TmpCat", sortOrder: 0 } });
      await tenantContext.run({ companyId: cid }, () =>
        kitchenStationService.assignRoutes(temp.id, cid, { categoryIds: [cat.id], subcategoryIds: [], menuItemIds: [] })
      );
      expect((await prisma.category.findUniqueOrThrow({ where: { id: cat.id } })).kitchenStationId).toBe(temp.id);

      await kitchenStationService.remove(temp.id, cid);
      // FK ON DELETE SET NULL -> category falls back (routes to default at next fire).
      expect((await prisma.category.findUniqueOrThrow({ where: { id: cat.id } })).kitchenStationId).toBeNull();
    });
  });
});
