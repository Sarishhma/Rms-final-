
import { useMemo } from "react";
import { getMenuConfig } from "@/config/menuConfig";
import type{  MenuSection } from "@/config/menuConfig";

 
interface UseMenuConfigReturn {
  menuSections: MenuSection[];
  role: string;
}
 

export function useMenuConfig(
  userRole?: string,
  activeOrderCount = 0
): UseMenuConfigReturn {
  const sections = useMemo(() => {
    return getMenuConfig(userRole, activeOrderCount);
  }, [userRole, activeOrderCount]);

  return {
    menuSections: sections,
    role: userRole || "WAITER",
  };
}