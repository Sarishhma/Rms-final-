import type { TaxConfig } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { badRequest } from "../../utils/app-error.js";
import { getCompanyId } from "../../utils/context.js";
import { taxConfigRepository } from "./repository.js";
import type { updateTaxConfigSchema } from "./schema.js";
import type { z } from "zod";

// Defaults applied when a tenant has never touched their tax config.
const DEFAULTS = {
  taxJurisdiction: "NP",
  currency: "NPR"
};

export const taxConfigService = {
  // Resolve the tenant's tax config, creating it on first access so callers
  // can rely on a non-null result. Used internally by orders/billing pricing.
  resolve: async (companyId: string): Promise<Omit<TaxConfig, "companyId">> => {
    const existing = await taxConfigRepository.findForCompany(companyId);
    if (existing) return existing;
    return taxConfigRepository.upsert(companyId, DEFAULTS);
  },

  get: async () => {
    const companyId = getCompanyId();
    if (!companyId) throw badRequest("Missing tenant context");
    return taxConfigService.resolve(companyId);
  },

  update: async (input: z.infer<typeof updateTaxConfigSchema>) => {
    const companyId = getCompanyId();
    if (!companyId) throw badRequest("Missing tenant context");
    return prisma.$transaction(async (tx) => {
      // Ensure a row exists first so `update` semantics apply (vs upsert
      // confusion when patching a subset of fields).
      const existing = await taxConfigRepository.findForCompany(companyId, tx);
      if (!existing) {
        await taxConfigRepository.upsert(companyId, DEFAULTS, tx);
      }
      return taxConfigRepository.upsert(companyId, input, tx);
    });
  }
};
