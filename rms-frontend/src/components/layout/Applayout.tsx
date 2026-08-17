import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuthMe } from "@/features/auth/hook/useAuthMe";
import { useMenuConfig } from "@/hooks/useMenuConfig";
import { isAdminRole } from "@/utils/roleConfig";
import DynamicSidebar from "@/components/DynamicSidebar/DynamicSidebar";
import AdminNavbar from "@/components/layout/Navbar";
import { useSocketSync } from "@/providers/useSocketSync";
import { useActiveOrders } from "@/features/orders";

export default function AppLayout() {
  useSocketSync(); // ← this one line activates all real-time updates
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: authMe } = useAuthMe();
  const role: string = authMe?.data?.role ?? "";
  const isAdmin = isAdminRole(role);
  const { activeOrders } = useActiveOrders();

  const activeOrderCount = activeOrders?.()?.length ?? 0;
  const { menuSections } = useMenuConfig(role, activeOrderCount);


  const header = (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-orange-200">
        {authMe?.data?.company?.name?.charAt(0)?.toUpperCase() ?? "🍴"}
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-bold text-slate-800 text-sm">
          {authMe?.data?.company?.name ?? "Mealuxe"}
        </span>
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
          {isAdmin ? "Admin Panel" : "POS"}
        </span>
      </div>
    </div>
  );

  const footer = (
    <p className="text-[10px] text-slate-400 font-medium">Mealuxe RMS · v1.0</p>
  );

  return (
    // ✅ THIS WAS MISSING
    <div className="flex h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <DynamicSidebar
          sections={menuSections}
          isOpen={true}
          onClose={() => setSidebarOpen(false)}
          header={header}
          footer={footer}
        />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <DynamicSidebar
            sections={menuSections}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            header={header}
            footer={footer}
          />
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-col flex-1 lg:ml-72 min-w-0">
        <AdminNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
