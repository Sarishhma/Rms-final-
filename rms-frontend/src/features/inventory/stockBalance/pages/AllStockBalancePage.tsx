// stockBalance/pages/AllStockBalancePage.tsx
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/features/menu/hooks/useCategories";
import { useInventoryItems } from "@/features/inventory/inventoryItem/hooks/useinventoryitem.hook";
import ListStockBalance from "../components/ListStockBalance";

const DEFAULT_LIMIT = 20;
const SEARCH_DEBOUNCE_DELAY = 400;



export default function AllStockBalancePage() {
  const [page, setPage] = useState<number>(1);
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);
  const [categoryId, setCategoryId] = useState<string>("all");
  const [itemId, setItemId] = useState<string>("all");

  const { data: categories } = useCategories();
const { data: itemsResponse } = useInventoryItems({ limit: 100 });
  const items = itemsResponse?.data || [];


  // Debounce search input to avoid excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const trimmedSearch = searchInput.trim();
      if (trimmedSearch !== searchQuery) {
        setSearchQuery(trimmedSearch);
        setPage(1); // Reset to first page on new search
      }
    }, SEARCH_DEBOUNCE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [searchInput, searchQuery]);

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  const handleLowStockToggle = (checked: boolean | "indeterminate"): void => {
    const isChecked = typeof checked === "boolean" ? checked : false;
    setLowStockOnly(isChecked);
    setPage(1); // Reset to first page when filter changes
  };




  // ==========================================================================
  // Render Helpers
  // ==========================================================================

  const renderFilterBar = () => (
    <div className="flex flex-wrap items-center gap-4">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search items by name, category, or SKU..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="h-10 rounded-lg border-gray-200 pl-10 pr-4 text-sm 
            placeholder:text-gray-400 focus:border-gray-300 focus:ring-0"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 
              hover:text-gray-600 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select 
          value={categoryId} 
          onValueChange={(val) => { setCategoryId(val); setPage(1); }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={itemId} 
          onValueChange={(val) => { setItemId(val); setPage(1); }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Items" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            {items?.map((item: any) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label
          htmlFor="low-stock-filter"
          className="flex items-center gap-2.5 text-sm font-medium text-gray-600 
            cursor-pointer select-none hover:text-gray-800 transition-colors"
        >
          <Checkbox
            id="low-stock-filter"
            checked={lowStockOnly}
            onCheckedChange={handleLowStockToggle}
            className="h-4 w-4 rounded border-gray-300 data-[state=checked]:bg-red-500 
              data-[state=checked]:border-red-500"
          />
          <span>Low stock only</span>
        </label>
      </div>
    </div>
  );

 

  // ==========================================================================
  // Main Render
  // ==========================================================================

  return (
    <div className="flex h-full min-h-screen w-full flex-col bg-white p-6">
      {/* Page Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Stock Balance</h1>
          <p className="mt-0.5 text-sm text-gray-400">
            Track and manage your inventory levels
          </p>
        </div>
       
      </div>

      {/* Filter Section */}
      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        {renderFilterBar()}
      </div>

      {/* Stock Balance List */}
      <div className="flex-1">
        <ListStockBalance
          page={page}
          limit={DEFAULT_LIMIT}
          search={searchQuery || undefined}
          categoryId={categoryId !== "all" ? categoryId : undefined}
          itemId={itemId !== "all" ? itemId : undefined}
          lowStockOnly={lowStockOnly || undefined}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}