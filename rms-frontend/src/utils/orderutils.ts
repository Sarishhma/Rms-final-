import type{ MenuItem } from "@/features/menu/types";

export function getTopSellingItems(items: MenuItem[] = [], limit = 7) {
  if (!Array.isArray(items)) return [];

  return [...items]
    .sort((a, b) => (b.orders ?? 0) - (a.orders ?? 0))
    .slice(0, limit);
}