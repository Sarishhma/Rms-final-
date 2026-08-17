import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
export { Prisma };
import { getCompanyId } from "../utils/context.js";


const tenantModels = [
  "DiningTable",
  "Category",
  "Subcategory",
  "MenuItem",
  "MenuVariant",
  "MenuAddon",
  "DailyStock",
  "Order",
  "KotTicket",
  "Bill",
  "Payment",
  "Refund",
  "Customer",
  "Shift",
  "TableGroup",
  "CashDrawerEvent",
  "TaxConfig",
  "AuditLog",
  "NumberSequence",
  "InventoryTransaction",
  "TableSplit",
  // ── Inventory Module ──
  "InventoryUnit",
  "InventoryUnitConversion",
  "InventoryItem",
  "InventorySupplier",
  "InventoryPurchase",
  "StockOut",
  "InventoryAdjustment",
  "StockMovement",
  "StockBalance",
  "StockBatch",
  "InventorySetting",
];

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const basePrisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === "development"
      ? [
        { emit: "event", level: "query" },
        { emit: "event", level: "error" },
        { emit: "event", level: "warn" },
      ]
      : [{ emit: "event", level: "error" }],
});

// ── DB Query Logging ────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  // basePrisma.$on("query" as never, (e: Prisma.QueryEvent) => {
  //   console.log("\n  🗄️  [DB Query]");
  //   console.log(`     SQL:      ${e.query}`);
  //   console.log(`     Params:   ${e.params}`);
  //   console.log(`     Duration: ${e.duration}ms`);
  // });

  basePrisma.$on("warn" as never, (e: Prisma.LogEvent) => {
    console.warn("\n  ⚠️  [DB Warning]", e.message);
  });
}

// basePrisma.$on("error" as never, (e: Prisma.LogEvent) => {
//   console.error("\n  ❌ [DB Error]");
//   console.error(`     Message:  ${e.message}`);
//   console.error(`     Target:   ${e.target}`);
// });

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  (basePrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Log model-level operation details
          // if (process.env.NODE_ENV === "development" && process.env.DB_LOG_ARGS) {
          //   console.log(`\n  📋 [DB Op] ${model}.${operation}`);
          //   console.log(`     Args: ${JSON.stringify(args, null, 2)}`);
          // }

          if (tenantModels.includes(model as string)) {
            const companyId = getCompanyId();
            if (companyId) {
              args = args || {};
              if (
                [
                  "findUnique",
                  "findUniqueOrThrow",
                  "findFirst",
                  "findFirstOrThrow",
                  "findMany",
                  "count",
                  "update",
                  "updateMany",
                  "delete",
                  "deleteMany",
                  "aggregate",
                  "groupBy",
                ].includes(operation)
              ) {
                (args as any).where = { ...(args as any).where, companyId };
              } else if (["create", "createMany"].includes(operation)) {
                if (Array.isArray((args as any).data)) {
                  (args as any).data = (args as any).data.map((d: any) => ({
                    ...d,
                    companyId,
                  }));
                } else {
                  (args as any).data = { ...(args as any).data, companyId };
                }
              } else if (operation === "upsert") {
                (args as any).where = { ...(args as any).where, companyId };
                (args as any).create = { ...(args as any).create, companyId };
              }
            }
          }

          const start = Date.now();
          try {
            const result = await query(args);
            const duration = Date.now() - start;

            // if (process.env.NODE_ENV === "development") {
            //   console.log(`  ✅ [DB Result] ${model}.${operation} (${duration}ms)`);
            // }

            return result;
          } catch (err) {
            const duration = Date.now() - start;
            console.error(`\n  ❌ [DB Error] ${model}.${operation} (${duration}ms)`);
            if (err instanceof Error) {
              console.error(`     Name:    ${err.name}`);
              console.error(`     Message: ${err.message}`);
              console.error(`     Stack:   ${err.stack}`);
            } else {
              console.error(`     Error:   ${JSON.stringify(err)}`);
            }
            throw err;
          }
        },
      },
    },
  }) as unknown as PrismaClient);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
