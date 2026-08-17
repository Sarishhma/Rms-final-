import { authService } from "./modules/auth/service.js";
import { prisma } from "./prisma/client.js";

async function main() {
  try {
    const actor: import("@prisma/client").User = {
      id: "8a4879d5-c4dc-42cb-9064-6581dbf44b22",
      email: "admin@demo.com",
      name: "Admin",
      role: "ADMIN",
      companyId: "819facec-82cd-4656-9527-225a9df8c191",
      passwordHash: "",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      phoneNumber: null
    };
    
    await authService.resetPassword(actor, {
      userId: "8a4879d5-c4dc-42cb-9064-6581dbf44b22",
      newPassword: "ChangeMe123@"
    });
    console.log("Success");
  } catch (e: any) {
    console.log("ERROR TYPE:", e.constructor.name);
    console.log("ERROR CODE:", e.code);
    console.log("ERROR MSG:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
