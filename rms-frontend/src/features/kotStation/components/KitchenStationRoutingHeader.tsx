import { Soup, Layers, Star, Sparkles, Search, ChevronRight, TrendingUp, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface KitchenStationRoutingHeaderProps {
  totalItems: number;
  totalStations: number;
  defaultStationName?: string;
  search: string;
  onSearchChange: (value: string) => void;
}

export const KitchenStationRoutingHeader = ({
  totalItems,
  totalStations,
  defaultStationName,
  search,
  onSearchChange,
}: KitchenStationRoutingHeaderProps) => {
  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Kitchen Stations
            </h2>
            <p className="mt-0.5 text-sm font-medium text-gray-500">
              Menu item routing overview
            </p>
          </div>
        </div>

     
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Menu Items Card */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-orange-100">
          <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-orange-50 opacity-50 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 shadow-inner group-hover:shadow-md transition-shadow">
              <Soup className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Menu Items
              </p>
              <p className="mt-1 text-3xl font-black text-gray-900 tracking-tight">
                {totalItems}
              </p>
              <div className="mt-1 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                <span className="text-[10px] font-medium text-gray-400">Total menu items</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Stations Card */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-orange-100">
          <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-orange-50 opacity-50 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 shadow-inner group-hover:shadow-md transition-shadow">
              <Layers className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Active Stations
              </p>
              <p className="mt-1 text-3xl font-black text-gray-900 tracking-tight">
                {totalStations}
              </p>
              <div className="mt-1 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                <span className="text-[10px] font-medium text-gray-400">Stations in use</span>
              </div>
            </div>
          </div>
        </div>

        {/* Default Station Card - Highlighted */}
        <div className="group relative overflow-hidden rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-5 shadow-md transition-all hover:shadow-lg hover:border-orange-300">
          <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-orange-200/50 group-hover:scale-150 transition-transform duration-500" />
          <div className="absolute -left-3 -bottom-3 h-10 w-10 rounded-full bg-amber-200/30 group-hover:scale-150 transition-transform duration-500 delay-100" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-400 shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/40 transition-shadow">
              <Star className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-orange-300">
                Default Station
              </p>
              <p className="mt-1 text-xl font-black text-orange-400 tracking-tight truncate">
                {defaultStationName ?? "—"}
              </p>
              <div className="mt-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-orange-400" />
                <span className="text-[10px] font-semibold text-orange-400">Primary routing</span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-orange-300 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Search bar with enhancements */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className="h-4 w-4 text-orange-400" />
        </div>
        <Input
          placeholder="Search menu items by name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-14 rounded-2xl border-gray-200 bg-white pl-12 pr-12 text-sm font-medium shadow-sm transition-all placeholder:text-gray-400 hover:border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
        />
        {search ? (
          <button
            onClick={() => onSearchChange("")}
            className="absolute inset-y-0 right-0 flex items-center pr-4 group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-600 transition-all hover:bg-orange-200 hover:scale-110">
              <X className="h-3.5 w-3.5" />
            </div>
          </button>
        ) : (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
          
          </div>
        )}
        
        {/* Search active indicator */}
        {search && (
          <div className="absolute -bottom-2 left-4 right-4 h-1 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 shadow-sm" />
        )}
      </div>
    </div>
  );
};