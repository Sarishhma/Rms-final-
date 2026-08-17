import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { conflict, notFound } from "../../utils/app-error.js";
import { businessDateFor } from "../../utils/dates.js";
import { paginationMeta } from "../../utils/pagination.js";
import { publishEvent } from "../../websocket/socket.js";
import { websocketEvents } from "../../websocket/events.js";
import { auditRepository } from "../audit/repository.js";
import { stockRepository, stockStatusFor } from "./repository.js";
import type { adjustStockSchema, listStockSchema, openStockSchema } from "./schema.js";
import type { z } from "zod";

export const calculateAdjustedStock = (
  current: { openingQty: number; remainingQty: number },
  input: { openingQty?: number; remainingQty?: number }
) => {
  if (input.remainingQty !== undefined) {
    return {
      openingQty: current.openingQty + input.remainingQty,
      remainingQty: current.remainingQty + input.remainingQty
    };
  }

  if (input.openingQty !== undefined) {
    const remainingQty = current.remainingQty + input.openingQty - current.openingQty;
    if (remainingQty < 0) throw conflict("Opening stock cannot be lower than already deducted quantity");

    return {
      openingQty: input.openingQty,
      remainingQty
    };
  }

  return {
    openingQty: current.openingQty,
    remainingQty: current.remainingQty
  };
};

export const stockService = {
  list: async (input: z.infer<typeof listStockSchema>) => {
    const businessDate = businessDateFor();
    await stockRepository.ensureResetRowsForDate(businessDate);

    const [total, rows] = await stockRepository.list({ ...input, businessDate });
    return { data: rows, meta: paginationMeta(input, total) };
  },

  open: async (input: z.infer<typeof openStockSchema>) => {
    const businessDate = businessDateFor();
    const existing = await stockRepository.findForItem(businessDate, input.menuItemId, input.variantId);
    if (existing) {
      const remainingQty = existing.remainingQty + input.openingQty - existing.openingQty;
      if (remainingQty < 0) throw conflict("Opening stock cannot be lower than already deducted quantity");

      const stock = await stockRepository.update(existing.id, {
        openingQty: input.openingQty,
        remainingQty,
        lowStockAt: input.lowStockAt,
        status: stockStatusFor(remainingQty, input.lowStockAt)
      });

      publishEvent(websocketEvents.stockUpdated, stock);
      return stock;
    }

    const stock = await stockRepository.create({
      businessDate,
      menuItemId: input.menuItemId,
      variantId: input.variantId,
      openingQty: input.openingQty,
      remainingQty: input.openingQty,
      lowStockAt: input.lowStockAt,
      status: stockStatusFor(input.openingQty, input.lowStockAt)
    });

    publishEvent(websocketEvents.stockUpdated, stock);
    return stock;
  },

  adjust: async (id: string, input: z.infer<typeof adjustStockSchema>, actorId: string) =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const current = await tx.dailyStock.findFirst({ where: { id } });
      if (!current) throw notFound("Daily stock");

      const businessDate = businessDateFor();
      if (current.businessDate.getTime() !== businessDate.getTime()) {
        throw conflict("Only current business day stock can be updated");
      }

      const adjustedStock = calculateAdjustedStock(current, input);

      const lowStockAt = input.lowStockAt ?? current.lowStockAt;
      const updated = await stockRepository.update(
        id,
        {
          ...(input.remainingQty !== undefined || input.openingQty !== undefined
            ? { openingQty: adjustedStock.openingQty, remainingQty: adjustedStock.remainingQty }
            : {}),
          ...(input.lowStockAt !== undefined ? { lowStockAt: input.lowStockAt } : {}),
          status: stockStatusFor(adjustedStock.remainingQty, lowStockAt)
        },
        tx
      );

      await auditRepository.create(
        {
          actorId,
          action: "STOCK_ADJUSTED",
          entity: "DailyStock",
          entityId: id,
          before: current,
          after: updated,
          reason: input.reason
        },
        tx
      );

      publishEvent(websocketEvents.stockUpdated, updated);
      return updated;
    }),

  deductForOrderItem: async (
    businessDate: Date,
    menuItemId: string,
    variantId: string | null | undefined,
    quantity: number,
    tx: Prisma.TransactionClient
  ) => {
    const stock = await stockRepository.findForItem(businessDate, menuItemId, variantId, tx);
    // Stock is hard-enforced only for items actually opened today
    // (openingQty > 0). An unopened item — no row, or the auto-created 0/0
    // reset placeholder — is treated as available/untracked so sales never
    // stall at the start of a business day before stock has been entered.
    if (!stock || stock.openingQty === 0) return;

    const deducted = await stockRepository.deduct(stock.id, quantity, tx);
    if (!deducted) throw conflict("Insufficient stock");

    const updated = await tx.dailyStock.findFirstOrThrow({ where: { id: stock.id } });
    await stockRepository.update(
      stock.id,
      {
        status: stockStatusFor(updated.remainingQty, updated.lowStockAt)
      },
      tx
    );
  },

  // Reverses a prior deduction — used when a confirmed order is edited and its
  // old items are dropped. Best-effort: if no stock row exists for the item on
  // the given business date there is nothing to return.
  restoreForOrderItem: async (
    businessDate: Date,
    menuItemId: string,
    variantId: string | null | undefined,
    quantity: number,
    tx: Prisma.TransactionClient
  ) => {
    const stock = await stockRepository.findForItem(businessDate, menuItemId, variantId, tx);
    // Mirror deductForOrderItem: an unopened item had nothing deducted, so
    // there is nothing to return (and we must not invent stock for it).
    if (!stock || stock.openingQty === 0) return;

    await stockRepository.restock(stock.id, quantity, tx);

    const updated = await tx.dailyStock.findFirstOrThrow({ where: { id: stock.id } });
    await stockRepository.update(
      stock.id,
      {
        status: stockStatusFor(updated.remainingQty, updated.lowStockAt)
      },
      tx
    );
  }
};
