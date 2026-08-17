// components/printers/PrinterList.tsx

import type { Printer } from "../types";

interface PrinterListProps {
  printers: Printer[];
  isLoading: boolean;
}

export function PrinterList({ printers, isLoading }: PrinterListProps) {
  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-500">Loading printers...</div>
    );
  }

  if (!printers.length) {
    return (
      <div className="p-6 text-center text-gray-500">No printers found.</div>
    );
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="text-left text-sm text-gray-500 border-b">
          <th className="py-2 px-3">Name</th>
          <th className="py-2 px-3">IP Address</th>
          <th className="py-2 px-3">Port</th>
          <th className="py-2 px-3">Kitchen</th>
          <th className="py-2 px-3">Enabled</th>
          <th className="py-2 px-3">Station</th>
        </tr>
      </thead>
      <tbody>
        {printers.map((printer) => (
          <tr key={printer.id} className="border-b hover:bg-gray-50">
            <td className="py-2 px-3 font-medium">{printer.name}</td>
            <td className="py-2 px-3">{printer.ipAddress}</td>
            <td className="py-2 px-3">{printer.port}</td>
            <td className="py-2 px-3">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  printer.isKitchen
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {printer.isKitchen ? "Kitchen" : "Non-Kitchen"}
              </span>
            </td>
            <td className="py-2 px-3">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  printer.isEnabled
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {printer.isEnabled ? "Enabled" : "Disabled"}
              </span>
            </td>
            <td className="py-2 px-3 text-gray-500 text-sm">
              {printer.kitchenStationId ?? "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
