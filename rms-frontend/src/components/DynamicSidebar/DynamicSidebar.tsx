import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronRight, X } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import type { MenuSection, NavItem } from "@/config/menuConfig";


interface DynamicSidebarProps {
  sections: MenuSection[];
  isOpen: boolean;
  onClose?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

function DynamicSidebar({
  sections,
  isOpen,
  onClose,
  header,
  footer,
}: DynamicSidebarProps) {
  const location = useLocation();
  const { has } = usePermissions();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    sections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children?.some((child) => child.url === location.pathname)) {
          setExpandedItems((prev) =>
            prev.includes(item.id) ? prev : [...prev, item.id]
          );
        }
      });
    });
  }, [location.pathname, sections]);

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const filterItems = (items: NavItem[]): NavItem[] => {
    return items
      .filter((item) => !item.permission || has(item.permission))
      .map((item) => ({
        ...item,
        children: item.children ? filterItems(item.children) : undefined,
      }));
  };

  const renderItem = (item: NavItem, depth = 0): React.ReactNode => {
    const Icon = item.icon;
    const hasChildren = !!item.children?.length;
    const isExpanded = expandedItems.includes(item.id);

    if (!hasChildren) {
      return item.url ? (
        <NavLink
          key={item.id}
          to={item.url}
          end
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              depth > 0 ? "text-sm" : ""
            } ${
              isActive
                ? "bg-orange-50 text-orange-600 font-medium"
                : "text-slate-600 hover:bg-slate-100 hover:text-orange-600"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                size={18}
                className={isActive ? "text-orange-500" : "text-slate-400"}
              />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    typeof item.badge === "number"
                      ? "bg-orange-500 text-white"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </>
          )}
        </NavLink>
      ) : null;
    }

    return (
      <div key={item.id}>
        <button
          onClick={() => toggleExpand(item.id)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-slate-600 hover:bg-slate-100 hover:text-orange-600"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Icon size={18} className="text-slate-400 flex-shrink-0" />
            <span className="text-sm font-medium truncate">{item.label}</span>
          </div>
          <ChevronRight
            size={16}
            className={`flex-shrink-0 transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
        </button>

        {isExpanded && item.children && (
          <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-slate-200">
            {item.children.map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: filterItems(section.items),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`flex flex-col fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header */}
        {header && (
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
            {header}
            {isOpen && (
              <button
                onClick={onClose}
                className="lg:hidden text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 flex flex-col">
          {visibleSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-[10px] font-bold uppercase tracking-widest px-3 pb-1 text-slate-400">
                {section.title}
              </h3>
              <div className="mt-1 space-y-0.5">
                {section.items.map((item) => renderItem(item))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-slate-100 p-3">{footer}</div>
        )}
      </aside>
    </>
  );
}

export default DynamicSidebar;