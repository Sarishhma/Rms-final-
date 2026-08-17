import { useMemo, useState } from "react";
import { useKitchenStationRouting } from "../hooks/useKitchenStationRouting";

import { AlertCircle } from "lucide-react";
import { KitchenStationRoutingCards } from "../components/KitchenStationRoutingList";
import { KitchenStationRoutingHeader } from "../components/KitchenStationRoutingHeader";

export const AllKitchenRouting = () => {
  const { data, isLoading, isError } = useKitchenStationRouting();
  const [search, setSearch] = useState("");

  const defaultStation = data?.data.defaultStation;
  const items = data?.data.items ?? [];

  const groupedByStation = useMemo(() => {
    const filtered = items.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );

    const groups = new Map<string, { stationId: string; stationName: string; items: typeof items }>();

    for (const item of filtered) {
      const key = item.station.id;
      if (!groups.has(key)) {
        groups.set(key, { stationId: item.station.id, stationName: item.station.name, items: [] });
      }
      groups.get(key)!.items.push(item);
    }

    return Array.from(groups.values()).sort((a, b) => b.items.length - a.items.length);
  }, [items, search]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-orange-100 bg-white p-16">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-orange-400" />
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-orange-500 delay-150" />
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-orange-600 delay-300" />
        </div>
        <p className="text-sm font-medium text-orange-400">Loading station routing...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-3xl border border-orange-200 bg-orange-50 p-8 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-orange-400" />
        <p className="text-sm font-medium text-orange-600">Couldn't load station routing</p>
        <p className="mt-1 text-xs text-orange-400">Try refreshing the page</p>
      </div>
    );
  }

  const totalItems = items.length;
  const totalStations = new Set(items.map((i) => i.station.id)).size;

  return (
    <div className="space-y-6 p-5  bg-white">
      <KitchenStationRoutingHeader
        totalItems={totalItems}
        totalStations={totalStations}
        defaultStationName={defaultStation?.name}
        search={search}
        onSearchChange={setSearch}
      />
      <KitchenStationRoutingCards
        groupedByStation={groupedByStation}
        defaultStationId={defaultStation?.id}
        search={search}
      />
    </div>
  );
};