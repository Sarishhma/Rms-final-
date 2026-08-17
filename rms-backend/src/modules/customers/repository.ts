import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { getPagination, type PaginationInput } from "../../utils/pagination.js";

type ListInput = PaginationInput & { search?: string; includeDeleted?: boolean };

const customerListSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  isActive: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CustomerSelect;

export const customerRepository = {
  list: (input: ListInput) => {
    const where: Prisma.CustomerWhereInput = {
      ...(input.includeDeleted ? {} : { isDeleted: false }),
      ...(input.search
        ? {
            OR: [
              { name: { contains: input.search, mode: "insensitive" } },
              { phone: { contains: input.search } },
              { email: { contains: input.search, mode: "insensitive" } }
            ]
          }
        : {})
    };

    return prisma.$transaction([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        ...getPagination(input),
        select: customerListSelect,
        orderBy: { createdAt: "desc" }
      })
    ]);
  },

  findById: (id: string) => prisma.customer.findFirst({ where: { id, isDeleted: false }, select: customerListSelect }),

  findByPhone: (phone: string) => prisma.customer.findFirst({ where: { phone, isDeleted: false }, select: customerListSelect }),

  create: (data: Prisma.CustomerUncheckedCreateInput) => prisma.customer.create({ data, select: customerListSelect }),

  update: (id: string, data: Prisma.CustomerUpdateInput) =>
    prisma.customer.update({ where: { id }, data, select: customerListSelect }),

  softDelete: (id: string) =>
    prisma.customer.update({ where: { id }, data: { isDeleted: true, isActive: false }, select: { id: true } })
};
