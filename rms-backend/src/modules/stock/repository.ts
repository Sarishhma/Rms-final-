import type { Prisma, StockStatus } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { getPagination, type PaginationInput } from "../../utils/pagination.js";
import { dailyStockSelect } from "./response.js";

export const stockStatusFor = (remainingQty: number, lowStockAt: number): StockStatus => {
  if (remainingQty <= 0) return "OUT_OF_STOCK";
  if (remainingQty <= lowStockAt) return "LOW_STOCK";
  return "IN_STOCK";
};
export const stockRepository = {
  list: (input: PaginationInput & { businessDate?: Date; status?: StockStatus }) => {
    const where: Prisma.DailyStockWhereInput = {
      ...(input.businessDate ? { businessDate: input.businessDate } : {}),
      ...(input.status ? { status: input.status } : {})
    };
    const pagination = getPagination(input);

    return prisma.$transaction([
      prisma.dailyStock.count({ where }),
      prisma.dailyStock.findMany({
        where,
        ...pagination,
        select: {
          id: true,
          businessDate: true,
          menuItemId: true,
          variantId: true,
          openingQty: true,
          remainingQty: true,
          lowStockAt: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          menuItem: { select: { id: true, name: true, sku: true } },
          variant: { select: { id: true, name: true, sku: true } }
        },
        orderBy: [{ businessDate: "desc" }, { createdAt: "desc" }]
      })
    ]);
  },

  findForItem: (businessDate: Date, menuItemId: string, variantId: string | null | undefined, tx: Prisma.TransactionClient = prisma) =>
    tx.dailyStock.findFirst({
      where: { businessDate, menuItemId, variantId: variantId ?? null },
      select: dailyStockSelect
    }),

  create: (data: Prisma.DailyStockUncheckedCreateInput, tx: Prisma.TransactionClient = prisma) => tx.dailyStock.create({ data, select: dailyStockSelect }),

  update: (id: string, data: Prisma.DailyStockUpdateInput, tx: Prisma.TransactionClient = prisma) =>
    tx.dailyStock.update({ where: { id }, data, select: dailyStockSelect }),

  // Seeds a placeholder daily-stock row (openingQty 0) for every tracked item
  // that has none for the business date, so the stock list shows all items and
  // staff can open the ones they want to limit. These placeholders are NOT a
  // hard zero: an item is only stock-enforced once opened with openingQty > 0
  // (see stockService.deductForOrderItem), so they are seeded as IN_STOCK
  // (available) rather than OUT_OF_STOCK.
  ensureResetRowsForDate: async (businessDate: Date, tx: Prisma.TransactionClient = prisma) => {
    const itemRows = await tx.menuItem.findMany({
      where: { isDeleted: false, trackStock: true },
      select: {
        id: true,
        dailyStocks: {
          where: { businessDate, variantId: null },
          select: { id: true },
          take: 1
        }
      }
    });

    const itemsToCreate = itemRows.filter(i => i.dailyStocks.length === 0);
    if (itemsToCreate.length > 0) {
      await tx.dailyStock.createMany({
        data: itemsToCreate.map(item => ({
          businessDate,
          menuItemId: item.id,
          variantId: null,
          openingQty: 0,
          remainingQty: 0,
          lowStockAt: 0,
          status: "IN_STOCK"
        })),
        skipDuplicates: true
      });
    }

    const variantRows = await tx.menuVariant.findMany({
      where: { isDeleted: false, trackStock: true, menuItem: { isDeleted: false } },
      select: {
        id: true,
        menuItemId: true,
        dailyStocks: {
          where: { businessDate },
          select: { id: true },
          take: 1
        }
      }
    });

    const variantsToCreate = variantRows.filter(v => v.dailyStocks.length === 0);
    if (variantsToCreate.length > 0) {
      await tx.dailyStock.createMany({
        data: variantsToCreate.map(variant => ({
          businessDate,
          menuItemId: variant.menuItemId,
          variantId: variant.id,
          openingQty: 0,
          remainingQty: 0,
          lowStockAt: 0,
          status: "IN_STOCK"
        })),
        skipDuplicates: true
      });
    }
  },

  deduct: async (stockId: string, quantity: number, tx: Prisma.TransactionClient) => {
    const result = await tx.dailyStock.updateMany({
      where: { id: stockId },
      data: { remainingQty: { decrement: quantity } }
    });

    return result.count === 1;
  },

  restock: (stockId: string, quantity: number, tx: Prisma.TransactionClient) =>
    tx.dailyStock.update({ where: { id: stockId }, data: { remainingQty: { increment: quantity } }, select: dailyStockSelect })
};
