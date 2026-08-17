import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Search,
  ChevronRight,
  ChevronDown,
  Save,
  RotateCcw,
  Folder,
  FolderOpen,
  UtensilsCrossed,
  Tag,
  Layers,
  Circle,
  Info,
  Loader2,
  Lock,
} from "lucide-react";
import { useKitchenStations } from "@/features/kotStation/hooks/useKitchenStations";
import { useCategories } from "@/features/menu/hooks/useCategories";
import {
  useStationAssignments,
  useSaveStationAssignments,
  useCatalogMenuItems,
} from "../hooks/useStationAssignments";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export default function StationAssignmentManager() {
  const [searchParams, setSearchParams] = useSearchParams();
  const stationIdParam = searchParams.get("stationId");

  const [activeStationId, setActiveStationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [checkedCategoryIds, setCheckedCategoryIds] = useState<string[]>([]);
  const [checkedSubcategoryIds, setCheckedSubcategoryIds] = useState<string[]>(
    [],
  );
  const [checkedMenuItemIds, setCheckedMenuItemIds] = useState<string[]>([]);

  const [userExpandedFolders, setUserExpandedFolders] = useState<
    Record<string, boolean>
  >({});

  // ── 1. Stations ────────────────────────────────────────────────────────────
  const { data: stationsData, isLoading: stationsLoading } =
    useKitchenStations();
  const stations = stationsData?.data ?? [];
  const navigate = useNavigate();

  useEffect(() => {
    if (stationsLoading || stations.length === 0) return;

    if (stationIdParam) {
      const exists = stations.some((s) => s.id === stationIdParam);
      if (exists) {
        setActiveStationId(stationIdParam);
        return;
      }
    }

    const defaultStation = stations.find((s) => s.isActive) || stations[0];
    if (defaultStation) {
      setActiveStationId(defaultStation.id);
      setSearchParams({ stationId: defaultStation.id });
    }
  }, [stations, stationsLoading, stationIdParam]);

  const handleSelectStation = (id: string) => {
    setActiveStationId(id);
    setSearchParams({ stationId: id });
    setSearchQuery("");
    setUserExpandedFolders({});
  };

  // ── 2. Assignments ─────────────────────────────────────────────────────────
  const {
    data: assignmentsData,
    isLoading: assignmentsLoading,
    isError: assignmentsError,
  } = useStationAssignments(activeStationId);

  useEffect(() => {
    if (assignmentsData?.data) {
      setCheckedCategoryIds(assignmentsData.data.categories.map((c) => c.id));
      setCheckedSubcategoryIds(
        assignmentsData.data.subcategories.map((s) => s.id),
      );
      setCheckedMenuItemIds(assignmentsData.data.menuItems.map((m) => m.id));
    } else {
      setCheckedCategoryIds([]);
      setCheckedSubcategoryIds([]);
      setCheckedMenuItemIds([]);
    }
  }, [assignmentsData]);

  // ── 3. Catalog ─────────────────────────────────────────────────────────────
  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();

  //fetching

  const { data: menuItemsData, isLoading: itemsLoading } =
    useCatalogMenuItems();
  const menuItems = menuItemsData ?? [];

  const catalogLoading = categoriesLoading || itemsLoading;

  const allSubcategories = useMemo(() => {
    return categories.flatMap((cat) =>
      (cat.subcategories ?? []).map((sub) => ({
        ...sub,
        parentCategoryName: cat.name,
      })),
    );
  }, [categories]);

  const groupedMenuItems = useMemo(() => {
    const groups: Record<
      string,
      {
        subcategories: Record<string, typeof menuItems>;
        uncategorized: typeof menuItems;
      }
    > = {};

    menuItems.forEach((item) => {
      if (
        searchQuery &&
        !item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return;

      if (!groups[item.categoryId]) {
        groups[item.categoryId] = { subcategories: {}, uncategorized: [] };
      }

      if (item.subcategoryId) {
        if (!groups[item.categoryId].subcategories[item.subcategoryId]) {
          groups[item.categoryId].subcategories[item.subcategoryId] = [];
        }
        groups[item.categoryId].subcategories[item.subcategoryId].push(item);
      } else {
        groups[item.categoryId].uncategorized.push(item);
      }
    });

    return groups;
  }, [menuItems, searchQuery]);

  // ── 5. Expand/collapse ─────────────────────────────────────────────────────
  const expandedFolders = useMemo(() => {
    if (!searchQuery) return userExpandedFolders;

    const autoExpanded: Record<string, boolean> = {};

    menuItems.forEach((item) => {
      if (item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        autoExpanded[item.categoryId] = true;
        if (item.subcategoryId) {
          autoExpanded[`${item.categoryId}-${item.subcategoryId}`] = true;
        } else {
          autoExpanded[`${item.categoryId}-uncat`] = true;
        }
      }
    });

    categories.forEach((cat) => {
      if (cat.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        autoExpanded[cat.id] = true;
      }
    });

    return autoExpanded;
  }, [searchQuery, userExpandedFolders, categories, menuItems]);

  const toggleFolder = (key: string) => {
    setUserExpandedFolders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── 6. Checkbox toggles ────────────────────────────────────────────────────

  // ── Category Toggle with Cleanup ──────────────────────────────────────────
  const handleCategoryToggle = (categoryId: string) => {
    const isCurrentlyChecked = checkedCategoryIds.includes(categoryId);
    const willBeChecked = !isCurrentlyChecked;

    // Toggle the category
    setCheckedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );

    // 🧹 CLEANUP: If we just CHECKED the category, remove any explicit items under it
    if (willBeChecked) {
      const itemsToRemove = menuItems
        .filter((item) => item.categoryId === categoryId)
        .map((item) => item.id);

      const overlappingItems = checkedMenuItemIds.filter((id) =>
        itemsToRemove.includes(id),
      );

      if (overlappingItems.length > 0) {
        setCheckedMenuItemIds((prev) =>
          prev.filter((id) => !overlappingItems.includes(id)),
        );
        const catName =
          categories.find((c) => c.id === categoryId)?.name || "Category";
        toast.success(
          `Removed ${overlappingItems.length} explicit override${
            overlappingItems.length > 1 ? "s" : ""
          } under "${catName}" because the whole category is now assigned.`,
        );
      }
    }
  };

  // ── Subcategory Toggle with Cleanup ───────────────────────────────────────
  const handleSubcategoryToggle = (subcategoryId: string) => {
    const isCurrentlyChecked = checkedSubcategoryIds.includes(subcategoryId);
    const willBeChecked = !isCurrentlyChecked;

    setCheckedSubcategoryIds((prev) =>
      prev.includes(subcategoryId)
        ? prev.filter((id) => id !== subcategoryId)
        : [...prev, subcategoryId],
    );

    if (willBeChecked) {
      const itemsToRemove = menuItems
        .filter((item) => item.subcategoryId === subcategoryId)
        .map((item) => item.id);

      const overlappingItems = checkedMenuItemIds.filter((id) =>
        itemsToRemove.includes(id),
      );

      if (overlappingItems.length > 0) {
        setCheckedMenuItemIds((prev) =>
          prev.filter((id) => !overlappingItems.includes(id)),
        );
        const subName =
          allSubcategories.find((s) => s.id === subcategoryId)?.name ||
          "Subcategory";
        toast.success(
          `Removed ${overlappingItems.length} explicit override${
            overlappingItems.length > 1 ? "s" : ""
          } under "${subName}" because the whole subcategory is now assigned.`,
        );
      }
    }
  };

  const toggleCheckbox = (
    id: string,
    setList: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setList((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // ── 7. Save / Discard ──────────────────────────────────────────────────────
  const { mutate: saveAssignments, isPending: isSaving } =
    useSaveStationAssignments();

  const handleSave = () => {
    if (!activeStationId) return;

    saveAssignments(
      {
        stationId: activeStationId,
        payload: {
          categoryIds: checkedCategoryIds,
          subcategoryIds: checkedSubcategoryIds,
          menuItemIds: checkedMenuItemIds,
        },
      },
      {
        onSuccess: () => {
          toast.success("Station assignments updated successfully");
          navigate("/admin/kotstationrouting");
        },

        onError: (err: any) => {
          const errMsg =
            err?.response?.data?.message ||
            err?.message ||
            "Failed to update assignments";
          toast.error(errMsg);
        },
      },
    );
  };

  const handleDiscard = () => {
    if (assignmentsData?.data) {
      setCheckedCategoryIds(assignmentsData.data.categories.map((c) => c.id));
      setCheckedSubcategoryIds(
        assignmentsData.data.subcategories.map((s) => s.id),
      );
      setCheckedMenuItemIds(assignmentsData.data.menuItems.map((m) => m.id));
      toast.success("Changes discarded");
    }
  };

  // ── 8. Helpers ─────────────────────────────────────────────────────────────
  const getItemStatus = (item: any) => {
    if (checkedMenuItemIds.includes(item.id)) return "explicit";
    if (
      item.subcategoryId &&
      checkedSubcategoryIds.includes(item.subcategoryId)
    )
      return "covered_by_sub";
    if (checkedCategoryIds.includes(item.categoryId)) return "covered_by_cat";
    return "none";
  };

  const filteredCategories = useMemo(
    () =>
      categories.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [categories, searchQuery],
  );

  const filteredSubcategories = useMemo(
    () =>
      allSubcategories.filter(
        (sub) =>
          sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sub.parentCategoryName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      ),
    [allSubcategories, searchQuery],
  );

  const getCategoryCoverageCount = (categoryId: string) => {
    return menuItems.filter(
      (item) =>
        item.categoryId === categoryId &&
        !checkedMenuItemIds.includes(item.id) &&
        !(
          item.subcategoryId &&
          checkedSubcategoryIds.includes(item.subcategoryId)
        ),
    ).length;
  };

  const selectedStation = stations.find((s) => s.id === activeStationId);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6 min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Station Assignment Manager
        </h1>
        <p className="text-sm text-slate-500">
          Route menu items, categories, or subcategories to specific kitchen
          stations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
        <div className="col-span-1 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col space-y-3 sticky top-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Kitchen Stations
          </h2>

          {stationsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 bg-slate-100 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : stations.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No kitchen stations found.
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[600px] pr-1">
              {stations.map((station) => {
                const isActive = station.id === activeStationId;
                return (
                  <button
                    key={station.id}
                    onClick={() => handleSelectStation(station.id)}
                    className={`w-full text-left rounded-2xl p-3.5 transition-all duration-150 border cursor-pointer ${
                      isActive
                        ? "bg-orange-50/70 border-orange-200 text-orange-700"
                        : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50/80 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm font-semibold truncate ${isActive ? "text-orange-700" : "text-slate-800"}`}
                      >
                        {station.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* unsaved dot */}
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        )}
                        <span
                          className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                            station.isActive
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {station.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    {/* assignment summary for active station */}
                    {isActive && (
                      <p className="text-xs text-orange-500 mt-1 font-medium">
                        {checkedCategoryIds.length} cats ·{" "}
                        {checkedSubcategoryIds.length} subs ·{" "}
                        {checkedMenuItemIds.length} items
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right Panel ──────────────────────────────────────────────────── */}
        <div className="col-span-1 md:col-span-3 flex flex-col gap-4">
          {!activeStationId ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-16 shadow-sm flex flex-col items-center justify-center text-center">
              <UtensilsCrossed size={48} className="text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-slate-500">
                Select a kitchen station to configure assignments.
              </p>
            </div>
          ) : assignmentsLoading || catalogLoading ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 animate-pulse">
              <div className="h-8 w-64 bg-slate-200 rounded-xl" />
              <div className="h-4 w-48 bg-slate-100 rounded-xl" />
              <div className="h-32 bg-slate-100 rounded-2xl" />
              <div className="h-32 bg-slate-100 rounded-2xl" />
              <div className="h-48 bg-slate-100 rounded-2xl" />
            </div>
          ) : assignmentsError ? (
            <div className="bg-white border border-red-200 rounded-3xl p-10 shadow-sm flex items-center justify-center text-red-500 text-sm font-medium">
              Failed to load assignments for this station.
            </div>
          ) : (
            <>
              {/* ── Main panel card ─────────────────────────────────────── */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                {/* Panel header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
                      {selectedStation?.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      <span className="font-semibold text-orange-500">
                        Precedence:
                      </span>{" "}
                      Item override → Subcategory → Category → Default
                    </p>
                  </div>

                  <div className="relative w-full sm:max-w-xs">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                      <Search size={15} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search catalog..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-orange-500 transition text-sm text-slate-700"
                    />
                  </div>
                </div>

                {/* Accordion sections */}
                <Accordion
                  type="multiple"
                  defaultValue={["categories", "subcategories", "menu-items"]}
                  className="space-y-3"
                >
                  {/* CATEGORIES */}
                  <AccordionItem
                    value="categories"
                    className="border border-slate-150 rounded-2xl px-5 bg-white shadow-sm"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-2">
                        <Layers
                          size={16}
                          className="text-orange-500 shrink-0"
                        />
                        <span className="font-bold text-slate-800 text-sm">
                          Categories
                        </span>
                        <span className="text-xs text-slate-400 font-normal">
                          ({checkedCategoryIds.length} of {categories.length}{" "}
                          assigned)
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 pt-1">
                      {filteredCategories.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          No categories matching search.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {filteredCategories.map((cat) => {
                            const isChecked = checkedCategoryIds.includes(
                              cat.id,
                            );
                            const totalItems = menuItems.filter(
                              (i) => i.categoryId === cat.id,
                            ).length;
                            const coverage = getCategoryCoverageCount(cat.id);

                            return (
                              <label
                                key={cat.id}
                                className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition select-none text-sm ${
                                  isChecked
                                    ? "bg-orange-50/60 border-orange-200"
                                    : "border-slate-100 hover:bg-slate-50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleCategoryToggle(cat.id)}
                                  className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer mt-0.5"
                                />
                                <div className="flex flex-col min-w-0">
                                  <span className="font-semibold text-slate-800 truncate">
                                    {cat.name}
                                  </span>
                                  <span className="text-xs text-slate-400 mt-0.5">
                                    {totalItems} items total
                                  </span>
                                  {isChecked && coverage > 0 && (
                                    <span className="text-xs text-orange-500 font-medium mt-0.5">
                                      Directly Routes {coverage} items
                                    </span>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* SUBCATEGORIES */}
                  <AccordionItem
                    value="subcategories"
                    className="border border-slate-150 rounded-2xl px-5 bg-white shadow-sm"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-orange-500 shrink-0" />
                        <span className="font-bold text-slate-800 text-sm">
                          Subcategories
                        </span>
                        <span className="text-xs text-slate-400 font-normal">
                          ({checkedSubcategoryIds.length} of{" "}
                          {allSubcategories.length} assigned)
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 pt-1">
                      {filteredSubcategories.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          No subcategories matching search.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {filteredSubcategories.map((sub) => {
                            const isChecked = checkedSubcategoryIds.includes(
                              sub.id,
                            );
                            return (
                              <label
                                key={sub.id}
                                className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition select-none text-sm ${
                                  isChecked
                                    ? "bg-orange-50/60 border-orange-200"
                                    : "border-slate-100 hover:bg-slate-50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() =>
                                    handleSubcategoryToggle(sub.id)
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer mt-0.5"
                                />
                                <div className="flex flex-col min-w-0">
                                  <span className="font-semibold text-slate-800 truncate">
                                    {sub.name}
                                  </span>
                                  <span className="text-xs text-slate-400 truncate mt-0.5">
                                    {sub.parentCategoryName}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* MENU ITEMS */}
                  <AccordionItem
                    value="menu-items"
                    className="border border-slate-150 rounded-2xl px-5 bg-white shadow-sm"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <UtensilsCrossed
                          size={16}
                          className="text-orange-500 shrink-0"
                        />
                        <span className="font-bold text-slate-800 text-sm">
                          Menu Items
                        </span>
                        <span className="text-xs text-slate-400 font-normal">
                          ({checkedMenuItemIds.length} explicit overrides)
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 pt-1">
                      {/* Legend */}
                      <div className="flex items-center gap-4 mb-4 p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 text-xs text-slate-500 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded border border-orange-300 bg-orange-100 block" />
                          <span className="text-slate-600">
                            Explicitly assigned
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded border border-orange-200 bg-orange-50 block" />
                          <span className="text-orange-500 font-medium">
                            Auto
                          </span>
                          <span>(Inherited via parent rule)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded border border-slate-200 bg-white block" />
                          <span>Unassigned</span>
                        </div>
                        <Info size={13} className="text-slate-300 ml-auto" />
                      </div>

                      {categories.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          No category structure available.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {categories.map((cat) => {
                            const catGroup = groupedMenuItems[cat.id];
                            const hasSubVisible =
                              catGroup &&
                              Object.keys(catGroup.subcategories).length > 0;
                            const hasUncatVisible =
                              catGroup && catGroup.uncategorized.length > 0;

                            if (!hasSubVisible && !hasUncatVisible) return null;

                            const isCatExpanded = !!expandedFolders[cat.id];
                            const itemCountInCat = menuItems.filter(
                              (i) => i.categoryId === cat.id,
                            ).length;
                            const explicitInCat = checkedMenuItemIds.filter(
                              (id) =>
                                menuItems.find(
                                  (i) => i.id === id && i.categoryId === cat.id,
                                ),
                            ).length;

                            return (
                              <div
                                key={cat.id}
                                className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm"
                              >
                                {/* Category row */}
                                <button
                                  type="button"
                                  onClick={() => toggleFolder(cat.id)}
                                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 transition text-left cursor-pointer border-b border-slate-100"
                                >
                                  <div className="flex items-center gap-2 text-slate-800 text-xs font-bold uppercase tracking-wide">
                                    {isCatExpanded ? (
                                      <FolderOpen
                                        size={15}
                                        className="text-orange-500 shrink-0"
                                      />
                                    ) : (
                                      <Folder
                                        size={15}
                                        className="text-orange-400 shrink-0"
                                      />
                                    )}
                                    <span>{cat.name}</span>
                                    <span className="text-slate-400 font-normal ml-1 normal-case">
                                      {itemCountInCat} items
                                      {explicitInCat > 0 && (
                                        <span className="ml-1 text-orange-500 font-semibold">
                                          · {explicitInCat} explicit
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  {isCatExpanded ? (
                                    <ChevronDown
                                      size={15}
                                      className="text-slate-400 shrink-0"
                                    />
                                  ) : (
                                    <ChevronRight
                                      size={15}
                                      className="text-slate-400 shrink-0"
                                    />
                                  )}
                                </button>

                                {/* Category content */}
                                {isCatExpanded && (
                                  <div className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                      {/* Subcategory cards */}
                                      {catGroup &&
                                        Object.entries(
                                          catGroup.subcategories,
                                        ).map(([subId, items]) => {
                                          const subName =
                                            cat.subcategories?.find(
                                              (s) => s.id === subId,
                                            )?.name || "Subcategory";
                                          const isSubCovered =
                                            checkedSubcategoryIds.includes(
                                              subId,
                                            );

                                          return (
                                            <div
                                              key={subId}
                                              className={`border rounded-xl overflow-hidden transition ${
                                                isSubCovered
                                                  ? "border-orange-200 bg-orange-50/30 ring-1 ring-orange-100"
                                                  : "border-slate-200 bg-white"
                                              }`}
                                            >
                                              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/80 border-b border-slate-100">
                                                <Tag
                                                  size={13}
                                                  className={`shrink-0 ${isSubCovered ? "text-orange-500" : "text-slate-400"}`}
                                                />
                                                <span className="font-semibold text-xs text-slate-700 truncate">
                                                  {subName}
                                                </span>
                                                {isSubCovered && (
                                                  <span className="ml-auto text-xs font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full shrink-0">
                                                    Assigned
                                                  </span>
                                                )}
                                              </div>

                                              <div className="p-2 space-y-1 max-h-52 overflow-y-auto">
                                                {/* Inside the subcategory card */}
                                                {items.map((item) => {
                                                  const status =
                                                    getItemStatus(item);
                                                  const isCovered =
                                                    status ===
                                                      "covered_by_cat" ||
                                                    status === "covered_by_sub";
                                                  const isExplicit =
                                                    status === "explicit";

                                                  return (
                                                    <label
                                                      key={item.id}
                                                      title={
                                                        isCovered
                                                          ? `Auto-routed via ${status === "covered_by_sub" ? "Subcategory" : "Category"} rule. Uncheck the parent first to enable manual override.`
                                                          : ""
                                                      }
                                                      className={`flex items-center gap-2 p-1.5 rounded-lg border transition cursor-pointer text-xs ${
                                                        isExplicit
                                                          ? "bg-orange-100 border-orange-300 text-slate-800"
                                                          : isCovered
                                                            ? "bg-orange-50/60 border-orange-200/50 text-slate-600 cursor-not-allowed"
                                                            : "border-slate-100 hover:bg-slate-50 text-slate-700"
                                                      }`}
                                                    >
                                                      {/* 🔒 LOCK ICON when covered, CHECKBOX when not covered */}
                                                      {isCovered ? (
                                                        <Lock
                                                          size={13}
                                                          className="text-slate-400 shrink-0 cursor-not-allowed"
                                                        />
                                                      ) : (
                                                        <input
                                                          type="checkbox"
                                                          checked={isExplicit}
                                                          onChange={() =>
                                                            toggleCheckbox(
                                                              item.id,
                                                              setCheckedMenuItemIds,
                                                            )
                                                          }
                                                          className="h-3.5 w-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer shrink-0"
                                                        />
                                                      )}

                                                      <Circle
                                                        size={9}
                                                        className={`shrink-0 ${isCovered ? "text-orange-400" : "text-slate-300"}`}
                                                      />

                                                      <span className="truncate flex-1">
                                                        {item.name}
                                                      </span>

                                                      {isCovered &&
                                                        !isExplicit && (
                                                          <span className="text-xs font-semibold text-orange-500 bg-white/80 px-1.5 py-0.5 rounded-full shadow-sm shrink-0">
                                                            Auto
                                                          </span>
                                                        )}
                                                    </label>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          );
                                        })}

                                      {/* Uncategorized card */}
                                      {hasUncatVisible && (
                                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                                          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/80 border-b border-slate-100">
                                            <FolderOpen
                                              size={13}
                                              className="text-slate-400 shrink-0"
                                            />
                                            <span className="font-semibold text-xs text-slate-700">
                                              General / Uncategorized
                                            </span>
                                          </div>
                                          <div className="p-2 space-y-1 max-h-52 overflow-y-auto">
                                            {catGroup.uncategorized.map(
                                              (item) => {
                                                const status =
                                                  getItemStatus(item);
                                                const isCovered =
                                                  status === "covered_by_cat" ||
                                                  status === "covered_by_sub";
                                                const isExplicit =
                                                  status === "explicit";

                                                return (
                                                  <label
                                                    key={item.id}
                                                    title={
                                                      isCovered
                                                        ? "Auto-routed via Category rule"
                                                        : ""
                                                    }
                                                    className={`flex items-center gap-2 p-1.5 rounded-lg border transition cursor-pointer text-xs ${
                                                      isExplicit
                                                        ? "bg-orange-100 border-orange-300 text-slate-800"
                                                        : isCovered
                                                          ? "bg-orange-50/60 border-orange-200/50 text-slate-600"
                                                          : "border-slate-100 hover:bg-slate-50 text-slate-700"
                                                    }`}
                                                  >
                                                    {isCovered ? (
                                                      <Lock
                                                        size={13}
                                                        className="text-slate-400 shrink-0 cursor-not-allowed"
                                                      />
                                                    ) : (
                                                      <input
                                                        type="checkbox"
                                                        checked={isExplicit}
                                                        onChange={() =>
                                                          toggleCheckbox(
                                                            item.id,
                                                            setCheckedMenuItemIds,
                                                          )
                                                        }
                                                        className="h-3.5 w-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer shrink-0"
                                                      />
                                                    )}
                                                    <Circle
                                                      size={9}
                                                      className={`shrink-0 ${isCovered ? "text-orange-400" : "text-slate-300"}`}
                                                    />
                                                    <span className="truncate flex-1">
                                                      {item.name}
                                                    </span>
                                                    {isCovered &&
                                                      !isExplicit && (
                                                        <span className="text-xs font-semibold text-orange-500 bg-white/80 px-1.5 py-0.5 rounded-full shadow-sm shrink-0">
                                                          Auto
                                                        </span>
                                                      )}
                                                  </label>
                                                );
                                              },
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Footer save bar — only shown when changes exist */}
                {
                  <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-5">
                    <button
                      type="button"
                      onClick={handleDiscard}
                      disabled={isSaving}
                      className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      <RotateCcw size={15} />
                      Discard Changes
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition shadow hover:shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-60"
                    >
                      {isSaving ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Save size={15} />
                      )}
                      {isSaving ? "Saving..." : "Save Assignments"}
                    </button>
                  </div>
                }
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
