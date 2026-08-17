import type { Prisma } from "@prisma/client";
import { badRequest } from "../../utils/app-error.js";
import { getCompanyId } from "../../utils/context.js";
import {
  getDefaultStation,
  resolveStation,
  routableMenuItemSelect,
  type RoutableMenuItem,
  type StationRef,
} from "./routing.js";

// ── Kitchen printer job payload ──────────────────────────────────────────────
// A single job routes ONE kitchen station's slice of an order to that station's
// thermal printer. The backend only *prepares* this routing data — it never
// opens sockets, speaks ESC/POS, or talks to a printer (that is the frontend's
// job). See prompt_kitchen.md Phases 6–9.

export type KitchenPrinterJobItem = {
  productId: string;
  productName: string;
  quantity: number;
  /** Selected variant name, when the ordered line has one. */
  variant?: string;
  /** Line-level special instructions ("No Onion", "Less Sugar"). */
  remarks?: string;
};

export type KitchenPrinterJob = {
  kitchenStationId: string;
  kitchenStationName: string;
  printerIp: string | null;
  printerPort: number | null;
  orderId: string;
  orderNumber: string;
  table: string | null;
  customer: string | null;
  staff: string | null;
  createdAt: Date;
  notes: string | null;
  /** Only this station's items — never another station's products. */
  items: KitchenPrinterJobItem[];
};

// The routing-relevant order shape the pure builder consumes. Structurally
// compatible with the Prisma select in {@link buildKitchenPrinterJobs}.
type PrinterJobOrder = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  specialInstructions: string | null;
  customerName: string | null;
  table: { name: string } | null;
  customer: { name: string } | null;
  createdBy: { name: string | null } | null;
  items: Array<{
    quantity: number;
    specialInstructions: string | null;
    variant: { name: string } | null;
    menuItem: { id: string; name: string } & RoutableMenuItem;
  }>;
};

/** Resolved printer target per station id: what the frontend connects to. */
export type StationPrinterMap = ReadonlyMap<string, { printerIp: string; printerPort: number }>;

/**
 * Split an order's items into one printer job per involved kitchen station,
 * reusing the same {@link resolveStation} precedence the KOT engine uses
 * (item → subcategory → category → company default). Each job's printer target
 * comes from `printerByStationId` (the station's mapped kitchen printer); a
 * station with no enabled printer yields null ip/port. Pure — no I/O — so it is
 * unit-tested directly. Each job carries only its own station's items.
 */
export const buildJobsFromOrder = (
  order: PrinterJobOrder,
  defaultStation: StationRef,
  printerByStationId: StationPrinterMap,
): KitchenPrinterJob[] => {
  const byStation = new Map<string, KitchenPrinterJob>();

  for (const item of order.items) {
    const station = resolveStation(item.menuItem, defaultStation);
    let job = byStation.get(station.id);
    if (!job) {
      const printer = printerByStationId.get(station.id);
      job = {
        kitchenStationId: station.id,
        kitchenStationName: station.name,
        printerIp: printer?.printerIp ?? null,
        printerPort: printer?.printerPort ?? null,
        orderId: order.id,
        orderNumber: order.orderNumber,
        table: order.table?.name ?? null,
        customer: order.customer?.name ?? order.customerName ?? null,
        staff: order.createdBy?.name ?? null,
        createdAt: order.createdAt,
        notes: order.specialInstructions ?? null,
        items: [],
      };
      byStation.set(station.id, job);
    }

    const line: KitchenPrinterJobItem = {
      productId: item.menuItem.id,
      productName: item.menuItem.name,
      quantity: item.quantity,
    };
    if (item.variant?.name) line.variant = item.variant.name;
    if (item.specialInstructions) line.remarks = item.specialInstructions;
    job.items.push(line);
  }

  return [...byStation.values()];
};

/**
 * Build the kitchen printer jobs for the given fired order items. `orderItemIds`
 * scopes the payload to exactly what was routed to the kitchen (e.g. the freshly
 * fired lines of a new order or an add-on edit), so held/unfired lines are never
 * printed. Returns an empty array when nothing was fired.
 */
export const buildKitchenPrinterJobs = async (
  orderId: string,
  tx: Prisma.TransactionClient,
  orderItemIds: string[],
): Promise<KitchenPrinterJob[]> => {
  if (orderItemIds.length === 0) return [];

  const companyId = getCompanyId();
  if (!companyId) throw badRequest("Missing tenant context");

  const order = await tx.order.findFirst({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      createdAt: true,
      specialInstructions: true,
      customerName: true,
      table: { select: { name: true } },
      customer: { select: { name: true } },
      createdBy: { select: { name: true } },
      items: {
        where: { id: { in: orderItemIds } },
        select: {
          quantity: true,
          specialInstructions: true,
          variant: { select: { name: true } },
          menuItem: { select: { id: true, name: true, ...routableMenuItemSelect } },
        },
      },
    },
  });
  if (!order || order.items.length === 0) return [];

  // Map each kitchen station to its enabled kitchen printer's network target.
  // First enabled printer per station wins (ordered by createdAt).
  const printers = await tx.printer.findMany({
    where: { companyId, isKitchen: true, isEnabled: true, kitchenStationId: { not: null } },
    select: { kitchenStationId: true, ipAddress: true, port: true },
    orderBy: { createdAt: "asc" },
  });
  const printerByStationId = new Map<string, { printerIp: string; printerPort: number }>();
  for (const p of printers) {
    if (p.kitchenStationId && !printerByStationId.has(p.kitchenStationId)) {
      printerByStationId.set(p.kitchenStationId, { printerIp: p.ipAddress, printerPort: p.port });
    }
  }

  const defaultStation = await getDefaultStation(companyId, tx);
  return buildJobsFromOrder(order, defaultStation, printerByStationId);
};
