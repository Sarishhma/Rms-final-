import type { Prisma, SequenceKind } from "@prisma/client";
import { randomUUID } from "crypto";

const PREFIX: Record<SequenceKind, string> = {
  ORDER: "ORD",
  KOT: "KOT",
  BILL: "BILL",
  SHIFT: "SH",
  INVENTORY_PURCHASE:"PUR",
  STOCK_OUT:"OUT",
  INVENTORY_ADJUSTMENT:"ADJ"
};

const PAD_WIDTH = 6;

type Row = { lastValue: number };

// Atomic per-(company,kind) counter via Postgres ON CONFLICT DO UPDATE.
// Safe under concurrent transactions because the conflict path takes a
// row lock for the duration of the enclosing transaction.
export const sequenceRepository = {
  next: async (
    tx: Prisma.TransactionClient,
    companyId: string,
    kind: SequenceKind,
  ): Promise<string> => {
    const rows = await tx.$queryRawUnsafe<Row[]>(
      `INSERT INTO "NumberSequence" ("id", "companyId", "kind", "lastValue", "updatedAt")
       VALUES ($1, $2, $3::"SequenceKind", 1, NOW())
       ON CONFLICT ("companyId", "kind")
       DO UPDATE SET "lastValue" = "NumberSequence"."lastValue" + 1, "updatedAt" = NOW()
       RETURNING "lastValue"`,
      randomUUID(),
      companyId,
      kind,
    );

    const value = rows[0]?.lastValue;
    if (value === undefined) {
      throw new Error(`Failed to allocate ${kind} sequence for company ${companyId}`);
    }

    return `${PREFIX[kind]}-${String(value).padStart(PAD_WIDTH, "0")}`;
  },
};
