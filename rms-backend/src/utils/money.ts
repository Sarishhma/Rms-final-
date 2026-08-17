import { Prisma } from "@prisma/client";
import { z } from "zod";
import { badRequest } from "./app-error.js";

// Quick wrapper to create Decimals
export const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

// Validate non-negative Decimals
export const assertNonNegative = (v: Prisma.Decimal | number, field: string) => {
  const dec = Prisma.Decimal.isDecimal(v) ? v : D(v);
  if (!dec.isFinite() || dec.isNegative()) {
    throw badRequest(`${field} must be a non-negative number`);
  }
};

/**
 * Zod schema for incoming money fields. 
 * Safely accepts number or string from the frontend and transforms it into Prisma.Decimal for the DB.
 */
export const moneySchema = z
  .union([z.number(), z.string()])
  .refine((val) => !isNaN(Number(val)), "Invalid number")
  .transform((val) => D(val))
  .refine((dec) => dec.isPositive() || dec.isZero(), "Must be non-negative");

/**
 * Like moneySchema but rejects zero — for amounts that must move money
 * (payments, refunds). Keeps moneySchema permissive for fields where 0 is
 * valid (discounts, opening cash, prices).
 */
// NB: Prisma.Decimal(0).isPositive() is `true` (decimal.js signs zero as
// positive), so use a strict greater-than-zero comparison here.
export const positiveMoneySchema = moneySchema.refine(
  (dec) => dec.gt(0),
  "Must be greater than zero",
);

export const percentageOf = (base: Prisma.Decimal | number, rate: number | Prisma.Decimal) => {
  const b = Prisma.Decimal.isDecimal(base) ? base : D(base);
  const r = Prisma.Decimal.isDecimal(rate) ? rate : D(rate);
  return b.times(r).toDecimalPlaces(0).toNumber();
};

export const applyBps = (base: Prisma.Decimal | number, bps: number | Prisma.Decimal) => {
  const b = Prisma.Decimal.isDecimal(base) ? base : D(base);
  const r = Prisma.Decimal.isDecimal(bps) ? bps : D(bps);
  return b.times(r).div(10000).toDecimalPlaces(0).toNumber();
};
