import { prisma } from "../../prisma/client.js";
import { badRequest, conflict, notFound } from "../../utils/app-error.js";
import { paginationMeta } from "../../utils/pagination.js";
import { printerRepository } from "./repository.js";
import type {
  CreatePrinterInput,
  UpdatePrinterInput,
  ListPrintersInput,
} from "./types.js";

// KitchenStation / User are not auto tenant-scoped, so companyId is explicit.
async function assertStationInCompany(companyId: string, stationId: string) {
  const station = await prisma.kitchenStation.findFirst({
    where: { id: stationId, companyId },
    select: { id: true },
  });
  if (!station) throw badRequest("kitchenStationId is invalid for this company");
}

async function assertUserInCompany(companyId: string, userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId, isActive: true },
    select: { id: true },
  });
  if (!user) throw badRequest("assignedUserId is invalid for this company");
}

// Normalize + validate the capability invariant:
//   - at least one capability must be enabled
//   - kitchen printer (isKitchen=true) → must map to a station
async function resolveTarget(
  companyId: string,
  isKitchen: boolean,
  isCashier: boolean,
  isBar: boolean,
  isReport: boolean,
  kitchenStationId: string | null,
  assignedUserId: string | null,
): Promise<{ kitchenStationId: string | null; assignedUserId: string | null }> {
  if (!isKitchen && !isCashier && !isBar && !isReport) {
    throw badRequest("At least one capability (isKitchen/isCashier/isBar/isReport) must be enabled");
  }
  if (isKitchen) {
    if (!kitchenStationId) throw badRequest("A kitchen printer must specify kitchenStationId");
    await assertStationInCompany(companyId, kitchenStationId);
    return { kitchenStationId, assignedUserId: assignedUserId ?? null };
  }
  if (kitchenStationId) throw badRequest("A non-kitchen printer must not set kitchenStationId");
  if (assignedUserId) await assertUserInCompany(companyId, assignedUserId);
  return { kitchenStationId: null, assignedUserId: assignedUserId ?? null };
}

export const printerService = {
  list: async (companyId: string, input: ListPrintersInput) => {
    const { items, total } = await printerRepository.list(companyId, input);
    return { data: items, meta: paginationMeta(input, total) };
  },

  get: async (id: string, companyId: string) => {
    const printer = await printerRepository.findById(id, companyId);
    if (!printer) throw notFound("Printer");
    return printer;
  },

  create: async (companyId: string, input: CreatePrinterInput) => {
    const exists = await printerRepository.findByName(companyId, input.name);
    if (exists) throw conflict("Printer name already exists");

    const target = await resolveTarget(
      companyId,
      input.isKitchen,
      input.isCashier,
      input.isBar,
      input.isReport,
      input.kitchenStationId ?? null,
      input.assignedUserId ?? null,
    );

    return printerRepository.create({
      companyId,
      name: input.name,
      ipAddress: input.ipAddress,
      port: input.port,
      isKitchen: input.isKitchen,
      isCashier: input.isCashier,
      isBar: input.isBar,
      isReport: input.isReport,
      isEnabled: input.isEnabled,
      kitchenStationId: target.kitchenStationId,
      assignedUserId: target.assignedUserId,
    });
  },

  update: async (id: string, companyId: string, input: UpdatePrinterInput) => {
    const existing = await printerRepository.findById(id, companyId);
    if (!existing) throw notFound("Printer");

    if (input.name && input.name !== existing.name) {
      const dup = await printerRepository.findByName(companyId, input.name);
      if (dup) throw conflict("Printer name already exists");
    }

    // Effective toggle state = incoming value when provided, else the current row.
    const isKitchen = input.isKitchen ?? existing.isKitchen;
    const isCashier = input.isCashier ?? existing.isCashier;
    const isBar = input.isBar ?? existing.isBar;
    const isReport = input.isReport ?? existing.isReport;
    const effStationId = input.kitchenStationId !== undefined ? input.kitchenStationId : existing.kitchenStationId;
    const effUserId = input.assignedUserId !== undefined ? input.assignedUserId : existing.assignedUserId;
    const target = await resolveTarget(companyId, isKitchen, isCashier, isBar, isReport, effStationId ?? null, effUserId ?? null);

    return printerRepository.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.ipAddress !== undefined ? { ipAddress: input.ipAddress } : {}),
      ...(input.port !== undefined ? { port: input.port } : {}),
      isKitchen,
      isCashier,
      isBar,
      isReport,
      ...(input.isEnabled !== undefined ? { isEnabled: input.isEnabled } : {}),
      kitchenStationId: target.kitchenStationId,
      assignedUserId: target.assignedUserId,
    });
  },

  remove: async (id: string, companyId: string) => {
    const existing = await printerRepository.findById(id, companyId);
    if (!existing) throw notFound("Printer");
    const deleted = await printerRepository.delete(id);
    return { id: deleted.id, deleted: true };
  },
};
