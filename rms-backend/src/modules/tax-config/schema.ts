import { z } from "zod";

export const updateTaxConfigSchema = z.object({
  taxJurisdiction: z.string().trim().min(2).max(10).optional(),
  taxRegistrationNumber: z.string().trim().max(40).nullable().optional(),
  businessName: z.string().trim().max(200).nullable().optional(),
  businessAddress: z.string().trim().max(500).nullable().optional(),
  invoiceFooter: z.string().trim().max(500).nullable().optional(),
  currency: z.string().trim().length(3).optional()
});
