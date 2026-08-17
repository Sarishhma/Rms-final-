import type { UserRole } from "@prisma/client";
import { prisma } from "../../prisma/client.js";

export const authRepository = {
  findUser: (id: string) => prisma.user.findUnique({ where: { id }, select:{id:true, email:true, name: true,role:true,companyId:true, phoneNumber:true, company: {select:{name:true, slug:true}} } }),

  listUsers: (companyId: string) =>
    prisma.user.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true }
    }),

  updateUser: (userId: string, data: Partial<{ email: string; name: string; role: UserRole; phoneNumber: string; isActive: boolean }>) =>
    prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, role: true, phoneNumber: true, isActive: true }
    }),

  createAdmin: (input: { email: string; name?: string; passwordHash: string }) =>
    prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name,
        role: "ADMIN",
        companyId: null,
        isActive: true
      },
      select: { id: true, email: true, name: true, role: true, companyId: true, isActive: true, createdAt: true }
    }),

  listAdmins: () =>
    prisma.user.findMany({
      where: { role: "ADMIN" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        isActive: true,
        createdAt: true,
        company: { select: { id: true, name: true, slug: true, isActive: true } }
      }
    }),

  createCompanyForAdmin: (userId: string, input: { name: string; slug: string }) =>
    prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: input.name,
          slug: input.slug
        },
        select: { id: true, name: true, slug: true, isActive: true, createdAt: true }
      });

      // Every company gets exactly one default kitchen station so KOT routing
      // always has a fallback for items with no explicit route.
      await tx.kitchenStation.create({
        data: { companyId: company.id, name: "Main Kitchen", isDefault: true, sortOrder: 0 },
      });

      const user = await tx.user.update({
        where: { id: userId },
        data: { companyId: company.id },
        select: { id: true, email: true, name: true, role: true, companyId: true, isActive: true }
      });

      return { company, user };
    }),

  findCompany: (companyId: string) => prisma.company.findUnique({ where: { id: companyId } }),

  findCompanyWithProfile: (companyId: string) =>
    prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        slug: true,
        taxConfig: {
          select: {
            businessName: true,
            businessAddress: true,
            taxRegistrationNumber: true,
            currency: true,
          }
        }
      }
    }),

  findUserByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),

  addPendingStaff: (input: { companyId: string; email: string; passwordHash: string; name?: string; phoneNumber?:string; role: Exclude<UserRole, "MASTER" | "ADMIN"> }) =>
    prisma.user.create({
      data: {
        companyId: input.companyId,
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name,
        role: input.role,
        phoneNumber: input.phoneNumber,
      },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true }
    }),

  // ─── Refresh Token operations ───────────────────────────────────────────────

  createRefreshToken: (input: { tokenHash: string; userId: string; family: string; expiresAt: Date }) =>
    prisma.refreshToken.create({
      data: {
        tokenHash: input.tokenHash,
        userId: input.userId,
        family: input.family,
        expiresAt: input.expiresAt
      }
    }),

  findRefreshTokenByHash: (tokenHash: string) =>
    prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, email: true, name: true, role: true, companyId: true, isActive: true } } }
    }),

  revokeRefreshToken: (tokenHash: string) =>
    prisma.refreshToken.update({
      where: { tokenHash },
      data: { isRevoked: true }
    }),

  /** Revoke all tokens in a family — used when token reuse (replay) is detected. */
  revokeTokenFamily: (family: string) =>
    prisma.refreshToken.updateMany({
      where: { family, isRevoked: false },
      data: { isRevoked: true }
    }),

  /** Revoke all refresh tokens for a user (full logout from all devices). */
  revokeAllUserTokens: (userId: string) =>
    prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true }
    }),

  /** Purge expired tokens to keep the table lean. */
  deleteExpiredRefreshTokens: () =>
    prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    }),

    updatePasswordHash:(userId: string, passwordHash: string)=>
      prisma.user.update({
        where:{id:userId},
        data:{passwordHash},
        select:{id:true, email:true, name:true, role: true},
      }),
};
