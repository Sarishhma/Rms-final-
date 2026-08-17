import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { badRequest, conflict, notFound } from "../../utils/app-error.js";
import { businessDateFor } from "../../utils/dates.js";
import { paginationMeta } from "../../utils/pagination.js";
import { publishEvent } from "../../websocket/socket.js";
import { websocketEvents } from "../../websocket/events.js";
import { auditRepository } from "../audit/repository.js";
import { stockRepository } from "../stock/repository.js";
import { menuRepository } from "./repository.js";
import type {
  availabilitySchema,
  createAddonSchema,
  createCategoryRequestSchema,
  createMenuItemRequestSchema,
  createSubcategoryRequestSchema,
  createVariantSchema,
  listMenuItemsSchema,
  listSubcategoriesSchema,
  updateMenuItemSchema
} from "./schema.js";
import type { z } from "zod";

// Kitchen stations are NOT auto tenant-scoped by the Prisma extension, so the
// companyId filter is applied explicitly here. Rejects ids that don't belong to
// the company (or don't exist) so MenuItem.kitchenStationId stays referentially
// sound.
async function assertStationsBelongToCompany(
  stationIds: string[],
  companyId: string,
  tx: Prisma.TransactionClient = prisma,
) {
  const ids = [...new Set(stationIds)];
  if (ids.length === 0) return;
  const found = await tx.kitchenStation.count({ where: { id: { in: ids }, companyId } });
  if (found !== ids.length) {
    throw badRequest("One or more kitchenStationId values are invalid for this company");
  }
}

export const menuService = {
  listCategories: () => menuRepository.listCategories(),

  listSubcategories: (input: z.infer<typeof listSubcategoriesSchema>) => menuRepository.listSubcategories(input.categoryId),

  createCategory: async (input: z.infer<typeof createCategoryRequestSchema>, companyId: string) => {
    const inputs = Array.isArray(input) ? input : [input];
    const categories = await prisma.$transaction(async (tx) => {
      const created = [];
      for (const data of inputs) {
        created.push(await menuRepository.createCategory({ ...data, companyId }, tx));
      }
      return created;
    });
    return Array.isArray(input) ? categories : categories[0];
  },
  deleteCategory: async (id: string) =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const category = await menuRepository.findCategoryForDelete(id, tx);
      if (!category) throw notFound("Category");

      const subcategoryIds = category.subcategories.map((subcategory) => subcategory.id);
      const itemCount = await menuRepository.countItemsForCategory(id, subcategoryIds, tx);
      if (itemCount > 0) throw conflict("Cannot delete category because it has been used by menu items");

      const deleted = await menuRepository.deleteCategoryTree(id, tx);
      return { id: deleted.id, deleted: true };
    }),

  createSubcategory: async (input: z.infer<typeof createSubcategoryRequestSchema>, companyId: string) => {
    const inputs = Array.isArray(input) ? input : [input];
    const subcategories = await prisma.$transaction(async (tx) => {
      const created = [];
      for (const data of inputs) {
        created.push(await menuRepository.createSubcategory({ ...data, companyId }, tx));
      }
      return created;
    });
    return Array.isArray(input) ? subcategories : subcategories[0];
  },

  listItems: async (input: z.infer<typeof listMenuItemsSchema>) => {
    const businessDate = businessDateFor();
    await stockRepository.ensureResetRowsForDate(businessDate);

    const [total, items] = await menuRepository.listItems({
      ...input,
      businessDate
    });
    const data = items.map(({ dailyStocks, ...item }) => ({
      ...item,
      remainingStock: dailyStocks[0]?.remainingQty ?? null
    }));

    return { data, meta: paginationMeta(input, total) };
  },

  createItem: async (input: z.infer<typeof createMenuItemRequestSchema>, companyId: string) => {
    const isBatchObj = !Array.isArray(input) && 'items' in input;
    let inputs: any[];
    if (Array.isArray(input)) {
      inputs = input;
    } else if (isBatchObj) {
      inputs = input.items.map((item: any) => ({ ...item, categoryId: input.categoryId, subcategoryId: input.subcategoryId }));
    } else {
      inputs = [input];
    }

    const items = await prisma.$transaction(async (tx) => {
      const created = [];
      const stationIds = inputs
        .map((d) => d.kitchenStationId)
        .filter((x: string | undefined): x is string => Boolean(x));
      await assertStationsBelongToCompany(stationIds, companyId, tx);
      for (const data of inputs) {
        created.push(await menuRepository.createItem({
          name: data.name,
          description: data.description,
          type: data.type,
          basePrice: data.basePrice,
          sku: data.sku,
          targetPrepMinutes: data.targetPrepMinutes,
          trackStock: data.trackStock,
          categoryId: data.categoryId,
          subcategoryId: data.subcategoryId,
          kitchenStationId: data.kitchenStationId,
          variants: { create: data.variants },
          addons: { create: data.addons },
          companyId
        }, tx));
      }
      return created;
    });
    return (Array.isArray(input) || isBatchObj) ? items : items[0];
  },

  updateItem: async (id: string, input: z.infer<typeof updateMenuItemSchema>) => {
    const current = await menuRepository.findItem(id);
    if (!current) throw notFound("Menu item");

    if (input.kitchenStationId) {
      await assertStationsBelongToCompany([input.kitchenStationId], current.companyId);
    }

    return menuRepository.updateItem(id, {
      name: input.name,
      description: input.description,
      type: input.type,
      basePrice: input.basePrice,
      sku: input.sku,
      targetPrepMinutes: input.targetPrepMinutes,
      trackStock: input.trackStock,
      categoryId: input.categoryId,
      subcategoryId: input.subcategoryId,
      kitchenStationId: input.kitchenStationId
    });
  },

  deleteItem: async (id: string) => {
    const current = await menuRepository.findItem(id);
    if (!current) throw notFound("Menu item");
    const deleted = await menuRepository.softDeleteItem(id);
    return { id: deleted.id, deleted: true };
  },

  createVariant: async (input: z.infer<typeof createVariantSchema>) => {
    const item = await menuRepository.findItem(input.menuItemId);
    if (!item) throw notFound("Menu item");
    return menuRepository.createVariant(input);
  },

  createAddon: (input: z.infer<typeof createAddonSchema>) => menuRepository.createAddon(input),

  setAvailability: async (input: z.infer<typeof availabilitySchema>, actorId: string) =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await menuRepository.setAvailability(input.target, input.id, input.isAvailable, tx).catch(() => {
        throw notFound(input.target.toLowerCase());
      });

      await auditRepository.create(
        {
          actorId,
          action: "MENU_AVAILABILITY_CHANGED",
          entity: input.target,
          entityId: input.id,
          after: updated,
          reason: input.isAvailable ? "Marked available" : "Marked unavailable"
        },
        tx
      );

      publishEvent(websocketEvents.stockUpdated, { target: input.target, id: input.id, isAvailable: input.isAvailable });
      return updated;
    }),

  assertSellableItem: async (menuItemId: string, variantId?: string | null, tx: Prisma.TransactionClient = prisma) => {
    const item = await tx.menuItem.findFirst({
      where: { id: menuItemId, isDeleted: false, isAvailable: true },
      include: { variants: { where: variantId ? { id: variantId, isDeleted: false, isAvailable: true } : { id: "__none__" } } }
    });

    if (!item) throw conflict("Menu item is unavailable");
    if (variantId && item.variants.length === 0) throw conflict("Menu variant is unavailable");

    return {
      item,
      variant: variantId ? item.variants[0] : null,
      unitPrice: variantId ? item.variants[0]?.price ?? item.basePrice : item.basePrice,
      trackStock: variantId ? item.variants[0]?.trackStock ?? item.trackStock : item.trackStock
    };
  }
};
