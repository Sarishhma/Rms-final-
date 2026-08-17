import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { getPagination, type PaginationInput } from "../../utils/pagination.js";
import type { AuditLogInput } from "./types.js";

const toJson = (value: unknown): Prisma.InputJsonValue | undefined =>
  value === undefined ? undefined : (JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue);

/** Slim select – omits heavy before/after JSON from list responses. */
const auditListSelect = {
  id: true,
  action: true,
  entity: true,
  entityId: true,
  reason: true,
  createdAt: true,
  actor: { select: { id: true, name: true } }
} satisfies Prisma.AuditLogSelect;

export const auditRepository = {
  create: (input: AuditLogInput, tx: Prisma.TransactionClient = prisma) =>
    {
      const data: Prisma.AuditLogUncheckedCreateInput = {
        actorId: input.actorId ?? undefined,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        before: toJson(input.before),
        after: toJson(input.after),
        reason: input.reason ?? undefined
      };
      return tx.auditLog.create({ data });
    },

  list: (input: PaginationInput & { action?: string; entity?: string; entityId?: string }) => {
    const where: Prisma.AuditLogWhereInput = {
      ...(input.action ? { action: input.action as Prisma.EnumAuditActionFilter } : {}),
      ...(input.entity ? { entity: input.entity } : {}),
      ...(input.entityId ? { entityId: input.entityId } : {})
    };

    return prisma.$transaction([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        ...getPagination(input),
        select: auditListSelect,
        orderBy: { createdAt: "desc" }
      })
    ]);
  }
};

