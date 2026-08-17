import {
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  TableProperties,
  UtensilsCrossed,
  Users,
  BarChart3,
  Clock,
  Package,
  Grid,
  Plus,
  Truck,
  DollarSign,
  Warehouse,
  Scale3d,
  Factory,
  ChefHat,
  Waypoints,
  CookingPot,
  PackageMinus,
  Boxes,
  Printer,
  History,
  PlayCircle,
  Layers,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  url?: string;
  badge?: string | number;
  permission?: string;
  children?: NavItem[];
}

export interface MenuSection {
  title: string;
  items: NavItem[];
}

export interface MenuConfig {
  main: MenuSection[];
}

/**
 * Role-based menu configurations
 * Add new roles here without modifying components
 */
export const roleMenuConfig: Record<string, MenuSection[]> = {
  ADMIN: [
    {
      title: "MAIN",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          url: "/dashboard",
        },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        {
          id: "orders",
          label: "Orders",
          icon: ShoppingBag,
          permission: "order:read",
          children: [
            {
              id: "all-orders",
              label: "All Orders",
              icon: ShoppingBag,
              url: "/admin/orders",
              permission: "order:read",
            },
            {
              id: "pos-orders",
              label: "POS Orders",
              icon: ShoppingBag,
              url: "/tables",
              permission: "order:read",
            },
            {
              id: "new-order",
              label: "New Order",
              icon: Plus,
              url: "/new-order",
              permission: "order:write",
            },
            {
              id: "active-orders",
              label: "Active Orders",
              icon: Clock,
              url: "/active-orders",
              permission: "order:read",
            },
          ],
        },
        {
          id: "billing",
          label: "Billing",
          icon: Receipt,
          permission: "bill:read",
          children: [
            {
              id: "bills-list",
              label: "Bills",
              icon: Receipt,
              url: "/billing",
              permission: "bill:read",
            },
          ],
        },
        {
          id: "tables",
          label: "Tables",
          icon: TableProperties,
          permission: "table:read",
          children: [
            {
              id: "manage-tables",
              label: "Manage Tables",
              icon: TableProperties,
              url: "/admin/table",
              permission: "table:read",
            },
          ],
        },
      ],
    },
    {
      title: "MANAGEMENT",
      items: [
        {
          id: "menu",
          label: "Menu",
          icon: UtensilsCrossed,
          permission: "menu:read",
          children: [
            {
              id: "menu-items",
              label: "All Items",
              icon: UtensilsCrossed,
              url: "/admin/menu",
              permission: "menu:read",
            },
            {
              id: "add-item",
              label: "Add Item",
              icon: Plus,
              url: "/admin/menu/create",
              permission: "menu:write",
            },
          ],
        },
        {
          id: "staff",
          label: "Staff",
          icon: Users,
          permission: "user:manage",
          children: [
            {
              id: "all-staff",
              label: "All Staff",
              icon: Users,
              url: "/admin/staff",
              permission: "user:manage",
            },
            {
              id: "create-staff",
              label: "Create Staff",
              icon: Plus,
              url: "/admin/create",
              permission: "user:manage",
            },
          ],
        },
        {
          id: "stock",
          label: "Stock",
          icon: Package,
          permission: "stock:read",
          children: [
            {
              id: "all-stock",
              label: "All Stock",
              icon: Package,
              url: "/admin/stock",
              permission: "stock:read",
            },
            {
              id: "open-stock",
              label: "Open Stock",
              icon: Grid,
              url: "/admin/openStock",
              permission: "stock:read",
            },
          ],
        },
        {
          id: "inventory",
          label: "Inventory",
          icon: Warehouse,
          permission: "inventory:read",
          children: [
            {
              id: "inventory-unit",
              label: "Inventory Units",
              icon: Scale3d,
              url: "/admin/inventoryUnits",
            },
            {
              id: "inventory-supplier",
              label: "Inventory Suppliers",
              icon: Factory,
              url: "/admin/inventorySupplier",
            },

            {
              id: "inventory-item",
              label: "Inventory Items",
              icon: Boxes,
              url: "/admin/inventoryitems",
            },
            {
              id: "inventory-purchase",
              label: "Inventory Purchases",
              icon: ShoppingBag,
              url: "/admin/inventory/purchases",
            },
            {
              id: "inventory-stockout",
              label: "Inventory Stock-Outs",
              icon: PackageMinus,
              url: "/admin/inventory/stock-outs",
            },
              {
              id: "inventory-stockbalances",
              label: "Inventory Stock-balances",
              icon: Layers,
              url: "/admin/inventory/stock-balances",
            },
          ],
        },
        {
          id: "customers",
          label: "customers",
          icon: Users,
          permission: "customer:read",
          children: [
            {
              id: "Allcustomers",
              label: "All customers",
              icon: Users,
              url: "/admin/customers",
              permission: "customer:read",
            },
          ],
        },
          {
          id: "Refunds",
          label: "Refunds",
          icon: Package,
          permission: "refund:read",
          children: [
            {
              id: "all-refunds",
              label: "All Refunds",
              icon: Package,
              url: "/admin/refunds",
              permission: "stock:read",
            },
            // {
            //   id: "open-stock",
            //   label: "Open Stock",
            //   icon: Grid,
            //   url: "/admin/openStock",
            //   permission: "stock:read",
            // },
          ],
        },
        {
          id: "shifts ",
          label: "Shifts",
          icon: Clock,
          permission: "shift:read",
          children: [
            {
              id: "All shifts",
              label: "All Shifts",
              icon: History,
              url: "/admin/shifts",
              permission: "shift:read",
            },
             {
              id: "Currentshifts",
              label: "Current Shifts",
              icon: PlayCircle,
              url: "/admin/shifts/currentShifts",
              permission: "shift:write",
            },
          ],
        },
        {
          id: "Kot",
          label: "Kot",
          icon: ChefHat,
          permission: "kot:read",
          children: [
            {
              id: "Kotstation",
              label: "Kot-station",
              icon: Users,
              url: "/admin/kotstation",
              permission: "kot:read",
            },
            {
              id: "KotStationRouting",
              label: "Kot-station-Routing",
              icon: Waypoints,
              url: "/admin/kotstationrouting",
              permission: "kot:read",
            },
            {
              id: "station-manager",
              label: "Station Manager",
              icon: CookingPot,
              url: "/admin/stationManager",
            },
          ],
        },
      ],
    },
    {
      title: "ANALYTICS",
      items: [
        {
          id: "reports",
          label: "Reports",
          icon: BarChart3,
          permission: "report:read",
          children: [
            {
              id: "sales-reports",
              label: "Sales Reports",
              icon: BarChart3,
              url: "/admin/reports/sales",
              permission: "report:read",
            },
            {
              id: "order-reports",
              label: "Order Reports",
              icon: BarChart3,
              url: "/admin/reports/orders",
              permission: "report:read",
            },
            {
              id: "item-reports",
              label: "Item Reports",
              icon: BarChart3,
              url: "/admin/reports/items",
              permission: "report:read",
            },
            {
              id: "staff-reports",
              label: "Staff Reports",
              icon: BarChart3,
              url: "/admin/reports/staff",
              permission: "report:read",
            },
            {
              id: "payment-reports",
              label: "Payment Reports",
              icon: BarChart3,
              url: "/admin/reports/payments",
              permission: "report:read",
            },
          ],
        },
        {
          id: "audit",
          label: "Activity Logs",
          icon: Clock,
          permission: "audit:read",
          children: [
            {
              id: "logs",
              label: "Activity Logs",
              icon: Clock,
              url: "/admin/audit-log",
              permission: "audit:read",
            },
          ],
        },
      ],
    },
    {
      title: "setting",
      items: [
        {
          id: "printer",
          label: "printer",
          icon: Printer,
          url: "/admin/allprinter",
        },
      ],
    },
  ],

  CASHIER: [
    {
      title: "MAIN",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          url: "/admin/orders",
        },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        {
          id: "tables",
          label: "Tables",
          icon: TableProperties,
          url: "/tables",
          permission: "table:read",
        },

        {
          id: "new-order",
          label: "New Order",
          icon: Plus,
          url: "/new-order",
          permission: "order:write",
        },
        {
          id: "active-orders",
          label: "Active Orders",
          icon: Clock,
          url: "/active-orders",
          permission: "order:read",
          badge: "new",
        },
        {
          id: "billing",
          label: "Billing",
          icon: Receipt,
          url: "/billing",
          permission: "bill:read",
        },
      ],
    },
  ],

  WAITER: [
    {
      title: "SERVICE",
      items: [
        {
          id: "tables",
          label: "Tables",
          icon: TableProperties,
          url: "/tables",
          permission: "table:read",
        },
        {
          id: "new-order",
          label: "New Order",
          icon: Plus,
          url: "/new-order",
          permission: "order:write",
        },
        {
          id: "active-orders",
          label: "Active Orders",
          icon: Clock,
          url: "/active-orders",
          permission: "order:read",
          badge: "new",
        },
      ],
    },
  ],

  CASHIER_WAITER: [
    {
      title: "SERVICE",
      items: [
        {
          id: "tables",
          label: "Tables",
          icon: TableProperties,
          url: "/tables",
          permission: "table:read",
        },
        {
          id: "new-order",
          label: "New Order",
          icon: Plus,
          url: "/new-order",
          permission: "order:write",
        },
        {
          id: "active-orders",
          label: "Active Orders",
          icon: Clock,
          url: "/active-orders",
          permission: "order:read",
        },
      ],
    },
    {
      title: "FINANCE",
      items: [
        {
          id: "billing",
          label: "Billing",
          icon: Receipt,
          url: "/billing",
          permission: "bill:read",
        },
        {
          id: "reports",
          label: "Reports",
          icon: BarChart3,
          url: "/reports",
          permission: "report:read",
        },
      ],
    },
  ],

  KITCHEN: [
    {
      title: "ORDERS",
      items: [
        {
          id: "active-orders",
          label: "Active Orders",
          icon: ShoppingBag,
          url: "/active-orders",
          permission: "order:read",
        },
      ],
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // ADD NEW ROLES HERE (NO COMPONENT CHANGES NEEDED)
  // ─────────────────────────────────────────────────────────────

  DELIVERY: [
    {
      title: "OPERATIONS",
      items: [
        {
          id: "assigned-orders",
          label: "Assigned Orders",
          icon: ShoppingBag,
          url: "/delivery/orders",
          permission: "order:read",
        },
        {
          id: "in-progress",
          label: "In Progress",
          icon: Truck,
          url: "/delivery/in-progress",
          permission: "order:read",
        },
        {
          id: "completed",
          label: "Completed",
          icon: Clock,
          url: "/delivery/completed",
          permission: "order:read",
        },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        {
          id: "earnings",
          label: "Earnings",
          icon: DollarSign,
          url: "/delivery/earnings",
          permission: "report:read",
        },
      ],
    },
  ],

  MANAGER: [
    {
      title: "MAIN",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          url: "/dashboard",
        },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        {
          id: "orders",
          label: "Orders",
          icon: ShoppingBag,
          url: "/admin/orders",
          permission: "order:read",
        },
        {
          id: "billing",
          label: "Billing",
          icon: Receipt,
          url: "/admin/billing",
          permission: "bill:read",
        },
      ],
    },
    {
      title: "MANAGEMENT",
      items: [
        {
          id: "staff",
          label: "Staff",
          icon: Users,
          url: "/admin/staff",
          permission: "user:manage",
        },
        {
          id: "menu",
          label: "Menu",
          icon: UtensilsCrossed,
          url: "/admin/menu",
          permission: "menu:read",
        },
      ],
    },
    {
      title: "ANALYTICS",
      items: [
        {
          id: "reports",
          label: "Reports",
          icon: BarChart3,
          url: "/admin/reports/sales",
          permission: "report:read",
        },
      ],
    },
  ],
};

export function getMenuConfig(
  role?: string,
  activeOrderCount: number = 0,
): MenuSection[] {
  const selectedRole = !role || !roleMenuConfig[role] ? "WAITER" : role;

  if (!role || !roleMenuConfig[role]) {
    console.warn(
      `Menu config not found for role: ${role}, using WAITER as fallback`,
    );
  }

  const config = roleMenuConfig[selectedRole];

  const updateBadges = (items: NavItem[]): NavItem[] =>
    items.map((item) => ({
      ...item,
      badge:
        item.id === "active-orders"
          ? activeOrderCount > 0
            ? activeOrderCount
            : undefined
          : item.badge,
      children: item.children ? updateBadges(item.children) : undefined,
    }));

  return config.map((section) => ({
    ...section,
    items: updateBadges(section.items),
  }));
}

export function getAllRoles(): string[] {
  return Object.keys(roleMenuConfig);
}
