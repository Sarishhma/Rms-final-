import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

async function main() {
  const companySlug = 'everest-kitchen';
  const c = await prisma.company.findUnique({ where: { slug: companySlug } });
  if (!c) throw new Error("Company not found");

  const countData = async (label: string) => {
    const orders = await prisma.order.count({ where: { companyId: c.id } });
    const users = await prisma.user.count({ where: { companyId: c.id } });
    const menuItems = await prisma.menuItem.count({ where: { companyId: c.id } });
    const payments = await prisma.payment.count({ where: { companyId: c.id } });
    const shifts = await prisma.shift.count({ where: { companyId: c.id } });
    
    console.log(`[${label}] Orders: ${orders}, Payments: ${payments}, Shifts: ${shifts} | Users: ${users}, MenuItems: ${menuItems}`);
  };

  await countData("BEFORE");

  let sql = fs.readFileSync("prisma/reset-company-data.sql", "utf-8");
  
  // Replace the placeholder with the actual company ID
  sql = sql.replace(
    "v_company_id text := '00000000-0000-0000-0000-000000000000';",
    `v_company_id text := '${c.id}';`
  );

  console.log("Running reset-company-data.sql...");
  await prisma.$executeRawUnsafe(sql);
  console.log("SQL executed successfully.");

  await countData("AFTER");
}

main().finally(() => prisma.$disconnect());
