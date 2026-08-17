import { Prisma } from "@prisma/client";

export const printerResponseSelect = {
  id: true,
  name: true,
  ipAddress: true,
  port: true,
  isKitchen: true,
  isCashier: true,
  isBar: true,
  isReport: true,
  isEnabled: true,
  kitchenStationId: true,
  assignedUserId: true,
  createdAt: true,
  updatedAt: true,
  kitchenStation: { select: { id: true, name: true } },
  assignedUser: { select: { id: true, name: true, email: true, role: true } },
} satisfies Prisma.PrinterSelect;
