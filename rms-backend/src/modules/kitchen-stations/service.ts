import { prisma } from "../../prisma/client.js";
import { badRequest, conflict, notFound } from "../../utils/app-error.js";
import { paginationMeta } from "../../utils/pagination.js";
import { kitchenStationRepository } from "./repository.js";
import { getDefaultStation, resolveStation } from "./routing.js";
import {
  ListKitchenStationsInput,
  CreateKitchenStationInput,
  UpdateKitchenStationInput,
  AssignRoutesInput,
} from "./types.js";

async function validateKitchenStaff(companyId: string, staffIds: string[]) {
  if (!staffIds || staffIds.length === 0) return;
  const validStaff = await prisma.user.count({
    where: { id: { in: staffIds }, companyId, role: "KITCHEN", isActive: true },
  });
  if (validStaff !== staffIds.length) {
    throw badRequest("One or more assigned users do not exist, are inactive, or do not have the KITCHEN role.");
  }
}

export const kitchenStationService = {
  list: async (companyId: string, input: ListKitchenStationsInput) => {
    const { items, total } = await kitchenStationRepository.list(companyId, input);
    return { data: items, meta: paginationMeta(input, total) };
  },

  get: async (id: string, companyId: string) => {
    const station = await kitchenStationRepository.findById(id, companyId);
    if (!station) throw notFound("KitchenStation");
    return station;
  },

  create: async (companyId: string, input: CreateKitchenStationInput) => {
    const { staffIds, ...data } = input;
    const exists = await prisma.kitchenStation.findFirst({
      where: { companyId, name: data.name },
    });
    if (exists) throw conflict("KitchenStation name already exists");

    if (staffIds) await validateKitchenStaff(companyId, staffIds);

    return prisma.$transaction(async (tx) => {
      const count = await kitchenStationRepository.countForCompany(companyId, tx);
      const makeDefault = data.isDefault === true || count === 0;

      if (makeDefault) await kitchenStationRepository.clearDefault(companyId, tx);

      const createData: any = { ...data, isDefault: makeDefault };
      if (staffIds && staffIds.length > 0) {
        createData.assignedStaff = { connect: staffIds.map((id) => ({ id })) };
      }

      return kitchenStationRepository.create(companyId, createData, tx);
    });
  },

  update: async (id: string, companyId: string, input: UpdateKitchenStationInput) => {
    const { staffIds, ...data } = input;
    const existing = await kitchenStationRepository.findById(id, companyId);
    if (!existing) throw notFound("KitchenStation");

    if (data.name && data.name !== existing.name) {
      const dup = await prisma.kitchenStation.findFirst({
        where: { companyId, name: data.name },
      });
      if (dup) throw conflict("KitchenStation name already exists");
    }

    if (data.isDefault === false && existing.isDefault) {
      throw conflict("Cannot unset the default station; set another station as default instead");
    }

    if (staffIds) await validateKitchenStaff(companyId, staffIds);

    const updateData: any = { ...data };
    if (staffIds) {
      updateData.assignedStaff = { set: staffIds.map((userId) => ({ id: userId })) };
    }

    if (data.isDefault === true && !existing.isDefault) {
      return prisma.$transaction(async (tx) => {
        await kitchenStationRepository.clearDefault(companyId, tx);
        return kitchenStationRepository.update(id, { ...updateData, isDefault: true }, tx);
      });
    }

    return kitchenStationRepository.update(id, updateData);
  },

  setDefault: async (id: string, companyId: string) => {
    const existing = await kitchenStationRepository.findById(id, companyId);
    if (!existing) throw notFound("KitchenStation");
    if (existing.isDefault) return existing;
    return prisma.$transaction(async (tx) => {
      await kitchenStationRepository.clearDefault(companyId, tx);
      return kitchenStationRepository.update(id, { isDefault: true }, tx);
    });
  },

  remove: async (id: string, companyId: string) => {
    const existing = await kitchenStationRepository.findById(id, companyId);
    if (!existing) throw notFound("KitchenStation");
    if (existing.isDefault) {
      throw conflict("Cannot delete the default station; set another station as default first");
    }
    // Products routed directly to this station must be reassigned first — we do
    // not silently orphan them. Category/subcategory routing, by contrast, is
    // cleared by ON DELETE SET NULL and falls back to the default station.
    const assignedProducts = await kitchenStationRepository.countAssignedMenuItems(id);
    if (assignedProducts > 0) {
      throw conflict(
        `Cannot delete: ${assignedProducts} product(s) are still assigned to this station. Reassign them to another station first.`
      );
    }
    const deleted = await kitchenStationRepository.delete(id);
    return { id: deleted.id, deleted: true };
  },

  getAssignments: async (id: string, companyId: string) => {
    const station = await kitchenStationRepository.findById(id, companyId);
    if (!station) throw notFound("KitchenStation");
    const [categories, subcategories, menuItems] = await kitchenStationRepository.listAssignments(id);
    return { categories, subcategories, menuItems };
  },

  assignRoutes: async (id: string, companyId: string, input: AssignRoutesInput) => {
    const station = await kitchenStationRepository.findById(id, companyId);
    if (!station) throw notFound("KitchenStation");

    return prisma.$transaction(async (tx) => {
      // Validate every target belongs to the tenant before mutating; foreign or
      // stale ids are rejected rather than silently ignored.
      if (input.categoryIds.length) {
        const n = await kitchenStationRepository.countCategories(input.categoryIds, tx);
        if (n !== input.categoryIds.length) throw badRequest("One or more categoryIds are invalid");
      }
      if (input.subcategoryIds.length) {
        const n = await kitchenStationRepository.countSubcategories(input.subcategoryIds, tx);
        if (n !== input.subcategoryIds.length) throw badRequest("One or more subcategoryIds are invalid");
      }
      if (input.menuItemIds.length) {
        const n = await kitchenStationRepository.countMenuItems(input.menuItemIds, tx);
        if (n !== input.menuItemIds.length) throw badRequest("One or more menuItemIds are invalid");
      }

      await kitchenStationRepository.replaceAssignments(id, input, tx);
      const categories = await tx.category.findMany({ where: { kitchenStationId: id, isDeleted: false }, select: { id: true, name: true }, orderBy: { name: "asc" } });
      const subcategories = await tx.subcategory.findMany({ where: { kitchenStationId: id, isDeleted: false }, select: { id: true, name: true, categoryId: true }, orderBy: { name: "asc" } });
      const menuItems = await tx.menuItem.findMany({ where: { kitchenStationId: id, isDeleted: false }, select: { id: true, name: true }, orderBy: { name: "asc" } });
      return { categories, subcategories, menuItems };
    });
  },

  // Resolved routing per sellable item — backend is the single source of truth,
  // so the frontend renders this instead of re-deriving inheritance/default.
  effectiveRouting: async (companyId: string) => {
    const defaultStation = await getDefaultStation(companyId);
    const items = await kitchenStationRepository.listRoutableItems();
    return {
      defaultStation,
      items: items.map((item) => ({
        menuItemId: item.id,
        name: item.name,
        station: resolveStation(item, defaultStation),
      })),
    };
  },
};
