import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { getPagination, type PaginationInput } from "../../utils/pagination.js";
import { categoryResponseSelect, menuItemResponseSelect, menuVariantResponseSelect, menuAddonResponseSelect, subcategoryResponseSelect } from "./response.js";

const categoryListSelect = {
  id: true,
  name: true,
  sortOrder: true,
  kitchenStationId: true,
  targetPrepMinutes: true,
  isAvailable: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

const subcategoryListSelect = {
  id: true,
  categoryId: true,
  name: true,
  sortOrder: true,
  isAvailable: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SubcategorySelect;

export const menuRepository = {
  listCategories: () =>
    prisma.category.findMany({
      where: { isDeleted: false },
      select: {
        ...categoryListSelect,
        subcategories: {
          where: { isDeleted: false },
          orderBy: { sortOrder: "asc" },
          select: subcategoryListSelect,
        },
      },
      orderBy: { sortOrder: "asc" }
    }),

  listSubcategories: (categoryId?: string) =>
    prisma.subcategory.findMany({
      where: { isDeleted: false, ...(categoryId ? { categoryId } : {}) },
      select: {
        ...subcategoryListSelect,
        category: { select: { id: true, name: true } }
      },
      orderBy: { sortOrder: "asc" }
    }),

  createCategory: (data: Prisma.CategoryUncheckedCreateInput, tx: Prisma.TransactionClient = prisma) => tx.category.create({ data, select: categoryResponseSelect }),

  findCategoryForDelete: (id: string, tx: Prisma.TransactionClient = prisma) =>
    tx.category.findFirst({
      where: { id, isDeleted: false },
      include: { subcategories: { select: { id: true } } }
    }),

  countItemsForCategory: (categoryId: string, subcategoryIds: string[], tx: Prisma.TransactionClient = prisma) =>
    tx.menuItem.count({
      where: {
        OR: [{ categoryId }, ...(subcategoryIds.length ? [{ subcategoryId: { in: subcategoryIds } }] : [])]
      }
    }),

  deleteCategoryTree: async (id: string, tx: Prisma.TransactionClient = prisma) => {
    await tx.subcategory.deleteMany({ where: { categoryId: id } });
    return tx.category.delete({ where: { id }, select: { id: true } });
  },

  createSubcategory: (data: Prisma.SubcategoryUncheckedCreateInput, tx: Prisma.TransactionClient = prisma) => tx.subcategory.create({ data, select: subcategoryResponseSelect }),

  listItems: (
    input: PaginationInput & {
      categoryId?: string;
      subcategoryId?: string;
      search?: string;
      availableOnly?: boolean;
      businessDate: Date;
    }
  ) => {
    const where: Prisma.MenuItemWhereInput = {
      isDeleted: false,
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input.subcategoryId ? { subcategoryId: input.subcategoryId } : {}),
      ...(input.availableOnly ? { isAvailable: true } : {}),
      ...(input.search ? { name: { contains: input.search, mode: "insensitive" } } : {})
    };
    const pagination = getPagination(input);

    return prisma.$transaction([
      prisma.menuItem.count({ where }),
      prisma.menuItem.findMany({
        where,
        ...pagination,
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          categoryId: true,
          subcategoryId: true,
          basePrice: true,
          baseCost: true,
          sku: true,
          kitchenStationId: true,
          targetPrepMinutes: true,
          trackStock: true,
          isAvailable: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { id: true, name: true } },
          subcategory: { select: { id: true, name: true } },
          _count: { select: { variants: { where: { isDeleted: false } }, addons: { where: { isDeleted: false } } } },
          dailyStocks: {
            where: { businessDate: input.businessDate, variantId: null },
            select: { remainingQty: true },
            take: 1
          }
        },
        orderBy: { name: "asc" }
      })
    ]);
  },

  findItem: (id: string, tx: Prisma.TransactionClient = prisma) =>
    tx.menuItem.findFirst({
      where: { id, isDeleted: false },
      include: { variants: { where: { isDeleted: false } }, addons: { where: { isDeleted: false } } }
    }),

  createItem: (data: Prisma.MenuItemUncheckedCreateInput, tx: Prisma.TransactionClient = prisma) =>
    tx.menuItem.create({
      data,
      include: { variants: true, addons: true }
    }),

  updateItem: (id: string, data: Prisma.MenuItemUncheckedUpdateInput) =>
    prisma.menuItem.update({ where: { id }, data, include: { variants: true, addons: true } }),

  softDeleteItem: (id: string) => prisma.menuItem.update({ where: { id }, data: { isDeleted: true, isAvailable: false }, select: { id: true } }),

  createVariant: (data: Prisma.MenuVariantUncheckedCreateInput) => prisma.menuVariant.create({ data, select: menuVariantResponseSelect }),

  createAddon: (data: Prisma.MenuAddonUncheckedCreateInput) => prisma.menuAddon.create({ data, select: menuAddonResponseSelect }),

  setAvailability: (target: string, id: string, isAvailable: boolean, tx: Prisma.TransactionClient = prisma) => {
    if (target === "CATEGORY") return tx.category.update({ where: { id }, data: { isAvailable }, select: { id: true, isAvailable: true } });
    if (target === "SUBCATEGORY") return tx.subcategory.update({ where: { id }, data: { isAvailable }, select: { id: true, isAvailable: true } });
    if (target === "ITEM") return tx.menuItem.update({ where: { id }, data: { isAvailable }, select: { id: true, isAvailable: true } });
    if (target === "VARIANT") return tx.menuVariant.update({ where: { id }, data: { isAvailable }, select: { id: true, isAvailable: true } });
    return tx.menuAddon.update({ where: { id }, data: { isAvailable }, select: { id: true, isAvailable: true } });
  }
};
