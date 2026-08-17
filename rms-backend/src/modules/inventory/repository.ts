import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import {
  CreateInventoryAdjustmentInput,
  CreateInventoryItemInput,
  CreateInventoryPurchaseInput,
  CreateInventorySupplierInput,
  CreateInventoryUnitConversionInput,
  CreateInventoryUnitInput,
  CreateStockOutInput,
  ListStockBalanceQuery,
  UpdateInventoryItemInput,
  UpdateInventorySettingInput,
  UpdateInventorySupplierInput,
  UpdateInventoryUnitInput,
  UpdateInventoryUnitConversionInput,
  UpdateInventoryPurchaseInput,
  UpdateInventoryAdjustmentInput,
} from "./types.js";
import {
  getPagination,
  PaginationInput,
  paginationMeta,
} from "../../utils/pagination.js";
import { badRequest, conflict, notFound } from "../../utils/app-error.js";
import {
  inventoryItemSelect,
  inventoryItemListSelect,
  inventorySupplierSelect,
  inventoryUnitSelect,
  inventoryUnitConversionSelect,
  inventoryUnitListSelect,
  inventoryPurchaseSelect,
  stockOutSelect,
  inventoryAdjustmentSelect,
  stockBalanceSelect,
  inventorySettingSelect,
} from "./response.js";

const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);
const ZERO = D(0);

const generateNumber = (prefix: string) => `${prefix}-${Date.now()}`;

// ─── Unit Conversion Helper ──────────────────────────────────────────────
// Looks up a conversion factor from `fromUnitId` → `toUnitId`.
// Returns Decimal(1) if both units are the same.
// Throws if no conversion path exists.
async function getConversionFactor(
  fromUnitId: string,
  toUnitId: string,
): Promise<Prisma.Decimal> {
  if (fromUnitId === toUnitId) return D(1);

  const conv = await prisma.inventoryUnitConversion.findFirst({
    where: {
      OR: [
        { fromUnitId, toUnitId },
        { fromUnitId: toUnitId, toUnitId: fromUnitId },
      ],
    },
  });

  if (!conv)
    throw badRequest(
      `No unit conversion found between units ${fromUnitId} and ${toUnitId}`,
    );

  // If the stored conversion is from→to, factor is direct.
  // If it's the reverse direction, invert it.
  if (conv.fromUnitId === fromUnitId) return conv.factor;
  return D(1).div(conv.factor).toDecimalPlaces(6);
}

// Resolve base quantities for a list of line items
async function resolveBaseQuantities(
  items: Array<{ itemId: string; unitId: string; quantity: number }>,
): Promise<
  Map<
    string,
    { baseUnitId: string; factor: Prisma.Decimal; baseQuantity: Prisma.Decimal }
  >
> {
  const result = new Map<
    string,
    { baseUnitId: string; factor: Prisma.Decimal; baseQuantity: Prisma.Decimal }
  >();

  for (const item of items) {
    const invItem = await prisma.inventoryItem.findUnique({
      where: { id: item.itemId },
      select: { baseUnitId: true },
    });
    if (!invItem) throw notFound(`Inventory item ${item.itemId}`);

    const factor = await getConversionFactor(item.unitId, invItem.baseUnitId);
    const baseQuantity = D(item.quantity).times(factor).toDecimalPlaces(3);
    result.set(`${item.itemId}:${item.unitId}`, {
      baseUnitId: invItem.baseUnitId,
      factor,
      baseQuantity,
    });
  }
  return result;
}

export const inventoryRepository = {
  // ─── SETTINGS ─────────────────────────────────────────────────────────
  getSettings: () =>
    prisma.inventorySetting.findFirst({ select: inventorySettingSelect }),

  updateSettings: async (data: UpdateInventorySettingInput) => {
    const existing = await prisma.inventorySetting.findFirst();
    if (existing) {
      return prisma.inventorySetting.update({
        where: { id: existing.id },
        data,
        select: inventorySettingSelect,
      });
    }
    return prisma.inventorySetting.create({
      data: data as Prisma.InventorySettingUncheckedCreateInput,
      select: inventorySettingSelect,
    });
  },

  // ─── UNITS & CONVERSIONS ──────────────────────────────────────────────
  listUnits: async (
    input: PaginationInput & {
      type?: any;
      isActive?: boolean;
      search?: string;
    },
  ) => {
    const where: Prisma.InventoryUnitWhereInput = {
      isDeleted: false,
      ...(input.type ? { type: input.type } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.search
        ? { name: { contains: input.search, mode: "insensitive" } }
        : {}),
    };
    const [total, data] = await prisma.$transaction([
      prisma.inventoryUnit.count({ where }),
      prisma.inventoryUnit.findMany({
        where,
        ...getPagination(input),
        select: inventoryUnitListSelect,
        orderBy: { name: "asc" },
      }),
    ]);
    return { data, meta: paginationMeta(input, total) };
  },

  findUnitById: (id: string) =>
    prisma.inventoryUnit.findFirst({
      where: { id, isDeleted: false },
      select: inventoryUnitListSelect,
    }),

  findUnitByName: (name: string) =>
    prisma.inventoryUnit.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    }),

  createUnit: (data: CreateInventoryUnitInput & { createdById: string }) =>
    prisma.inventoryUnit.create({ data, select: inventoryUnitSelect }),

  updateUnit: (id: string, data: Prisma.InventoryUnitUpdateInput) =>
    prisma.inventoryUnit.update({
      where: { id },
      data,
      select: inventoryUnitSelect,
    }),

  hasRelatedUnitRecords: async (id: string) => {
    const unit = await prisma.inventoryUnit.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            baseItems: true,
            purchaseItems: true,
            stockOutItems: true,
            adjustmentItems: true,
            fromConversions: true,
            toConversions: true,
          },
        },
      },
    });
    if (!unit) return false;
    return (
      unit._count.baseItems > 0 ||
      unit._count.purchaseItems > 0 ||
      unit._count.stockOutItems > 0 ||
      unit._count.adjustmentItems > 0 ||
      unit._count.fromConversions > 0 ||
      unit._count.toConversions > 0
    );
  },

  softDeleteUnit: (id: string) =>
    prisma.inventoryUnit.update({
      where: { id },
      data: {
        isDeleted: true,
        isActive: false,
      },
      select: { id: true },
    }),

  hardDeleteUnit: (id: string) =>
    prisma.inventoryUnit.delete({ where: { id }, select: { id: true } }),

  createUnitConversion: (data: CreateInventoryUnitConversionInput) =>
    prisma.inventoryUnitConversion.create({
      data,
      select: inventoryUnitConversionSelect,
    }),

  findUnitConversionById: (id: string) =>
    prisma.inventoryUnitConversion.findFirst({
      where: { id },
      select: inventoryUnitConversionSelect,
    }),

  updateUnitConversion: (
    id: string,
    data: UpdateInventoryUnitConversionInput,
  ) =>
    prisma.inventoryUnitConversion.update({
      where: { id },
      data,
      select: inventoryUnitConversionSelect,
    }),

  // ─── ITEMS ────────────────────────────────────────────────────────────
  listItems: async (
    input: PaginationInput & {
      categoryId?: string;
      type?: any;
      isActive?: boolean;
      lowStockOnly?: boolean;
      search?: string;
    },
  ) => {
    const where: Prisma.InventoryItemWhereInput = {
      isDeleted: false,
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input.type ? { type: input.type } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.search
        ? { name: { contains: input.search, mode: "insensitive" } }
        : {}),
    };

    if (input.lowStockOnly) {
      const ids = await prisma.$queryRaw<Array<{ id: string }>>`
                SELECT i.id FROM "InventoryItem" i
                INNER JOIN "StockBalance" s ON s."itemId" = i.id
                WHERE s."quantityOnHand" <= i."reorderLevel"
                AND i."isDeleted" = false
            `;
      where.id = { in: ids.map((r) => r.id) };
    }

    const [total, data] = await prisma.$transaction([
      prisma.inventoryItem.count({ where }),
      prisma.inventoryItem.findMany({
        where,
        ...getPagination(input),
        select: inventoryItemListSelect,
        orderBy: { name: "asc" },
      }),
    ]);
    return { data, meta: paginationMeta(input, total) };
  },

  findItemById: (id: string) =>
    prisma.inventoryItem.findFirst({
      where: { id, isDeleted: false },
      select: inventoryItemListSelect,
    }),

  createItem: (data: CreateInventoryItemInput & { createdById: string }) =>
    prisma.inventoryItem.create({ data, select: inventoryItemSelect }),

  updateItem: (id: string, data: UpdateInventoryItemInput) =>
    prisma.inventoryItem.update({
      where: { id },
      data,
      select: inventoryItemSelect,
    }),

  hasRelatedItemRecords: async (id: string) => {
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            batches: true,
            movements: true,
            purchaseItems: true,
            stockOutItems: true,
            adjustmentItems: true,
          },
        },
      },
    });
    if (!item) return false;
    return (
      item._count.batches > 0 ||
      item._count.movements > 0 ||
      item._count.purchaseItems > 0 ||
      item._count.stockOutItems > 0 ||
      item._count.adjustmentItems > 0
    );
  },

  softDeleteItem: (id: string) =>
    prisma.inventoryItem.update({
      where: { id },
      data: {
        isDeleted: true,
        isActive: false,
        name: `_deleted_${Date.now()}_${id}`,
        code: `_deleted_${Date.now()}_${id}`,
      },
      select: { id: true },
    }),

  hardDeleteItem: (id: string) =>
    prisma.inventoryItem.delete({ where: { id }, select: { id: true } }),

  // ─── SUPPLIERS ────────────────────────────────────────────────────────
  listSuppliers: async (
    input: PaginationInput & { isActive?: boolean; search?: string },
  ) => {
    const where: Prisma.InventorySupplierWhereInput = {
      isDeleted: false,
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.search
        ? { name: { contains: input.search, mode: "insensitive" } }
        : {}),
    };
    const [total, data] = await prisma.$transaction([
      prisma.inventorySupplier.count({ where }),
      prisma.inventorySupplier.findMany({
        where,
        ...getPagination(input),
        select: inventorySupplierSelect,
        orderBy: { name: "asc" },
      }),
    ]);
    return { data, meta: paginationMeta(input, total) };
  },

  findSupplierById: (id: string) =>
    prisma.inventorySupplier.findFirst({
      where: { id, isDeleted: false },
      select: inventorySupplierSelect,
    }),

  createSupplier: (
    data: CreateInventorySupplierInput & { createdById: string },
  ) =>
    prisma.inventorySupplier.create({ data, select: inventorySupplierSelect }),

  updateSupplier: (id: string, data: UpdateInventorySupplierInput) =>
    prisma.inventorySupplier.update({
      where: { id },
      data,
      select: inventorySupplierSelect,
    }),

  hasRelatedSupplierRecords: async (id: string) => {
    const supplier = await prisma.inventorySupplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            purchases: true,
          },
        },
      },
    });
    if (!supplier) return false;
    return supplier._count.purchases > 0;
  },

  softDeleteSupplier: (id: string) =>
    prisma.inventorySupplier.update({
      where: { id },
      data: {
        isDeleted: true,
        isActive: false,
        name: `_deleted_${Date.now()}_${id}`,
      },
      select: { id: true },
    }),

  hardDeleteSupplier: (id: string) =>
    prisma.inventorySupplier.delete({ where: { id }, select: { id: true } }),

  // ─── PURCHASES ────────────────────────────────────────────────────────
  listPurchases: async (
    input: PaginationInput & {
      status?: any;
      supplierId?: string;
      fiscalYear?: string;
      search?: string;
    },
  ) => {
    const where: Prisma.InventoryPurchaseWhereInput = {
      ...(input.status ? { status: input.status } : {}),
      ...(input.supplierId ? { supplierId: input.supplierId } : {}),
      ...(input.fiscalYear ? { fiscalYear: input.fiscalYear } : {}),
      ...(input.search
        ? { purchaseNumber: { contains: input.search, mode: "insensitive" } }
        : {}),
    };
    const [total, data] = await prisma.$transaction([
      prisma.inventoryPurchase.count({ where }),
      prisma.inventoryPurchase.findMany({
        where,
        ...getPagination(input),
        select: inventoryPurchaseSelect,
        orderBy: { purchaseDate: "desc" },
      }),
    ]);
    return { data, meta: paginationMeta(input, total) };
  },

  findPurchaseById: (id: string) =>
    prisma.inventoryPurchase.findFirst({
      where: { id },
      select: inventoryPurchaseSelect,
    }),

  createPurchase: async (
    input: CreateInventoryPurchaseInput,
    actorId: string,
  ) => {
    const conversions = await resolveBaseQuantities(input.items);

    const subtotal = input.items.reduce(
      (acc, item) => acc.plus(D(item.quantity).times(item.unitCost)),
      ZERO,
    );
    
    // Resolve discount from the discount object
    let discountAmount = ZERO;
    let discountPercentage = ZERO;
    
    if (input.discount) {
      if (input.discount.type === "percentage") {
        discountPercentage = input.discount.value;
      } else {
        discountAmount = input.discount.value;
      }
    }
    
    const calculatedDiscount = discountPercentage.gt(0)
      ? subtotal.times(discountPercentage).div(100)
      : discountAmount;
    
    // Default VAT rate to 13% if not provided
    const vatRate = input.vatRate ?? 13.0;
    
    const taxableAmount = subtotal.minus(calculatedDiscount);
    const vatAmount = taxableAmount
      .times(vatRate)
      .div(100)
      .toDecimalPlaces(4);
    const grandTotal = taxableAmount.plus(vatAmount);

    return prisma.inventoryPurchase.create({
      data: {
        purchaseNumber: generateNumber("PUR"),
        supplierId: input.supplierId,
        supplierInvoiceNumber: input.supplierInvoiceNumber,
        purchaseDate: input.purchaseDate,
        discountAmount: calculatedDiscount,
        discountPercentage,
        vatRate,
        subtotal,
        vatAmount,
        grandTotal,
        note: input.note,
        createdById: actorId,
        items: {
          create: input.items.map((item) => {
            const conv = conversions.get(`${item.itemId}:${item.unitId}`)!;
            return {
              itemId: item.itemId,
              unitId: item.unitId,
              quantity: item.quantity,
              baseQuantity: conv.baseQuantity,
              unitCost: item.unitCost,
              total: D(item.quantity).times(item.unitCost),
              batchNumber: item.batchNumber,
              manufacturedDate: item.manufacturedDate,
              expiryDate: item.expiryDate,
            };
          }),
        },
      },
      select: inventoryPurchaseSelect,
    });
  },

  updatePurchase: async (id: string, input: UpdateInventoryPurchaseInput) => {
    return prisma.$transaction(async (tx) => {
      const purchase = await tx.inventoryPurchase.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!purchase) throw notFound("Purchase");
      if (purchase.status !== "DRAFT") {
        throw conflict("Only DRAFT purchases can be edited.");
      }

      // Determine effective values
      const supplierId =
        input.supplierId !== undefined ? input.supplierId : purchase.supplierId;
      const vatRate =
        input.vatRate !== undefined ? D(input.vatRate) : purchase.vatRate;
      
      // Resolve discount from the discount object
      let discountAmount = purchase.discountAmount;
      let discountPercentage = purchase.discountPercentage;
      
      if (input.discount) {
        if (input.discount.type === "percentage") {
          discountPercentage = input.discount.value;
          discountAmount = ZERO;
        } else {
          discountAmount = input.discount.value;
          discountPercentage = ZERO;
        }
      }

      let itemsData:
        | Array<{
            itemId: string;
            unitId: string;
            quantity: Prisma.Decimal;
            baseQuantity: Prisma.Decimal;
            unitCost: Prisma.Decimal;
            total: Prisma.Decimal;
            batchNumber?: string | null;
            manufacturedDate?: Date | null;
            expiryDate?: Date | null;
          }>
        | undefined;

      if (input.items) {
        const conversions = await resolveBaseQuantities(input.items);

        await tx.inventoryPurchaseItem.deleteMany({
          where: { purchaseId: id },
        });

        itemsData = input.items.map((item) => {
          const conv = conversions.get(`${item.itemId}:${item.unitId}`)!;
          return {
            itemId: item.itemId,
            unitId: item.unitId,
            quantity: D(item.quantity),
            baseQuantity: conv.baseQuantity,
            unitCost: D(item.unitCost),
            total: D(item.quantity).times(item.unitCost),
            batchNumber: item.batchNumber ?? null,
            manufacturedDate: item.manufacturedDate ?? null,
            expiryDate: item.expiryDate ?? null,
          };
        });
      }

      const effectiveItems = itemsData
        ? itemsData.map((i) => ({ quantity: i.quantity, unitCost: i.unitCost }))
        : purchase.items.map((i) => ({
            quantity: i.quantity,
            unitCost: i.unitCost,
          }));

      const subtotal = effectiveItems.reduce(
        (acc, item) => acc.plus(item.quantity.times(item.unitCost)),
        ZERO,
      );

      const calculatedDiscount = D(discountPercentage).gt(0)
        ? subtotal.times(discountPercentage).div(100)
        : D(discountAmount);
      const taxableAmount = subtotal.minus(calculatedDiscount);
      const vatAmount = taxableAmount
        .times(vatRate)
        .div(100)
        .toDecimalPlaces(4);
      const grandTotal = taxableAmount.plus(vatAmount);

      return tx.inventoryPurchase.update({
        where: { id },
        data: {
          ...(input.supplierId !== undefined && {
            supplierId: input.supplierId,
          }),
          ...(input.supplierInvoiceNumber !== undefined && {
            supplierInvoiceNumber: input.supplierInvoiceNumber,
          }),
          ...(input.purchaseDate && { purchaseDate: input.purchaseDate }),
          ...(input.note !== undefined && { note: input.note }),
          discountAmount: calculatedDiscount,
          discountPercentage: D(discountPercentage),
          vatRate,
          subtotal,
          vatAmount,
          grandTotal,
          ...(itemsData && {
            items: {
              create: itemsData,
            },
          }),
        },
        select: inventoryPurchaseSelect,
      });
    });
  },

  cancelPurchase: async (id: string, actorId: string, cancelReason: string) => {
    return prisma.$transaction(async (tx) => {
      const purchase = await tx.inventoryPurchase.findUnique({
        where: { id },
        include: { items: { include: { item: true } } },
      });
      if (!purchase) throw notFound("Purchase");
      if (purchase.status === "CANCELLED") {
        throw conflict("Purchase is already cancelled.");
      }

      if (purchase.status === "POSTED") {
        const settings = await tx.inventorySetting.findFirst();
        const allowNegative = settings?.allowNegativeStock ?? false;

        for (const line of purchase.items) {
          const qty = line.baseQuantity;
          const cost = line.unitCost;
          const lineTotalCost = qty.times(cost);

          const balance = await tx.stockBalance.findUnique({
            where: { itemId: line.itemId },
          });

          if (balance) {
            const newQty = balance.quantityOnHand.minus(qty);
            if (!allowNegative && newQty.lt(0)) {
              throw conflict(
                `Cannot cancel purchase: reversing would cause negative stock for item "${line.item.name}".`,
              );
            }
            const newTotalValue = Prisma.Decimal.max(
              balance.totalValue.minus(lineTotalCost),
              ZERO,
            );
            const newAvgCost = newQty.gt(0)
              ? newTotalValue.div(newQty).toDecimalPlaces(4)
              : ZERO;

            await tx.stockBalance.update({
              where: { itemId: line.itemId },
              data: {
                quantityOnHand: newQty,
                totalValue: newTotalValue,
                averageCost: newAvgCost,
                lastMovementAt: new Date(),
              },
            });
          }

          await tx.stockBatch.updateMany({
            where: { purchaseItemId: line.id },
            data: { remainingQty: ZERO },
          });

          const prevQty = balance ? balance.quantityOnHand : ZERO;
          await tx.stockMovement.create({
            data: {
              itemId: line.itemId,
              type: "PURCHASE_IN",
              direction: "OUT",
              quantity: qty,
              previousQuantity: prevQty,
              newQuantity: prevQty.minus(qty),
              unitCost: cost,
              totalCost: lineTotalCost,
              referenceType: "PURCHASE",
              referenceId: purchase.id,
              purchaseItemId: line.id,
              note: `Reversal: Purchase ${purchase.purchaseNumber} cancelled`,
              createdById: actorId,
            },
          });
        }
      }

      return tx.inventoryPurchase.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledById: actorId,
          cancelledAt: new Date(),
          cancelReason,
        },
        select: inventoryPurchaseSelect,
      });
    });
  },

  // ── Post Purchase → update stock ──────────────────────────────────────
  postPurchase: async (id: string, actorId: string) => {
    return prisma.$transaction(async (tx) => {
      const purchase = await tx.inventoryPurchase.findUnique({
        where: { id },
        include: { items: { include: { item: true } } },
      });
      if (!purchase) throw notFound("Purchase");
      if (purchase.status !== "DRAFT")
        throw conflict("Only DRAFT purchases can be posted.");

      // Update status
      await tx.inventoryPurchase.update({
        where: { id },
        data: { status: "POSTED", postedById: actorId, postedAt: new Date() },
      });

      for (const line of purchase.items) {
        const qty = line.baseQuantity;
        const cost = line.unitCost;
        const lineTotalCost = qty.times(cost);

        // Upsert StockBalance
        const existing = await tx.stockBalance.findUnique({
          where: { itemId: line.itemId },
        });
        if (existing) {
          const newQty = existing.quantityOnHand.plus(qty);
          const newTotalValue = existing.totalValue.plus(lineTotalCost);
          const newAvgCost = newQty.gt(0)
            ? newTotalValue.div(newQty).toDecimalPlaces(4)
            : ZERO;
          await tx.stockBalance.update({
            where: { itemId: line.itemId },
            data: {
              quantityOnHand: newQty,
              totalValue: newTotalValue,
              averageCost: newAvgCost,
              lastMovementAt: new Date(),
            },
          });
        } else {
          const avgCost = qty.gt(0)
            ? lineTotalCost.div(qty).toDecimalPlaces(4)
            : ZERO;
          await tx.stockBalance.create({
            data: {
              itemId: line.itemId,
              quantityOnHand: qty,
              totalValue: lineTotalCost,
              averageCost: avgCost,
              lastMovementAt: new Date(),
            },
          });
        }

        // Create StockBatch
        await tx.stockBatch.create({
          data: {
            itemId: line.itemId,
            purchaseItemId: line.id,
            batchNumber: line.batchNumber,
            receivedQty: qty,
            remainingQty: qty,
            unitCost: cost,
            totalCost: lineTotalCost,
            manufacturedDate: line.manufacturedDate,
            expiryDate: line.expiryDate,
          },
        });

        // Create StockMovement
        const prevQty = existing ? existing.quantityOnHand : ZERO;
        await tx.stockMovement.create({
          data: {
            itemId: line.itemId,
            type: "PURCHASE_IN",
            direction: "IN",
            quantity: qty,
            previousQuantity: prevQty,
            newQuantity: prevQty.plus(qty),
            unitCost: cost,
            totalCost: lineTotalCost,
            referenceType: "PURCHASE",
            referenceId: purchase.id,
            purchaseItemId: line.id,
            createdById: actorId,
          },
        });
      }

      return tx.inventoryPurchase.findUnique({
        where: { id },
        select: inventoryPurchaseSelect,
      });
    });
  },

  // ─── STOCK OUTS ───────────────────────────────────────────────────────
  listStockOuts: async (
    input: PaginationInput & { status?: any; reason?: any; search?: string },
  ) => {
    const where: Prisma.StockOutWhereInput = {
      ...(input.status ? { status: input.status } : {}),
      ...(input.reason ? { reason: input.reason } : {}),
      ...(input.search
        ? { stockOutNumber: { contains: input.search, mode: "insensitive" } }
        : {}),
    };
    const [total, data] = await prisma.$transaction([
      prisma.stockOut.count({ where }),
      prisma.stockOut.findMany({
        where,
        ...getPagination(input),
        select: stockOutSelect,
        orderBy: { stockOutDate: "desc" },
      }),
    ]);
    return { data, meta: paginationMeta(input, total) };
  },

  findStockOutById: (id: string) =>
    prisma.stockOut.findFirst({
      where: { id },
      select: stockOutSelect,
    }),

  createStockOut: async (input: CreateStockOutInput, actorId: string) => {
    const conversions = await resolveBaseQuantities(input.items);

    return prisma.stockOut.create({
      data: {
        stockOutNumber: generateNumber("OUT"),
        reason: input.reason as any,
        customReason: input.customReason,
        stockOutDate: input.stockOutDate,
        issuedTo: input.issuedTo,
        receivedBy: input.receivedBy,
        note: input.note,
        createdById: actorId,
        items: {
          create: input.items.map((item) => {
            const conv = conversions.get(`${item.itemId}:${item.unitId}`)!;
            return {
              itemId: item.itemId,
              unitId: item.unitId,
              quantity: item.quantity,
              baseQuantity: conv.baseQuantity,
              note: item.note,
            };
          }),
        },
      },
      select: stockOutSelect,
    });
  },

  // ── Post Stock Out → deduct stock ─────────────────────────────────────
  postStockOut: async (id: string, actorId: string) => {
    return prisma.$transaction(async (tx) => {
      const stockOut = await tx.stockOut.findUnique({
        where: { id },
        include: { items: { include: { item: true } } },
      });
      if (!stockOut) throw notFound("Stock Out");
      if (stockOut.status !== "DRAFT")
        throw conflict("Only DRAFT stock outs can be posted.");

      // Check settings for negative stock
      const settings = await tx.inventorySetting.findFirst();
      const allowNegative = settings?.allowNegativeStock ?? false;

      await tx.stockOut.update({
        where: { id },
        data: { status: "POSTED", postedById: actorId, postedAt: new Date() },
      });

      for (const line of stockOut.items) {
        const qty = line.baseQuantity;
        const balance = await tx.stockBalance.findUnique({
          where: { itemId: line.itemId },
        });

        if (!balance) {
          if (!allowNegative)
            throw conflict(
              `No stock balance exists for item "${line.item.name}".`,
            );
          // Create a negative balance if allowed
          await tx.stockBalance.create({
            data: {
              itemId: line.itemId,
              quantityOnHand: qty.neg(),
              totalValue: ZERO,
              averageCost: ZERO,
              lastMovementAt: new Date(),
            },
          });
        } else {
          if (!allowNegative && balance.quantityOnHand.lt(qty)) {
            throw conflict(
              `Insufficient stock for item "${line.item.name}". Available: ${balance.quantityOnHand}, Requested: ${qty}`,
            );
          }
          const newQty = balance.quantityOnHand.minus(qty);
          const deductedValue = qty.times(balance.averageCost);
          const newTotalValue = Prisma.Decimal.max(
            balance.totalValue.minus(deductedValue),
            ZERO,
          );

          await tx.stockBalance.update({
            where: { itemId: line.itemId },
            data: {
              quantityOnHand: newQty,
              totalValue: newTotalValue,
              lastMovementAt: new Date(),
            },
          });
        }

        const prevQty = balance ? balance.quantityOnHand : ZERO;
        await tx.stockMovement.create({
          data: {
            itemId: line.itemId,
            type: "STOCK_OUT",
            direction: "OUT",
            stockOutReason: stockOut.reason,
            quantity: qty,
            previousQuantity: prevQty,
            newQuantity: prevQty.minus(qty),
            unitCost: balance?.averageCost ?? ZERO,
            totalCost: qty.times(balance?.averageCost ?? ZERO),
            referenceType: "STOCK_OUT",
            referenceId: stockOut.id,
            stockOutItemId: line.id,
            createdById: actorId,
          },
        });
      }

      return tx.stockOut.findUnique({
        where: { id },
        select: stockOutSelect,
      });
    });
  },

  // ─── ADJUSTMENTS ──────────────────────────────────────────────────────
  listAdjustments: async (
    input: PaginationInput & { status?: any; search?: string },
  ) => {
    const where: Prisma.InventoryAdjustmentWhereInput = {
      ...(input.status ? { status: input.status } : {}),
      ...(input.search
        ? { adjustmentNumber: { contains: input.search, mode: "insensitive" } }
        : {}),
    };
    const [total, data] = await prisma.$transaction([
      prisma.inventoryAdjustment.count({ where }),
      prisma.inventoryAdjustment.findMany({
        where,
        ...getPagination(input),
        select: inventoryAdjustmentSelect,
        orderBy: { adjustmentDate: "desc" },
      }),
    ]);
    return { data, meta: paginationMeta(input, total) };
  },

  findAdjustmentById: (id: string) =>
    prisma.inventoryAdjustment.findFirst({
      where: { id },
      select: inventoryAdjustmentSelect,
    }),

  createAdjustment: async (
    input: CreateInventoryAdjustmentInput,
    actorId: string,
  ) => {
    const conversions = await resolveBaseQuantities(
      input.items.map((i) => ({
        itemId: i.itemId,
        unitId: i.unitId,
        quantity: i.actualQuantity,
      })),
    );

    // Fetch current system quantities for each item
    const itemIds = [...new Set(input.items.map((i) => i.itemId))];
    const balances = await prisma.stockBalance.findMany({
      where: { itemId: { in: itemIds } },
    });
    const balanceMap = new Map(balances.map((b) => [b.itemId, b]));

    return prisma.inventoryAdjustment.create({
      data: {
        adjustmentNumber: generateNumber("ADJ"),
        reason: input.reason,
        adjustmentDate: input.adjustmentDate,
        note: input.note,
        createdById: actorId,
        items: {
          create: input.items.map((item) => {
            const conv = conversions.get(`${item.itemId}:${item.unitId}`)!;
            const balance = balanceMap.get(item.itemId);
            const systemQtyBase = balance ? balance.quantityOnHand : ZERO;
            // Convert system quantity back to the item's display unit
            const systemQty = conv.factor.gt(0)
              ? systemQtyBase.div(conv.factor).toDecimalPlaces(3)
              : ZERO;
            const diff = D(item.actualQuantity).minus(systemQty);
            const baseDiff = conv.baseQuantity.minus(systemQtyBase);

            return {
              itemId: item.itemId,
              unitId: item.unitId,
              systemQuantity: systemQty,
              actualQuantity: item.actualQuantity,
              differenceQuantity: diff,
              baseSystemQuantity: systemQtyBase,
              baseActualQuantity: conv.baseQuantity,
              baseDifferenceQuantity: baseDiff,
              note: item.note,
            };
          }),
        },
      },
      select: inventoryAdjustmentSelect,
    });
  },

  // ── Post Adjustment → set stock to actual ─────────────────────────────
  postAdjustment: async (id: string, actorId: string) => {
    return prisma.$transaction(async (tx) => {
      const adjustment = await tx.inventoryAdjustment.findUnique({
        where: { id },
        include: { items: { include: { item: true } } },
      });
      if (!adjustment) throw notFound("Adjustment");
      if (adjustment.status !== "DRAFT")
        throw conflict("Only DRAFT adjustments can be posted.");

      await tx.inventoryAdjustment.update({
        where: { id },
        data: { status: "POSTED", postedById: actorId, postedAt: new Date() },
      });

      for (const line of adjustment.items) {
        const actualQty = line.baseActualQuantity;
        const balance = await tx.stockBalance.findUnique({
          where: { itemId: line.itemId },
        });
        const prevQty = balance ? balance.quantityOnHand : ZERO;
        const diff = actualQty.minus(prevQty);

        // Set balance to actual quantity
        if (balance) {
          const avgCost = balance.averageCost;
          await tx.stockBalance.update({
            where: { itemId: line.itemId },
            data: {
              quantityOnHand: actualQty,
              totalValue: actualQty.times(avgCost).toDecimalPlaces(4),
              lastMovementAt: new Date(),
            },
          });
        } else {
          await tx.stockBalance.create({
            data: {
              itemId: line.itemId,
              quantityOnHand: actualQty,
              totalValue: ZERO,
              averageCost: ZERO,
              lastMovementAt: new Date(),
            },
          });
        }

        // Create movement record
        const direction = diff.gte(0) ? "IN" : "OUT";
        const movementType = diff.gte(0) ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT";
        await tx.stockMovement.create({
          data: {
            itemId: line.itemId,
            type: movementType,
            direction: direction,
            quantity: diff.abs(),
            previousQuantity: prevQty,
            newQuantity: actualQty,
            referenceType: "INVENTORY_ADJUSTMENT",
            referenceId: adjustment.id,
            adjustmentItemId: line.id,
            createdById: actorId,
          },
        });
      }

      return tx.inventoryAdjustment.findUnique({
        where: { id },
        select: inventoryAdjustmentSelect,
      });
    });
  },

  // ── Update Adjustment (DRAFT only) ────────────────────────────────────
  updateAdjustment: async (
    id: string,
    input: UpdateInventoryAdjustmentInput,
  ) => {
    return prisma.$transaction(async (tx) => {
      const adjustment = await tx.inventoryAdjustment.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!adjustment) throw notFound("Adjustment");
      if (adjustment.status !== "DRAFT") {
        throw conflict("Only DRAFT adjustments can be edited.");
      }

      let itemsData:
        | Array<{
            itemId: string;
            unitId: string;
            systemQuantity: Prisma.Decimal;
            actualQuantity: Prisma.Decimal;
            differenceQuantity: Prisma.Decimal;
            baseSystemQuantity: Prisma.Decimal;
            baseActualQuantity: Prisma.Decimal;
            baseDifferenceQuantity: Prisma.Decimal;
            note?: string | null;
          }>
        | undefined;

      if (input.items) {
        // Resolve base quantities for the new items
        const conversions = await resolveBaseQuantities(
          input.items.map((i) => ({
            itemId: i.itemId,
            unitId: i.unitId,
            quantity: i.actualQuantity,
          })),
        );

        // Re-fetch current system quantities (may have changed since draft was created)
        const itemIds = [...new Set(input.items.map((i) => i.itemId))];
        const balances = await tx.stockBalance.findMany({
          where: { itemId: { in: itemIds } },
        });
        const balanceMap = new Map(balances.map((b) => [b.itemId, b]));

        // Delete old items
        await tx.inventoryAdjustmentItem.deleteMany({
          where: { adjustmentId: id },
        });

        // Build new items with recalculated differences
        itemsData = input.items.map((item) => {
          const conv = conversions.get(`${item.itemId}:${item.unitId}`)!;
          const balance = balanceMap.get(item.itemId);
          const systemQtyBase = balance ? balance.quantityOnHand : ZERO;
          const systemQty = conv.factor.gt(0)
            ? systemQtyBase.div(conv.factor).toDecimalPlaces(3)
            : ZERO;
          const diff = D(item.actualQuantity).minus(systemQty);
          const baseDiff = conv.baseQuantity.minus(systemQtyBase);

          return {
            itemId: item.itemId,
            unitId: item.unitId,
            systemQuantity: systemQty,
            actualQuantity: D(item.actualQuantity),
            differenceQuantity: diff,
            baseSystemQuantity: systemQtyBase,
            baseActualQuantity: conv.baseQuantity,
            baseDifferenceQuantity: baseDiff,
            note: item.note ?? null,
          };
        });
      }

      return tx.inventoryAdjustment.update({
        where: { id },
        data: {
          ...(input.reason !== undefined && { reason: input.reason }),
          ...(input.adjustmentDate && {
            adjustmentDate: input.adjustmentDate,
          }),
          ...(input.note !== undefined && { note: input.note }),
          ...(itemsData && {
            items: { create: itemsData },
          }),
        },
        select: inventoryAdjustmentSelect,
      });
    });
  },

  // ── Cancel Adjustment → reverse stock if POSTED ───────────────────────
  cancelAdjustment: async (
    id: string,
    actorId: string,
    cancelReason: string,
  ) => {
    return prisma.$transaction(async (tx) => {
      const adjustment = await tx.inventoryAdjustment.findUnique({
        where: { id },
        include: { items: { include: { item: true } } },
      });
      if (!adjustment) throw notFound("Adjustment");
      if (adjustment.status === "CANCELLED") {
        throw conflict("Adjustment is already cancelled.");
      }

      // If POSTED, reverse the stock changes
      if (adjustment.status === "POSTED") {
        for (const line of adjustment.items) {
          // baseDifferenceQuantity: positive = stock was added, negative = stock was removed
          const baseDiff = line.baseDifferenceQuantity;
          const balance = await tx.stockBalance.findUnique({
            where: { itemId: line.itemId },
          });

          if (balance) {
            // Reverse: subtract what was added (or add back what was removed)
            const newQty = balance.quantityOnHand.minus(baseDiff);
            const avgCost = balance.averageCost;
            const newTotalValue = Prisma.Decimal.max(
              newQty.times(avgCost).toDecimalPlaces(4),
              ZERO,
            );

            await tx.stockBalance.update({
              where: { itemId: line.itemId },
              data: {
                quantityOnHand: newQty,
                totalValue: newTotalValue,
                lastMovementAt: new Date(),
              },
            });
          }

          // Create reversal stock movement
          const prevQty = balance ? balance.quantityOnHand : ZERO;
          const reversalDirection = baseDiff.gte(0) ? "OUT" : "IN";
          const reversalType = baseDiff.gte(0)
            ? "ADJUSTMENT_OUT"
            : "ADJUSTMENT_IN";

          await tx.stockMovement.create({
            data: {
              itemId: line.itemId,
              type: reversalType,
              direction: reversalDirection,
              quantity: baseDiff.abs(),
              previousQuantity: prevQty,
              newQuantity: prevQty.minus(baseDiff),
              referenceType: "INVENTORY_ADJUSTMENT",
              referenceId: adjustment.id,
              adjustmentItemId: line.id,
              note: `Reversal: Adjustment ${adjustment.adjustmentNumber} cancelled`,
              createdById: actorId,
            },
          });
        }
      }

      return tx.inventoryAdjustment.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledById: actorId,
          cancelledAt: new Date(),
          cancelReason,
        },
        select: inventoryAdjustmentSelect,
      });
    });
  },

  // ── Delete Adjustment (DRAFT only, hard delete) ───────────────────────
  deleteAdjustment: async (id: string) => {
    // onDelete: Cascade on InventoryAdjustmentItem handles child cleanup
    return prisma.inventoryAdjustment.delete({
      where: { id },
      select: { id: true },
    });
  },

  // ─── STOCK BALANCES ───────────────────────────────────────────────────
  listStockBalances: async (input: ListStockBalanceQuery) => {
    const where: Prisma.StockBalanceWhereInput = {};
    const itemWhere: Prisma.InventoryItemWhereInput = { isDeleted: false };

    if (input.itemId) where.itemId = input.itemId;
    if (input.categoryId) itemWhere.categoryId = input.categoryId;
    if (input.search)
      itemWhere.name = { contains: input.search, mode: "insensitive" };
    if (input.categoryId || input.search) {
      where.item = itemWhere;
    }

    if (input.lowStockOnly) {
      const ids = await prisma.$queryRaw<Array<{ id: string }>>`
                SELECT sb.id FROM "StockBalance" sb
                INNER JOIN "InventoryItem" i ON i.id = sb."itemId"
                WHERE sb."quantityOnHand" <= i."reorderLevel"
                AND i."isDeleted" = false
            `;
      where.id = { in: ids.map((r) => r.id) };
    }

    const [total, data] = await prisma.$transaction([
      prisma.stockBalance.count({ where }),
      prisma.stockBalance.findMany({
        where,
        ...getPagination(input),
        select: stockBalanceSelect,
        orderBy: { item: { name: "asc" } },
      }),
    ]);
    return { data, meta: paginationMeta(input, total) };
  },
};
