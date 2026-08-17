import { useState } from "react";
import { ChevronDown, UtensilsCrossed,ChefHat } from "lucide-react";
import { SetDefaultStationButton } from "./SetDefaultStationButton";

interface RoutingItem {
  menuItemId: string;
  name: string;
  station: { id: string; name: string };
}

interface StationGroup {
  stationId: string;
  stationName: string;
  items: RoutingItem[];
}

const STATION_THEMES = [
  { accent: "bg-orange-500", light: "bg-orange-50", border: "border-orange-200", text: "text-orange-600", chip: "bg-orange-50 text-orange-700 border-orange-200", icon: "text-orange-500" },
  { accent: "bg-orange-600", light: "bg-orange-100/50", border: "border-orange-300", text: "text-orange-700", chip: "bg-orange-100/50 text-orange-700 border-orange-300", icon: "text-orange-600" },
  { accent: "bg-amber-500", light: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", chip: "bg-amber-50 text-amber-700 border-amber-200", icon: "text-amber-500" },
  { accent: "bg-orange-700", light: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", chip: "bg-orange-50 text-orange-700 border-orange-300", icon: "text-orange-700" },
  { accent: "bg-orange-400", light: "bg-orange-50", border: "border-orange-200", text: "text-orange-600", chip: "bg-orange-50 text-orange-600 border-orange-200", icon: "text-orange-400" },
  { accent: "bg-amber-600", light: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", chip: "bg-amber-50 text-amber-700 border-amber-200", icon: "text-amber-600" },
];

const getStationTheme = (stationId: string) => {
  let hash = 0;
  for (let i = 0; i < stationId.length; i++) {
    hash = stationId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return STATION_THEMES[Math.abs(hash) % STATION_THEMES.length];
};

interface KitchenStationRoutingCardsProps {
  groupedByStation: StationGroup[];
  defaultStationId?: string;
  search: string;
}

export const KitchenStationRoutingCards = ({
  groupedByStation,
  defaultStationId,
  search,
}: KitchenStationRoutingCardsProps) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (stationId: string) => {
    setExpanded((prev) => ({ ...prev, [stationId]: !prev[stationId] }));
  };

  if (groupedByStation.length === 0) {
    return (
      <div className="rounded-3xl border border-orange-100 bg-white p-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
          <ChefHat className="h-8 w-8 text-orange-300" />
        </div>
        <p className="text-sm font-medium text-gray-500">
          {search ? `No items match "${search}"` : "No routing configured yet"}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {search ? "Try a different search term" : "Assign menu items to stations to get started"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {groupedByStation.map((group) => {
        const theme = getStationTheme(group.stationId);
        const isOpen = expanded[group.stationId] ?? true;
        const isDefault = group.stationId === defaultStationId;
        const visibleItems = isOpen ? group.items : group.items.slice(0, 6);

        return (
          <div
            key={group.stationId}
            className={`overflow-hidden rounded-2xl border ${isDefault ? "border-orange-300 ring-2 ring-orange-100" : "border-gray-100"} bg-white shadow-sm transition-all hover:shadow-lg`}
          >
            <div className={`${theme.light} border-b ${theme.border} px-5 py-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.accent} shadow-lg`}>
                    <UtensilsCrossed className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{group.stationName}</h3>
                    <p className={`text-xs font-medium ${theme.text}`}>
                      {group.items.length} item{group.items.length !== 1 ? "s" : ""} routed
                    </p>
                  </div>
                </div>

                <SetDefaultStationButton
                  stationId={group.stationId}
                  isDefault={isDefault}
                />
              </div>
            </div>

            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {visibleItems.map((item) => (
                  <span
                    key={item.menuItemId}
                    className={`inline-flex items-center rounded-full border ${theme.chip} px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-orange-100`}
                  >
                    {item.name}
                  </span>
                ))}
              </div>

              {group.items.length > 6 && (
                <button
                  onClick={() => toggleExpand(group.stationId)}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50/50 py-2 text-xs font-semibold text-orange-600 transition-all hover:bg-orange-100 hover:text-orange-700"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                  {isOpen ? "Show less" : `Show ${group.items.length - 6} more items`}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};