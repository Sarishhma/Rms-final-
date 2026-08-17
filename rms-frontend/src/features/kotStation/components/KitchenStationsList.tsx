import { useEffect, useState } from "react";
import { useKitchenStations } from "../hooks/useKitchenStations";


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "../hooks/useDebounce";
import { 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Filter,
  ChefHat,
  AlertCircle,
  Star,
  Printer,
  Hash,
  CheckCircle2,
  XCircle,
  GripVertical,
  Users,
  Settings,
} from "lucide-react";
import type { KitchenStation } from "../types/kot.types";
import { ManageKitchenStationModal } from "./ManageKitchenModal";

export const KitchenStationsList = () => {
  const [page,setPage]=useState(1)
  const limit=20;
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState<string>("all");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [manageStation, setManageStation] = useState<KitchenStation | null>(null); // State for managing station
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isError } = useKitchenStations({
    page,
    limit,
    search: debouncedSearch || undefined,
    isActive: isActive === "all" ? undefined : isActive === "true",
  });

  const stations = data?.data ?? [];
  const meta =data?.meta;

  const sortedStations = [...stations].sort((a, b) =>
    sortDirection === "asc"
      ? a.sortOrder - b.sortOrder
      : b.sortOrder - a.sortOrder
  );

  const toggleSort = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };
  useEffect(() => {
  setPage(1);
}, [debouncedSearch, isActive]);

  return (
    <>
      <div className="space-y-5">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search stations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-xl border-gray-200 pl-10 text-sm focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <Select value={isActive} onValueChange={setIsActive}>
            <SelectTrigger className="h-10 rounded-xl border-gray-200 text-sm sm:w-40">
              <Filter className="mr-2 h-3.5 w-3.5 text-gray-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-12">
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
                <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500 delay-150" />
                <div className="h-2 w-2 animate-pulse rounded-full bg-orange-600 delay-300" />
              </div>
              <p className="text-sm text-gray-400">Loading stations...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
            <p className="text-sm font-medium text-red-600">Failed to load stations</p>
            <p className="mt-1 text-xs text-red-400">Try refreshing the page</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-100 bg-gray-50/50 hover:bg-gray-50/50">
                  <TableHead className="py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-2">
                      <ChefHat className="h-3.5 w-3.5" />
                      Station Name
                    </div>
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-2">
                      <Printer className="h-3.5 w-3.5" />
                      Printer ID
                    </div>
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Default
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" />
                      Assigned Staff
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 select-none hover:text-orange-600 transition-colors"
                    onClick={toggleSort}
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="h-3.5 w-3.5" />
                      <span>Sort Order</span>
                      <span className="ml-1 rounded-md bg-gray-100 p-0.5">
                        {sortDirection === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                      </span>
                    </div>
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="flex flex-col items-center py-16">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50">
                          <ChefHat className="h-6 w-6 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">No stations found</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {search || isActive !== "all"
                            ? "Try adjusting your filters"
                            : "Add your first kitchen station"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedStations.map((station) => (
                    <TableRow 
                      key={station.id} 
                      className="border-b border-gray-50 transition-colors hover:bg-orange-50/30"
                    >
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-gray-300" />
                          <span className="font-semibold text-gray-900">
                            {station.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span className="text-sm text-gray-600 font-mono">
                          {station.printerId ?? (
                            <span className="text-gray-300">—</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5">
                        {station.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5">
                        {station.isDefault ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                            <Star className="h-3 w-3 fill-orange-500 text-orange-500" />
                            Default
                          </span>
                        ) : (
                          <span className="text-sm text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5">
                        {station.assignedStaff && station.assignedStaff.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {station.assignedStaff.slice(0, 2).map((staff) => (
                              <span
                                key={staff.id}
                                title={staff.email}
                                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                              >
                                {staff.name}
                              </span>
                            ))}
                            {station.assignedStaff.length > 2 && (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                +{station.assignedStaff.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span className="inline-flex items-center justify-center rounded-lg bg-gray-50 px-3 py-1 text-sm font-mono font-medium text-gray-600">
                          {station.sortOrder}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5 text-right">
                        <button
                          onClick={() => setManageStation(station)}
                          className="px-4 py-1.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition duration-150 active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Settings size={12} />
                          Manage
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
        )}
      </div>
      <div className="mt-6 flex items-center justify-center rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
  <div className="flex items-center gap-4">
    <button
      disabled={page === 1}
      onClick={() => setPage((prev) => prev - 1)}
      className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-40"
    >
      ← Previous
    </button>

    <div className="rounded-xl bg-orange-100 px-5 py-2 text-sm font-semibold text-orange-700">
      Page {meta?.page} of {meta?.totalPages}
    </div>

    <button
      disabled={page === meta?.totalPages}
      onClick={() => setPage((prev) => prev + 1)}
      className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-40"
    >
      Next →
    </button>
  </div>
</div>

      {/* Manage Station Modal */}
      {manageStation && (
        <ManageKitchenStationModal
          station={manageStation}
          onClose={() => setManageStation(null)}
        />
      )}
    </>
  );
};