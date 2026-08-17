import type { AuditAction } from "@prisma/client";

export type AuditLogInput = {
  actorId?: string | null;
  action: AuditAction;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
};
