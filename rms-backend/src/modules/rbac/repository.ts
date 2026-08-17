import { prisma } from "../../prisma/client.js";

export const rbacRepository = {
  findUserRole: (userId: string) =>
    prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isActive: true }
    })
};
