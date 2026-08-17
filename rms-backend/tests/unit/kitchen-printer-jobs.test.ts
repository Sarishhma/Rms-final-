import { describe, it, expect } from "vitest";
import { buildJobsFromOrder, type StationPrinterMap } from "../../src/modules/kitchen-stations/printer-jobs.js";
import type { StationRef } from "../../src/modules/kitchen-stations/routing.js";

// ── Fixture builders (terse, mirroring tests/unit/kitchen-routing.test.ts) ──

// A station is now just an { id, name } ref — printer targets live in the
// station→printer map passed as the builder's third argument, not on the station.
const station = (id: string): StationRef => ({ id, name: id.toUpperCase() });

const DEFAULT = station("default");

// Build a StationPrinterMap keyed by station id. Stations left out of the map
// have no printer and must yield null ip/port on their job.
const printers = (entries: Record<string, { ip: string; port: number }>): StationPrinterMap =>
  new Map(
    Object.entries(entries).map(
      ([id, { ip, port }]): [string, { printerIp: string; printerPort: number }] => [
        id,
        { printerIp: ip, printerPort: port },
      ]
    )
  );

// No printer wiring — for cases that don't assert on printer targets.
const NO_PRINTERS: StationPrinterMap = new Map();

// Structural mirror of the (non-exported) PrinterJobOrder shape the builder consumes.
type MenuItemFixture = {
  id: string;
  name: string;
  kitchenStation: StationRef | null;
  subcategory: { kitchenStation: StationRef | null } | null;
  category: { kitchenStation: StationRef | null };
};

type OrderItemFixture = {
  quantity: number;
  specialInstructions: string | null;
  variant: { name: string } | null;
  menuItem: MenuItemFixture;
};

type OrderFixture = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  specialInstructions: string | null;
  customerName: string | null;
  table: { name: string } | null;
  customer: { name: string } | null;
  createdBy: { name: string | null } | null;
  items: OrderItemFixture[];
};

// `sub` present (even null) => a subcategory exists with that station; absent => no subcategory.
const menuItem = (
  id: string,
  tiers: { item?: StationRef | null; sub?: StationRef | null; cat?: StationRef | null } = {}
): MenuItemFixture => ({
  id,
  name: id.toUpperCase(),
  kitchenStation: tiers.item ?? null,
  subcategory: tiers.sub !== undefined ? { kitchenStation: tiers.sub } : null,
  category: { kitchenStation: tiers.cat ?? null },
});

const line = (
  item: MenuItemFixture,
  opts: { quantity?: number; variant?: string | null; remarks?: string | null } = {}
): OrderItemFixture => ({
  quantity: opts.quantity ?? 1,
  specialInstructions: opts.remarks ?? null,
  variant: opts.variant ? { name: opts.variant } : null,
  menuItem: item,
});

const order = (items: OrderItemFixture[], overrides: Partial<OrderFixture> = {}): OrderFixture => ({
  id: "order-1",
  orderNumber: "A-001",
  createdAt: new Date("2026-07-08T10:00:00.000Z"),
  specialInstructions: null,
  customerName: null,
  table: null,
  customer: null,
  createdBy: null,
  items,
  ...overrides,
});

describe("buildJobsFromOrder", () => {
  it("splits one order across its resolved stations, one job each, with no cross-station products", () => {
    const grill = station("grill");
    const bar = station("bar");
    const dessert = station("dessert");

    // steak -> grill (category), beer -> bar (item override), cake -> dessert (subcategory)
    const o = order([
      line(menuItem("steak", { cat: grill })),
      line(menuItem("beer", { item: bar, cat: grill })),
      line(menuItem("cake", { sub: dessert, cat: grill })),
    ]);

    const jobs = buildJobsFromOrder(o, DEFAULT, NO_PRINTERS);

    expect(jobs).toHaveLength(3);
    // Insertion order = the first item that hit each station.
    expect(jobs.map((j) => j.kitchenStationId)).toEqual(["grill", "bar", "dessert"]);

    const productsByStation = new Map(jobs.map((j) => [j.kitchenStationId, j.items.map((i) => i.productId)]));
    expect(productsByStation.get("grill")).toEqual(["steak"]);
    expect(productsByStation.get("bar")).toEqual(["beer"]);
    expect(productsByStation.get("dessert")).toEqual(["cake"]);

    // Critical invariant: no product leaks into a station it does not belong to.
    const allProducts = jobs.flatMap((j) => j.items.map((i) => i.productId));
    expect(new Set(allProducts).size).toBe(allProducts.length);
  });

  it("reads each job's printer target from the station->printer map, null when the station is absent", () => {
    const grill = station("grill");
    const bar = station("bar");
    const dessert = station("dessert"); // deliberately absent from the map

    const printerByStationId = printers({
      grill: { ip: "10.0.0.1", port: 9001 },
      bar: { ip: "10.0.0.2", port: 9002 },
      default: { ip: "192.168.1.1", port: 8000 }, // mapped, but no item routes to the default here
    });

    const o = order([
      line(menuItem("steak", { cat: grill })),
      line(menuItem("beer", { item: bar })),
      line(menuItem("cake", { sub: dessert })),
    ]);

    const jobs = buildJobsFromOrder(o, DEFAULT, printerByStationId);
    const grillJob = jobs.find((j) => j.kitchenStationId === "grill")!;
    const barJob = jobs.find((j) => j.kitchenStationId === "bar")!;
    const dessertJob = jobs.find((j) => j.kitchenStationId === "dessert")!;

    // Printer target is looked up by the RESOLVED station's id in the map.
    expect([grillJob.printerIp, grillJob.printerPort]).toEqual(["10.0.0.1", 9001]);
    expect([barJob.printerIp, barJob.printerPort]).toEqual(["10.0.0.2", 9002]);

    // Station absent from the map -> both printer fields fall back to null.
    expect(dessertJob.printerIp).toBe(null);
    expect(dessertJob.printerPort).toBe(null);

    // The default's mapped printer is never inherited by a resolved (non-default) job.
    expect(jobs.some((j) => j.printerIp === "192.168.1.1")).toBe(false);
  });

  it("routes unrouted items to the default station (with its mapped printer); item override beats sub/category", () => {
    const grill = station("grill");
    const printerByStationId = printers({
      default: { ip: "192.168.0.9", port: 8080 },
      grill: { ip: "10.1.1.1", port: 7000 },
    });

    const o = order([
      line(menuItem("water", {})), // no tier routed -> default
      line(menuItem("special", { item: grill, sub: station("sub"), cat: station("cat") })), // override wins
    ]);

    const jobs = buildJobsFromOrder(o, DEFAULT, printerByStationId);

    const defaultJob = jobs.find((j) => j.kitchenStationId === "default")!;
    expect(defaultJob.items.map((i) => i.productId)).toEqual(["water"]);
    expect([defaultJob.printerIp, defaultJob.printerPort]).toEqual(["192.168.0.9", 8080]);

    const grillJob = jobs.find((j) => j.kitchenStationId === "grill")!;
    expect(grillJob.items.map((i) => i.productId)).toEqual(["special"]);
    // The sub/cat stations that lost the precedence race never produced a job.
    expect(jobs.some((j) => j.kitchenStationId === "sub" || j.kitchenStationId === "cat")).toBe(false);
  });

  it("carries quantity through and accumulates multiple same-station items into one job, in order", () => {
    const grill = station("grill");
    const o = order([
      line(menuItem("a", { cat: grill }), { quantity: 2 }),
      line(menuItem("b", { cat: grill }), { quantity: 5 }),
      line(menuItem("c", { cat: grill }), { quantity: 1 }),
    ]);

    const jobs = buildJobsFromOrder(o, DEFAULT, NO_PRINTERS);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]!.items).toEqual([
      { productId: "a", productName: "A", quantity: 2 },
      { productId: "b", productName: "B", quantity: 5 },
      { productId: "c", productName: "C", quantity: 1 },
    ]);
  });

  it("includes variant only when the line has one and remarks only when specialInstructions is set", () => {
    const grill = station("grill");
    const o = order([
      line(menuItem("wb", { cat: grill }), { variant: "Large", remarks: "No onion" }),
      line(menuItem("wv", { cat: grill }), { variant: "Small" }),
      line(menuItem("wr", { cat: grill }), { remarks: "Extra spicy" }),
      line(menuItem("pl", { cat: grill })),
    ]);

    const items = buildJobsFromOrder(o, DEFAULT, NO_PRINTERS)[0]!.items;

    expect(items[0]).toEqual({ productId: "wb", productName: "WB", quantity: 1, variant: "Large", remarks: "No onion" });

    expect(items[1]!.variant).toBe("Small");
    expect(items[1]).not.toHaveProperty("remarks");

    expect(items[2]!.remarks).toBe("Extra spicy");
    expect(items[2]).not.toHaveProperty("variant");

    expect(items[3]).not.toHaveProperty("variant");
    expect(items[3]).not.toHaveProperty("remarks");
  });

  it("maps order-level fields onto every job, with customer/staff/notes fallbacks", () => {
    const grill = station("grill");
    const createdAt = new Date("2026-07-08T12:34:56.000Z");

    const populated = order([line(menuItem("x", { cat: grill }))], {
      id: "ord-42",
      orderNumber: "KOT-42",
      createdAt,
      specialInstructions: "Rush order",
      customerName: "Walk-in Name",
      table: { name: "T-7" },
      customer: { name: "Alice" },
      createdBy: { name: "Bob" },
    });
    const job = buildJobsFromOrder(populated, DEFAULT, NO_PRINTERS)[0]!;

    expect(job.orderId).toBe("ord-42");
    expect(job.orderNumber).toBe("KOT-42");
    expect(job.table).toBe("T-7");
    expect(job.customer).toBe("Alice"); // customer relation wins over customerName
    expect(job.staff).toBe("Bob");
    expect(job.notes).toBe("Rush order");
    expect(job.createdAt).toBe(createdAt); // same Date reference, not a copy

    const fallbacks = order([line(menuItem("y", { cat: grill }))], {
      customerName: "Guest 99",
      customer: null, // relation absent -> fall back to customerName
      createdBy: null, // -> staff null
      specialInstructions: null, // -> notes null
      table: null,
    });
    const j2 = buildJobsFromOrder(fallbacks, DEFAULT, NO_PRINTERS)[0]!;
    expect(j2.customer).toBe("Guest 99");
    expect(j2.staff).toBe(null);
    expect(j2.notes).toBe(null);
    expect(j2.table).toBe(null);

    // createdBy present but nameless still yields null staff.
    const nameless = order([line(menuItem("z", { cat: grill }))], { createdBy: { name: null } });
    expect(buildJobsFromOrder(nameless, DEFAULT, NO_PRINTERS)[0]!.staff).toBe(null);
  });

  it("returns no jobs for an order with no items", () => {
    expect(buildJobsFromOrder(order([]), DEFAULT, NO_PRINTERS)).toEqual([]);
  });
});
