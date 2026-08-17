import { useEffect, useRef, useState } from "react";
import { MdClose, MdHistory, MdOutlineSearch, MdTrendingUp } from "@/components/ui/Icons";
import { useSearchParams } from "react-router-dom";

// Search Component with Enhanced UI - FULLY FUNCTIONAL
export function EnhancedSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(searchParams.get("search") ?? "");
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save recent searches
  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (inputValue) {
        params.set("search", inputValue);
        saveRecentSearch(inputValue);
      } else {
        params.delete("search");
      }
      setSearchParams(params, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue, searchParams, setSearchParams]);

  const handleClear = () => {
    setInputValue("");
    inputRef.current?.focus();
  };

  // FIXED: Now properly sets the value when clicking on recent/suggestions
  const handleRecentClick = (term: string) => {
    setInputValue(term);
    setIsFocused(false);
    // The useEffect above will handle the URL update and saving
  };

  return (
    <div className="relative w-full max-w-xs sm:max-w-md mx-auto sm:mx-0">
      {/* Search Input Container */}
      <div
        className={`
          relative transition-all duration-300 ease-out
          ${isFocused ? "scale-102" : "scale-100"}
        `}
      >
        {/* Animated Border Gradient */}
        <div
          className={`
            absolute -inset-0.5 rounded-full opacity-0 transition-opacity duration-300
            ${isFocused ? "opacity-100" : ""}
            bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500
          `}
        />

        {/* Search Input */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Search menu items..."
            className={`
              relative w-full h-11 rounded-full
              bg-white/90 backdrop-blur-sm
              pl-11 pr-11
              text-sm text-gray-800
              placeholder:text-gray-400
              border transition-all duration-200
              ${isFocused 
                ? "border-orange-400 shadow-lg shadow-orange-100/50" 
                : "border-gray-200 hover:border-gray-300"
              }
              focus:outline-none
              focus:ring-2 focus:ring-orange-400/20
            `}
          />

          {/* Search Icon */}
          <MdOutlineSearch
            size={18}
            className={`
              absolute left-4 top-1/2 -translate-y-1/2
              transition-all duration-200
              ${isFocused ? "text-orange-500 scale-110" : "text-gray-400"}
            `}
          />

          {/* Clear Button */}
          {inputValue && (
            <button
              onClick={handleClear}
              className="
                absolute right-4 top-1/2 -translate-y-1/2
                p-0.5 rounded-full
                text-gray-400 hover:text-gray-600
                transition-all duration-200
                hover:bg-gray-100
              "
            >
              <MdClose size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Search Dropdown - Recent Searches */}
      {isFocused && !inputValue && recentSearches.length > 0 && (
        <div
          className="
            absolute top-full left-0 right-0 mt-2 z-50
            bg-white rounded-xl shadow-xl
            border border-gray-100
            overflow-hidden
            animate-in fade-in slide-in-from-top-2
            duration-200
          "
        >
          <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
            Recent Searches
          </div>
          {recentSearches.map((term, idx) => (
            <button
              key={idx}
              onMouseDown={(e) => e.preventDefault()} // Prevents input blur
              onClick={() => handleRecentClick(term)}
              className="
                w-full px-3 py-2
                flex items-center gap-2
                text-sm text-gray-700
                hover:bg-orange-50
                transition-colors duration-150
                group
              "
            >
              <MdHistory size={14} className="text-gray-400 group-hover:text-orange-500" />
              <span className="flex-1 text-left">{term}</span>
              <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Click to search
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Search Dropdown - Suggestions */}
      {isFocused && inputValue && (
        <div
          className="
            absolute top-full left-0 right-0 mt-2 z-50
            bg-white rounded-xl shadow-xl
            border border-gray-100
            overflow-hidden
            animate-in fade-in slide-in-from-top-2
            duration-200
          "
        >
          <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
            Suggestions
          </div>
          {["Coffee", "Sandwich", "Burger", "Pizza", "Pasta", "Salad"]
            .filter(item => item.toLowerCase().includes(inputValue.toLowerCase()))
            .map((suggestion, idx) => (
              <button
                key={idx}
                onMouseDown={(e) => e.preventDefault()} // Prevents input blur
                onClick={() => handleRecentClick(suggestion)}
                className="
                  w-full px-3 py-2
                  flex items-center gap-2
                  text-sm text-gray-700
                  hover:bg-orange-50
                  transition-colors duration-150
                  group
                "
              >
                <MdTrendingUp size={14} className="text-gray-400 group-hover:text-orange-500" />
                <span className="flex-1 text-left">{suggestion}</span>
              </button>
            ))}
        </div>
      )}

      {/* Search Stats */}
      {inputValue && (
        <div className="absolute -bottom-6 left-0 text-xs text-gray-400">
          Press ⏎ to search
        </div>
      )}
    </div>
  );
}