import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";

// IMPORTANT: every method here accepts/uses an explicit companyId because the
// tenant-scoping Prisma extension injects companyId into `where`, which
// breaks `findUnique({ where: { companyId } })` if we don't pass it ourselves.
// We bypass that injection for upsert by going through the raw client via
// findFirst + update/create, the same pattern used elsewhere.

export const taxConfigSelect = {
  id: true,
  taxJurisdiction: true,
  taxRegistrationNumber: true,
  businessName: true,
  businessAddress: true,
  invoiceFooter: true,
  currency: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TaxConfigSelect;

export const taxConfigRepository = {
  findForCompany: (companyId: string, tx: Prisma.TransactionClient = prisma) =>
    tx.taxConfig.findFirst({ where: { companyId }, select: taxConfigSelect }),

  upsert: (
    companyId: string,
    data: Prisma.TaxConfigUpdateInput,
    tx: Prisma.TransactionClient = prisma
  ) =>
    tx.taxConfig.upsert({
      where: { companyId },
      // The tenant extension injects companyId on create, so we only set the
      // user-supplied fields here.
      create: data as Prisma.TaxConfigCreateInput,
      update: data,
      select: taxConfigSelect
    })
};
