import { conflict, notFound } from "../../utils/app-error.js";
import { paginationMeta } from "../../utils/pagination.js";
import { customerRepository } from "./repository.js";
import type {
  createCustomerSchema,
  listCustomersSchema,
  lookupCustomerSchema,
  updateCustomerSchema
} from "./schema.js";
import type { z } from "zod";

const normalizePhone = (phone: string) => phone.replace(/\s+/g, "");

export const customerService = {
  list: async (input: z.infer<typeof listCustomersSchema>) => {
    const [total, rows] = await customerRepository.list(input);
    return { data: rows, meta: paginationMeta(input, total) };
  },

  get: async (id: string) => {
    const customer = await customerRepository.findById(id);
    if (!customer) throw notFound("Customer");
    return customer;
  },

  lookup: async (input: z.infer<typeof lookupCustomerSchema>) => {
    const customer = await customerRepository.findByPhone(normalizePhone(input.phone));
    if (!customer) throw notFound("Customer");
    return customer;
  },

  create: async (input: z.infer<typeof createCustomerSchema>) => {
    const phone = normalizePhone(input.phone);
    const existing = await customerRepository.findByPhone(phone);
    if (existing) throw conflict("A customer with this phone already exists");

    return customerRepository.create({
      name: input.name,
      phone,
      email: input.email?.toLowerCase(),
      notes: input.notes
    });
  },

  update: async (id: string, input: z.infer<typeof updateCustomerSchema>) => {
    const existing = await customerRepository.findById(id);
    if (!existing) throw notFound("Customer");

    if (input.phone) {
      const phone = normalizePhone(input.phone);
      if (phone !== existing.phone) {
        const duplicate = await customerRepository.findByPhone(phone);
        if (duplicate) throw conflict("A customer with this phone already exists");
      }
    }

    return customerRepository.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: normalizePhone(input.phone) } : {}),
      ...(input.email !== undefined ? { email: input.email?.toLowerCase() ?? null } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
    });
  },

  remove: async (id: string) => {
    const existing = await customerRepository.findById(id);
    if (!existing) throw notFound("Customer");
    const deleted = await customerRepository.softDelete(id);
    return { id: deleted.id, deleted: true };
  }
};
