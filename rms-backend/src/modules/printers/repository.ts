import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { printerResponseSelect } from "./response.js";
import type { ListPrintersInput } from "./types.js";

// Printer is NOT in the tenant-scoping Prisma extension list, so companyId is
// always filtered/persisted explicitly (same convention as KitchenStation).
export const printerRepository = {
  list: async (companyId: string, input: ListPrintersInput) => {
    const where: Prisma.PrinterWhereInput = {
      companyId,
      ...(input.isKitchen !== undefined ? { isKitchen: input.isKitchen } : {}),
      ...(input.isCashier !== undefined ? { isCashier: input.isCashier } : {}),
      ...(input.isBar !== undefined ? { isBar: input.isBar } : {}),
      ...(input.isReport !== undefined ? { isReport: input.isReport } : {}),
      ...(input.isEnabled !== undefined ? { isEnabled: input.isEnabled } : {}),
      ...(input.kitchenStationId ? { kitchenStationId: input.kitchenStationId } : {}),
      ...(input.search ? { name: { contains: input.search, mode: "insensitive" } } : {}),
    };

    const items = await prisma.printer.findMany({
      where,
      select: printerResponseSelect,
      orderBy: [{ isKitchen: "desc" }, { isCashier: "desc" }, { isBar: "desc" }, { name: "asc" }],
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    });

    const total = await prisma.printer.count({ where });

    return { items, total };
  },

  findById: (id: string, companyId: string, tx: Prisma.TransactionClient = prisma) =>
    tx.printer.findFirst({
      where: { id, companyId },
      select: printerResponseSelect,
    }),

  findByName: (companyId: string, name: string, tx: Prisma.TransactionClient = prisma) =>
    tx.printer.findFirst({ where: { companyId, name }, select: { id: true } }),

  create: (data: Prisma.PrinterUncheckedCreateInput, tx: Prisma.TransactionClient = prisma) =>
    tx.printer.create({ data, select: printerResponseSelect }),

  update: (id: string, data: Prisma.PrinterUncheckedUpdateInput, tx: Prisma.TransactionClient = prisma) =>
    tx.printer.update({ where: { id }, data, select: printerResponseSelect }),

  delete: (id: string, tx: Prisma.TransactionClient = prisma) =>
    tx.printer.delete({ where: { id }, select: { id: true } }),
};
