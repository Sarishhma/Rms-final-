import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { ListKitchenStationsInput, AssignRoutesInput } from "./types.js";

import { kitchenStationResponseSelect } from "./response.js";
import { routableMenuItemSelect } from "./routing.js";

export const kitchenStationRepository = {

  list: async (companyId: string, input: ListKitchenStationsInput) => {
    const where: Prisma.KitchenStationWhereInput = {
      companyId,
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.search ? { name: { contains: input.search, mode: "insensitive" } } : {}),
    };

    const items = await prisma.kitchenStation.findMany({
      where,
      select: kitchenStationResponseSelect,
      orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    });

    const total = await prisma.kitchenStation.count({ where });

    return { items, total };
  },

  findById: (id: string, companyId: string, tx: Prisma.TransactionClient = prisma) =>
    tx.kitchenStation.findFirst({
      where: { id, companyId },
      select: kitchenStationResponseSelect,
    }),

  countForCompany: (companyId: string, tx: Prisma.TransactionClient = prisma) =>
    tx.kitchenStation.count({ where: { companyId } }),

  // Unset whichever station currently holds the default flag for this company.
  // Always run inside the same transaction that sets the new default so the
  // partial unique index never sees two defaults at once.
  clearDefault: (companyId: string, tx: Prisma.TransactionClient = prisma) =>
    tx.kitchenStation.updateMany({
      where: { companyId, isDefault: true },
      data: { isDefault: false },
    }),

  create: (
    companyId: string,
    data: Prisma.KitchenStationCreateWithoutCompanyInput,
    tx: Prisma.TransactionClient = prisma
  ) =>
    tx.kitchenStation.create({
      data: {
        ...data,
        company: { connect: { id: companyId } },
      },
      select: kitchenStationResponseSelect,
    }),

  update: (
    id: string,
    data: Prisma.KitchenStationUpdateInput,
    tx: Prisma.TransactionClient = prisma
  ) =>
    tx.kitchenStation.update({
      where: { id },
      data,
      select: kitchenStationResponseSelect,
    }),

  delete: (id: string, tx: Prisma.TransactionClient = prisma) =>
    tx.kitchenStation.delete({
      where: { id },
      select: { id: true },
    }),

  // ── Routing assignments ─────────────────────────────────────────────────
  // Category/Subcategory/MenuItem are tenant-scoped models, so companyId is
  // auto-injected by the Prisma extension in request context.

  countCategories: (ids: string[], tx: Prisma.TransactionClient = prisma) =>
    tx.category.count({ where: { id: { in: ids }, isDeleted: false } }),
  countSubcategories: (ids: string[], tx: Prisma.TransactionClient = prisma) =>
    tx.subcategory.count({ where: { id: { in: ids }, isDeleted: false } }),
  countMenuItems: (ids: string[], tx: Prisma.TransactionClient = prisma) =>
    tx.menuItem.count({ where: { id: { in: ids }, isDeleted: false } }),

  // Products (menu items) routed DIRECTLY to this station. Used to guard
  // deletion: a station holding products must have them reassigned first.
  countAssignedMenuItems: (stationId: string, tx: Prisma.TransactionClient = prisma) =>
    tx.menuItem.count({ where: { kitchenStationId: stationId, isDeleted: false } }),

  listAssignments: (stationId: string) =>
    prisma.$transaction([
      prisma.category.findMany({
        where: { kitchenStationId: stationId, isDeleted: false },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.subcategory.findMany({
        where: { kitchenStationId: stationId, isDeleted: false },
        select: { id: true, name: true, categoryId: true },
        orderBy: { name: "asc" },
      }),
      prisma.menuItem.findMany({
        where: { kitchenStationId: stationId, isDeleted: false },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]),

  // Replace-set: unassign targets no longer listed, then assign the listed ones.
  // Clear runs before assign so an id that stays listed is never transiently
  // nulled for another station.
  replaceAssignments: async (
    stationId: string,
    input: AssignRoutesInput,
    tx: Prisma.TransactionClient
  ) => {
    await tx.category.updateMany({
      where: { kitchenStationId: stationId, ...(input.categoryIds.length ? { id: { notIn: input.categoryIds } } : {}) },
      data: { kitchenStationId: null },
    });
    if (input.categoryIds.length)
      await tx.category.updateMany({ where: { id: { in: input.categoryIds } }, data: { kitchenStationId: stationId } });

    await tx.subcategory.updateMany({
      where: { kitchenStationId: stationId, ...(input.subcategoryIds.length ? { id: { notIn: input.subcategoryIds } } : {}) },
      data: { kitchenStationId: null },
    });
    if (input.subcategoryIds.length)
      await tx.subcategory.updateMany({ where: { id: { in: input.subcategoryIds } }, data: { kitchenStationId: stationId } });

    await tx.menuItem.updateMany({
      where: { kitchenStationId: stationId, ...(input.menuItemIds.length ? { id: { notIn: input.menuItemIds } } : {}) },
      data: { kitchenStationId: null },
    });
    if (input.menuItemIds.length)
      await tx.menuItem.updateMany({ where: { id: { in: input.menuItemIds } }, data: { kitchenStationId: stationId } });
  },

  // Effective routing for every sellable item — resolved by the caller so the
  // frontend never re-derives routing (backend is the source of truth).
  listRoutableItems: () =>
    prisma.menuItem.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, ...routableMenuItemSelect },
      orderBy: { name: "asc" },
    }),
};
