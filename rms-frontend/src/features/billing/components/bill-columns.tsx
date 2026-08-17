import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import type { Bill } from "../types";

const getStatusClass = (status: string) => {
  switch (status) {
    case "PAID":
      return "text-green-600";
    case "OPEN":
      return "text-yellow-500";
    case "PARTIALLY_PAID":
      return "text-blue-500";
    case "VOIDED":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
};

function formatCurrency(value: string) {
  return `Rs. ${Number(value).toLocaleString()}`;
}

export const columns = (onView: (bill: Bill) => void): ColumnDef<Bill>[] => [
  {
    id: "billNumber",
    header: "Bill No.",
    cell: ({ row }) => row.original.billNumber,
  },
  {
    id: "table",
    header: "Table",
    cell: ({ row }) => row.original.order?.table?.name ?? "-",
  },
  {
    id: "channel",
    header: "Channel",
    cell: ({ row }) => row.original.order?.channel?.replace("_", " "),
  },
  {
    id: "paid",
    header: "paid",
    cell: ({ row }) => row.original.paid,
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 rounded text-sm ${getStatusClass(
          row.original.status,
        )}`}
      >
        {row.original.status}
      </span>
    ),
  },
  {
    id: "grandTotal",
    header: "Total",
    cell: ({ row }) => formatCurrency(row.original.grandTotal),
  },
  {
    id: "Refund",
    header: "Refund",
    cell: ({ row }) => formatCurrency(row.original.refunded),
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => (
      <Button variant="outline" size="sm" onClick={() => onView(row.original)}>
        View
      </Button>
    ),
  },
];
