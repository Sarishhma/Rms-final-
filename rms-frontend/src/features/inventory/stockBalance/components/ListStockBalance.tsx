// stockBalance/components/ListStockBalance.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronLeft, 
  ChevronRight, 
  PackageSearch, 
  AlertCircle 
} from "lucide-react";
import { useStockBalance } from "../hooks/stockBalance.hook";
import type { ListStockBalanceProps } from "../../types/inventory.type";

// ============================================================================
// Constants
// ============================================================================

const TABLE_COLUMNS = [
  { key: "item", label: "Item", align: "left", width: "w-[22%]" },
  { key: "quantity", label: "Qty on Hand", align: "right", width: "w-[14%]" },
  { key: "unit", label: "Unit", align: "left", width: "w-[10%]" },
  { key: "avgCost", label: "Avg. Cost", align: "right", width: "w-[16%]" },
  { key: "totalValue", label: "Total Value", align: "right", width: "w-[18%]" },
  { key: "lastMovement", label: "Last Movement", align: "left", width: "w-[20%]" },
] as const;

// ============================================================================
// Helper Functions
// ============================================================================

const formatCurrency = (value: number | string): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return `Rs. ${num.toLocaleString("en-US", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

const formatNumber = (value: number | string): string => {
  return Number(value).toLocaleString("en-US", { 
    maximumFractionDigits: 2 
  });
};

const formatDate = (iso: string): string => {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const isBelowReorderLevel = (
  quantity: number | string, 
  reorderLevel?: number
): boolean => {
  return reorderLevel !== undefined && 
         Number(quantity) <= Number(reorderLevel);
};

// ============================================================================
// Sub-Components
// ============================================================================

const ColumnGroup: React.FC = () => (
  <colgroup>
    {TABLE_COLUMNS.map((column) => (
      <col key={column.key} className={column.width} />
    ))}
  </colgroup>
);

const TableSkeleton: React.FC = () => (
  <TableRow>
    {TABLE_COLUMNS.map((column) => (
      <TableCell key={column.key} className="py-5 px-4">
        <Skeleton className="h-5 w-full max-w-[120px]" />
      </TableCell>
    ))}
  </TableRow>
);

const EmptyState: React.FC = () => (
  <TableRow>
    <TableCell colSpan={TABLE_COLUMNS.length} className="py-16 px-4">
      <div className="flex flex-col items-center justify-center gap-3">
        <PackageSearch className="h-12 w-12 text-gray-300 stroke-[1.5]" />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600">No stock balances found</p>
          <p className="text-xs text-gray-400 mt-1">
            Try adjusting your filters or search terms
          </p>
        </div>
      </div>
    </TableCell>
  </TableRow>
);

const ErrorState: React.FC = () => (
  <TableRow>
    <TableCell colSpan={TABLE_COLUMNS.length} className="py-16 px-4">
      <div className="flex flex-col items-center justify-center gap-2">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <div className="text-center">
          <p className="text-sm font-medium text-red-500">Failed to load stock balances</p>
          <p className="text-xs text-red-400/80 mt-1">
            Please refresh the page or try again later
          </p>
        </div>
      </div>
    </TableCell>
  </TableRow>
);

interface StockBalanceRowProps {
  balance: any; // Replace with proper type
}

const StockBalanceRow: React.FC<StockBalanceRowProps> = ({ balance }) => {
  const isLowStock = isBelowReorderLevel(
    balance.quantityOnHand, 
    balance.item?.reorderLevel
  );

  return (
    <TableRow className="hover:bg-gray-50/70 transition-colors duration-150">
      <TableCell className="py-4 px-4 pl-6 text-left font-medium text-gray-800 truncate">
        {balance.item?.name ?? "—"}
      </TableCell>

      <TableCell className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-2.5">
          <span className="font-medium text-gray-700">
            {formatNumber(balance.quantityOnHand)}
          </span>
          {isLowStock && (
            <Badge 
              variant="destructive" 
              className="h-5 px-2 py-0 text-[10px] font-medium uppercase tracking-wide shrink-0"
            >
              Low
            </Badge>
          )}
        </div>
      </TableCell>
      
      <TableCell className="py-4 px-4 text-left text-gray-500 truncate">
        {balance.item?.baseUnit?.symbol ?? "—"}
      </TableCell>
      
      <TableCell className="py-4 px-4 text-right text-gray-600">
        {formatCurrency(balance.averageCost)}
      </TableCell>
      
      <TableCell className="py-4 px-4 text-right font-semibold text-gray-800">
        {formatCurrency(balance.totalValue)}
      </TableCell>
      
      <TableCell className="py-4 px-4 pr-6 text-left text-sm text-gray-500 truncate">
        {balance.lastMovementAt ? formatDate(balance.lastMovementAt) : "—"}
      </TableCell>
    </TableRow>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export default function ListStockBalance({
  page,
  limit,
  search,
  itemId,
  categoryId,
  lowStockOnly,
  onPageChange,
}: ListStockBalanceProps) {
  const { data, isLoading, isError } = useStockBalance({
    page,
    limit,
    search,
    itemId,
    categoryId,
    lowStockOnly,
  });

  const balances = data?.data ?? [];
  const meta = data?.meta;

  const renderTableBody = () => {
    if (isLoading) {
      return <TableSkeleton />;
    }

    if (isError) {
      return <ErrorState />;
    }

    if (balances.length === 0) {
      return <EmptyState />;
    }

    return balances.map((balance) => (
      <StockBalanceRow key={balance.id} balance={balance} />
    ));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <Table className="table-fixed w-full">
          <ColumnGroup />
          <TableHeader>
            <TableRow className="border-b border-gray-200 bg-gray-50/80">
              {TABLE_COLUMNS.map((column) => (
                <TableHead 
                  key={column.key}
                  className={`
                    h-12 px-4 text-xs font-semibold uppercase tracking-wider text-gray-600 truncate
                    ${column.align === "right" ? "text-right" : "text-left"}
                    ${column.key === "item" ? "pl-6" : ""}
                    ${column.key === "lastMovement" ? "pr-6" : ""}
                  `}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>{renderTableBody()}</TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between px-1 py-1">
          <div className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-700">{meta.page}</span>
            {" "}of{" "}
            <span className="font-medium text-gray-700">{meta.totalPages}</span>
            {" "}pages ·{" "}
            <span className="font-medium text-gray-700">{meta.total}</span>
            {" "}items
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="h-9 min-w-[90px] gap-2 px-4 text-sm font-medium transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed
                hover:border-gray-300 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => onPageChange(page + 1)}
              className="h-9 min-w-[90px] gap-2 px-4 text-sm font-medium transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed
                hover:border-gray-300 hover:bg-gray-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}