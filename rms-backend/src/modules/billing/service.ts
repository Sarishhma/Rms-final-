import { BillStatus, Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { badRequest, conflict, notFound } from "../../utils/app-error.js";
import { getCompanyId } from "../../utils/context.js";
import { paginationMeta } from "../../utils/pagination.js";
import { publishEvent } from "../../websocket/socket.js";
import { websocketEvents } from "../../websocket/events.js";
import { auditRepository } from "../audit/repository.js";
import { sequenceRepository } from "../sequences/repository.js";
import { taxConfigService } from "../tax-config/service.js";
import { billDetailSelect, billingRepository } from "./repository.js";
import { D } from "../../utils/money.js";
import type { generateBillSchema, listBillsSchema } from "./schema.js";
import type { z } from "zod";

export const calculateBillTotals = (subtotal: Prisma.Decimal, discountAmount: Prisma.Decimal, discountPercentage: Prisma.Decimal = D(0)) => {
  const calculatedDiscount = discountPercentage.gt(0) 
    ? subtotal.times(discountPercentage).dividedBy(100) 
    : discountAmount;

  if (calculatedDiscount.gt(subtotal)) throw badRequest("Discount cannot exceed subtotal");
  const grandTotal = subtotal.minus(calculatedDiscount);
  return { subtotal, discountAmount: calculatedDiscount, discountPercentage, grandTotal, due: grandTotal };
};

// Resolve discount from the discount field (accepts both number and object formats)
const resolveDiscount = (
  input: z.infer<typeof generateBillSchema>,
  _subtotal: Prisma.Decimal
): { discountAmount: Prisma.Decimal; discountPercentage: Prisma.Decimal; discountReason?: string } => {
  if (input.discount === undefined || input.discount === null) {
    return { discountAmount: D(0), discountPercentage: D(0) };
  }
  // Plain number (legacy format) — moneySchema transforms it to Decimal, treat as flat amount
  if (Prisma.Decimal.isDecimal(input.discount)) {
    return { discountAmount: input.discount, discountPercentage: D(0) };
  }
  // Object format: { type, value, reason }
  const { type, value, reason } = input.discount;
  if (type === "percentage") {
    return { discountAmount: D(0), discountPercentage: value, discountReason: reason };
  }
  return { discountAmount: value, discountPercentage: D(0), discountReason: reason };
};

// Resolve splits from splitCount or empty
const resolveSplits = (
  input: z.infer<typeof generateBillSchema>,
  grandTotal: Prisma.Decimal
): Array<{ label: string; amount: Prisma.Decimal }> => {
  if (input.splitCount && input.splitCount > 0) {
    const splitAmount = grandTotal.dividedBy(input.splitCount);
    const labels = input.splitLabels || [];
    
    const splits = [];
    for (let i = 0; i < input.splitCount; i++) {
      const label = labels[i]?.label || `Guest ${i + 1}`;
      splits.push({ label, amount: splitAmount });
    }
    return splits;
  }
  
  return [];
};

// Exported so payments/refunds tests can pin down status derivation without
// going through the full service path.
export const billStatusForPayment = (
  paid: Prisma.Decimal,
  grandTotal: Prisma.Decimal,
  previousStatus: BillStatus
): BillStatus => {
  if (previousStatus === "VOIDED" || previousStatus === "REFUNDED") return previousStatus;
  if (paid.lte(0)) return "OPEN";
  if (paid.lt(grandTotal)) return "PARTIALLY_PAID";
  return "PAID";
};

export const billStatusForRefund = (
  netPaid: Prisma.Decimal,
  grandTotal: Prisma.Decimal,
  originalStatus: BillStatus
): BillStatus => {
  if (originalStatus === "VOIDED") return "VOIDED";
  if (netPaid.lte(0)) return "REFUNDED";
  if (netPaid.lt(grandTotal)) return "PARTIALLY_PAID";
  return "PAID";
};

// A bill is "locked" once any money has moved against it. Locked bills can be
// fetched but never regenerated — and their order can no longer be edited.
export const billIsLocked = (bill: { paid: Prisma.Decimal | number; status: BillStatus | string }): boolean => {
  const p = Prisma.Decimal.isDecimal(bill.paid) ? bill.paid : D(bill.paid);
  return p.gt(0) ||
    bill.status === "PARTIALLY_PAID" ||
    bill.status === "PAID" ||
    bill.status === "REFUNDED" ||
    bill.status === "VOIDED";
};

export const billingService = {
  list: async (input: z.infer<typeof listBillsSchema>) => {
    const [total, rows] = await billingRepository.list(input);
    return { data: rows, meta: paginationMeta(input, total) };
  },

  get: async (id: string) => {
    const bill = await billingRepository.findById(id);
    if (!bill) throw notFound("Bill");
    return bill;
  },

  generate: async (
    input: z.infer<typeof generateBillSchema>,
    actorId: string,
    externalTx?: Prisma.TransactionClient
  ) => {
    const companyId = getCompanyId();
    if (!companyId) throw badRequest("Missing tenant context");
    const taxConfig = await taxConfigService.resolve(companyId);
    const runner = externalTx
      ? (fn: (tx: Prisma.TransactionClient) => Promise<any>) => fn(externalTx)
      : (fn: (tx: Prisma.TransactionClient) => Promise<any>) => prisma.$transaction(fn);
    return runner(async (tx: Prisma.TransactionClient) => {
      const existing = await billingRepository.findByOrderId(input.orderId, tx);

      // Once any payment has been recorded the bill is frozen: regeneration is
      // refused and the caller just receives the existing bill (with its
      // sequence) so they can re-print it.
      if (existing && billIsLocked(existing)) {
        return { ...existing, billGeneratedSequence: existing.generationCount };
      }

      const order = await tx.order.findFirst({
        where: { id: input.orderId },
        select: {
          id: true,
          status: true,
          items: {
            where: { status: { notIn: ["CANCELLED", "VOIDED"] } },
            select: { lineSubtotal: true }
          },
        },
      });
      if (!order) throw notFound("Order");
      if (order.status !== "CONFIRMED" && order.status !== "COMPLETED") throw conflict("Only confirmed orders can be billed");

      const subtotal = order.items.reduce((sum, item) => sum.plus(item.lineSubtotal), D(0));
      
      const discount = resolveDiscount(input, subtotal);
      const totals = calculateBillTotals(subtotal, discount.discountAmount, discount.discountPercentage);

      const splits = resolveSplits(input, totals.grandTotal);
      
      const splitTotal = splits.reduce((sum, split) => sum.plus(split.amount), D(0));
      if (splits.length > 0) {
        const tolerance = D(0.01);
        if ( splitTotal.minus(totals.grandTotal).abs().gt(tolerance)) {
          throw badRequest("Split bill amounts must equal grand total");
        }
      }

      // Snapshot the business profile at the moment of billing so receipts
      // re-print stably even if tenant later changes business details.
      const fiscalSnapshot = {
        taxJurisdiction: taxConfig.taxJurisdiction,
        taxRegistrationNumber: taxConfig.taxRegistrationNumber,
        businessName: taxConfig.businessName,
        businessAddress: taxConfig.businessAddress,
        invoiceFooter: taxConfig.invoiceFooter,
        currency: taxConfig.currency
      };

      if (existing) {
        const splitsMatch =
          existing.splits.length === splits.length &&
          existing.splits.every(
            (s, i) =>
              s.label === splits[i]!.label &&
              D(s.amount).equals(splits[i]!.amount)
          );
        const totalsMatch =
          existing.subtotal.equals(totals.subtotal) &&
          existing.discountAmount.equals(totals.discountAmount) &&
          existing.discountPercentage.equals(totals.discountPercentage) &&
          existing.grandTotal.equals(totals.grandTotal);

        if (splitsMatch && totalsMatch) {
          return { ...existing, billGeneratedSequence: existing.generationCount };
        }

        // Regenerate against the (possibly edited) order, bumping the
        // sequence and rebuilding splits. Bill number is preserved.
        await tx.bill.update({
          where: { id: existing.id },
          data: {
            ...totals,
            ...fiscalSnapshot,
            generationCount: { increment: 1 },
            splits: { deleteMany: {}, create: splits }
          },
        });
      } else {
        await tx.bill.create({
          data: {
            billNumber: await sequenceRepository.next(tx, companyId, "BILL"),
            orderId: input.orderId,
            ...totals,
            ...fiscalSnapshot,
            splits: { create: splits }
          },
        });
      }

      // Fetch the final bill with the trimmed detail select
      const bill = await billingRepository.findByOrderId(input.orderId, tx);

      if (discount.discountAmount.gt(0) || discount.discountPercentage.gt(0)) {
        await auditRepository.create(
          {
            actorId,
            action: "DISCOUNT_APPLIED",
            entity: "Bill",
            entityId: bill!.id,
            after: { id: bill!.id, discountAmount: totals.discountAmount, discountPercentage: totals.discountPercentage },
            reason: discount.discountReason
          },
          tx
        );
      }

      publishEvent(websocketEvents.billUpdated, bill, "cashier");
      return { ...bill!, billGeneratedSequence: bill!.generationCount };
    });
  }
};
