import { Prisma } from "@prisma/client";

export const tableResponseSelect = {
  id: true,
  name: true,
  capacity: true,
  floor: true,
  status: true,
  activeOrderId: true,
} satisfies Prisma.DiningTableSelect;

export type TableResponseRow = Prisma.DiningTableGetPayload<{
  select: typeof tableResponseSelect;
}>;

export const toTableResponse = (table: TableResponseRow) => ({
  id: table.id,
  name: table.name,
  capacity: table.capacity,
  floor: table.floor,
  status: table.status,
  activeOrderId: table.activeOrderId,
});
