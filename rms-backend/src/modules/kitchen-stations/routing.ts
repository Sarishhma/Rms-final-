import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { badRequest } from "../../utils/app-error.js";

/** A minimal reference to a kitchen station — id for grouping, name for the KOT snapshot label. */
export type StationRef = { id: string; name: string };

/**
 * The routing-relevant shape of a menu item: its own station override, its
 * subcategory's station, and its category's station. Any tier may be null.
 */
export type RoutableMenuItem = {
  kitchenStation: StationRef | null;
  subcategory: { kitchenStation: StationRef | null } | null;
  category: { kitchenStation: StationRef | null };
};

/** The `select` fragment that produces a {@link RoutableMenuItem}. Reused by KOT generation and routing preview. */
export const routableMenuItemSelect = {
  kitchenStation: { select: { id: true, name: true } },
  subcategory: { select: { kitchenStation: { select: { id: true, name: true } } } },
  category: { select: { kitchenStation: { select: { id: true, name: true } } } },
} satisfies Prisma.MenuItemSelect;

/**
 * Resolve the station an item routes to, most-specific tier wins:
 *   menu item override → subcategory → category → company default.
 *
 * A category rule therefore reaches every item in the category *and its child
 * subcategories* that has no nearer rule; a subcategory rule covers only that
 * subcategory; an item override covers only that item. Non-routed items land on
 * the default station. Pure — no I/O — so it is unit-tested directly.
 */
export const resolveStation = (item: RoutableMenuItem, defaultStation: StationRef): StationRef =>
  item.kitchenStation ??
  item.subcategory?.kitchenStation ??
  item.category.kitchenStation ??
  defaultStation;

/**
 * Load the company's default station. The single-default-per-company invariant
 * is enforced by a partial unique index + transactional set-default, so this is
 * the one authoritative fallback. Missing default = misconfiguration; fail loud
 * rather than silently mis-route.
 */
export const getDefaultStation = async (
  companyId: string,
  tx: Prisma.TransactionClient = prisma
): Promise<StationRef> => {
  const station = await tx.kitchenStation.findFirst({
    where: { companyId, isDefault: true },
    select: { id: true, name: true },
  });
  if (!station) throw badRequest("No default kitchen station configured for this company");
  return station;
};
