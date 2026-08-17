import { Prisma } from "@prisma/client";

export const kitchenStationResponseSelect = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  isDefault: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  assignedStaff: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  }
} satisfies Prisma.KitchenStationSelect;
