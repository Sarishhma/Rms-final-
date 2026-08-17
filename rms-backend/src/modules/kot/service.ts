import type { Prisma } from "@prisma/client";
import { badRequest, notFound } from "../../utils/app-error.js";
import { prisma } from "../../prisma/client.js";
import { getCompanyId, getTenantContext } from "../../utils/context.js";
import { paginationMeta } from "../../utils/pagination.js";
import { publishEvent } from "../../websocket/socket.js";
import { websocketEvents } from "../../websocket/events.js";
import { sequenceRepository } from "../sequences/repository.js";
import { kotRepository } from "./repository.js";
import { getDefaultStation, resolveStation, type StationRef } from "../kitchen-stations/routing.js";
import type { listKotSchema, updateKotStatusSchema } from "./schema.js";
import type { z } from "zod";

type KotGenerationOptions = {
  orderItemIds?: string[];
  isAddon?: boolean;
  status?: "PENDING" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";
  quantities?: Map<string, number>;
  includeHeld?: boolean;
  allowDuplicates?: boolean;
};

const targetReadyAtFor = (firedAt: Date, minutes: number | null | undefined) =>
  minutes ? new Date(firedAt.getTime() + minutes * 60_000) : null;

const buildModifiersSnapshot = (
  addons: Array<{
    quantity: number;
    addon: { id: string; name: string };
  }>
) => addons.map((link) => ({ id: link.addon.id, name: link.addon.name, quantity: link.quantity }));

export const kotService = {
  list: async (input: z.infer<typeof listKotSchema>) => {
    const { companyId, userId } = getTenantContext();
    if (!companyId || !userId) throw badRequest("Missing tenant context");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { kitchenStations: { select: { id: true } } }
    });

    const queryInput = { ...input } as any;

    if (user?.role === "KITCHEN") {
      if (user.kitchenStations.length > 0) {
        queryInput.stationIds = user.kitchenStations.map((station) => station.id);
      } else {
        const defaultStation = await getDefaultStation(companyId);
        queryInput.stationIds = [defaultStation.id];
      }
    }

    const [total, rows] = await kotRepository.list(queryInput);
    return { data: rows, meta: paginationMeta(input, total) };
  },

  get: async (id: string) => {
    const kot = await kotRepository.findById(id);
    if (kot) return kot;
    const byOrder = await kotRepository.findByOrderId(id);
    if (byOrder.length > 0) return byOrder;
    throw notFound("KOT");
  },

  listByOrder: async (orderId: string) => {
    return kotRepository.findByOrderId(orderId);
  },

  generateForOrder: async (orderId: string, tx: Prisma.TransactionClient, options: KotGenerationOptions = {}) => {
    const companyId = getCompanyId();
    if (!companyId) throw badRequest("Missing tenant context");

    const order = await tx.order.findFirst({
      where: { id: orderId },
      include: {
        items: {
          where: {
            status: { notIn: ["CANCELLED", "VOIDED"] },
            ...(options.orderItemIds ? { id: { in: options.orderItemIds } } : {}),
            ...(options.includeHeld ? {} : { OR: [{ fireAt: null }, { fireAt: { lte: new Date() } }] }),
            ...(options.allowDuplicates ? {} : { kotItems: { none: {} } })
          },
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                targetPrepMinutes: true,
                kitchenStation: { select: { id: true, name: true } },
                subcategory: { select: { kitchenStation: { select: { id: true, name: true } } } },
                category: { select: { targetPrepMinutes: true, kitchenStation: { select: { id: true, name: true } } } }
              }
            },
            variant: { select: { id: true, name: true } },
            addons: {
              select: {
                quantity: true,
                addon: { select: { id: true, name: true } }
              }
            }
          }
        }
      }
    });
    if (!order) throw notFound("Order");
    if (order.items.length === 0) return [];

    const defaultStation = await getDefaultStation(companyId, tx);
    const firedAt = new Date();
    const itemsByStation = new Map<string, { station: StationRef; items: typeof order.items }>();
    for (const item of order.items) {
      const station = resolveStation(item.menuItem, defaultStation);
      const entry = itemsByStation.get(station.id) ?? { station, items: [] };
      entry.items.push(item);
      itemsByStation.set(station.id, entry);
    }

    const tickets = [];
    for (const [, { station, items }] of itemsByStation) {
      const maxTargetMinutes = Math.max(
        0,
        ...items.map((item) => item.menuItem.targetPrepMinutes ?? item.menuItem.category.targetPrepMinutes ?? 0)
      );
      const kotNumber = await sequenceRepository.next(tx, companyId, "KOT");
      const ticket = await tx.kotTicket.create({
        data: {
          kotNumber,
          orderId,
          stationId: station.id,
          stationName: station.name,
          isAddon: options.isAddon ?? false,
          status: options.status ?? "PENDING",
          firedAt,
          targetReadyAt: targetReadyAtFor(firedAt, maxTargetMinutes),
          items: {
            create: items.map((item) => {
              const targetPrepMinutes = item.menuItem.targetPrepMinutes ?? item.menuItem.category.targetPrepMinutes ?? null;
              return {
                orderItemId: item.id,
                quantity: options.quantities?.get(item.id) ?? item.quantity,
                status: options.status ?? "PENDING",
                itemName: item.menuItem.name,
                variantName: item.variant?.name,
                courseName: item.courseName,
                specialInstructions: item.specialInstructions,
                modifiers: buildModifiersSnapshot(item.addons),
                targetPrepMinutes,
                targetReadyAt: targetReadyAtFor(firedAt, targetPrepMinutes)
              };
            })
          }
        },
        include: { items: true, station: { select: { id: true, name: true } } }
      });
      tickets.push(ticket);
      publishEvent(websocketEvents.kotUpdated, ticket, "kitchen");
    }

    return tickets;
  },

  generateCancellationForOrderItems: async (
    orderId: string,
    items: Array<{ orderItemId: string; quantity: number }>,
    tx: Prisma.TransactionClient
  ) => {
    if (items.length === 0) return [];
    for (const { orderItemId, quantity } of items) {
      const activeKotItems = await tx.kotItem.findMany({
        where: { orderItemId, status: { not: "CANCELLED" } },
        orderBy: { createdAt: "desc" },
      });
      let remainingToCancel = quantity;
      for (const kotItem of activeKotItems) {
        if (remainingToCancel <= 0) break;
        if (kotItem.quantity > remainingToCancel) {
          await tx.kotItem.update({
            where: { id: kotItem.id },
            data: { quantity: kotItem.quantity - remainingToCancel },
          });
          remainingToCancel = 0;
        } else {
          remainingToCancel -= kotItem.quantity;
          await tx.kotItem.update({
            where: { id: kotItem.id },
            data: { quantity: 0, status: "CANCELLED" },
          });
        }
      }
    }
    return kotService.generateForOrder(orderId, tx, {
      orderItemIds: items.map((item) => item.orderItemId),
      isAddon: true,
      status: "CANCELLED",
      quantities: new Map(items.map((item) => [item.orderItemId, item.quantity])),
      includeHeld: true,
      allowDuplicates: true
    });
  },

  fireOrderItems: async (
    orderId: string,
    input: { orderItemIds?: string[]; courseName?: string }
  ) =>
    prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId },
        select: { id: true }
      });
      if (!order) throw notFound("Order");

      const heldItems = await tx.orderItem.findMany({
        where: {
          orderId,
          status: { notIn: ["CANCELLED", "VOIDED"] },
          kotItems: { none: {} },
          ...(input.orderItemIds ? { id: { in: input.orderItemIds } } : {}),
          ...(input.courseName ? { courseName: input.courseName } : {})
        },
        select: { id: true }
      });
      if (heldItems.length === 0) throw badRequest("No held KOT items found to fire");

      const tickets = await kotService.generateForOrder(orderId, tx, {
        orderItemIds: heldItems.map((item) => item.id),
        includeHeld: true
      });
      return tickets;
    }),

  updateStatus: async (id: string, input: z.infer<typeof updateKotStatusSchema>) => {
    const current = await kotRepository.findById(id);
    if (!current) throw notFound("KOT");

    const updated = await kotRepository.updateStatus(id, input.status);
    publishEvent(websocketEvents.kotUpdated, updated, "kitchen");
    return updated;
  },

  updateItemStatus: async (itemId: string, input: z.infer<typeof updateKotStatusSchema>) => {
    const current = await kotRepository.findItemById(itemId);
    if (!current) throw notFound("KOT item");

    const updatedTicket = await kotRepository.updateItemStatus(itemId, input.status);

    const mappedStatus =
      input.status === "PREPARING" ? "PREPARING" :
      input.status === "READY" ? "READY" :
      input.status === "SERVED" ? "SERVED" :
      input.status === "CANCELLED" ? "CANCELLED" : "PENDING";

    if (current.orderItemId) {
      await prisma.orderItem.update({
        where: { id: current.orderItemId },
        data: { status: mappedStatus }
      }).catch(() => {});
    }

    publishEvent(websocketEvents.kotUpdated, updatedTicket, "kitchen");
    return updatedTicket;
  },

  fireScheduledOrderItems: async (now: Date = new Date()) => {
    const readyItems = await prisma.orderItem.findMany({
      where: {
        fireAt: { lte: now },
        status: { notIn: ["CANCELLED", "VOIDED"] },
        kotItems: { none: {} },
        order: { status: "CONFIRMED" }
      },
      select: { id: true, orderId: true }
    });

    if (readyItems.length === 0) return [];

    const byOrder = new Map<string, string[]>();
    for (const item of readyItems) {
      const list = byOrder.get(item.orderId) ?? [];
      list.push(item.id);
      byOrder.set(item.orderId, list);
    }

    const firedTickets = [];
    for (const [orderId, orderItemIds] of byOrder.entries()) {
      const tickets = await prisma.$transaction(async (tx) => {
        return kotService.generateForOrder(orderId, tx, {
          orderItemIds,
          includeHeld: true
        });
      });
      firedTickets.push(...tickets);
    }
    return firedTickets;
  }
};
