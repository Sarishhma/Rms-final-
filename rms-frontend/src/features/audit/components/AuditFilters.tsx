export default function AuditFilters({
  setFilters,
}: {
  setFilters: (f: any) => void;
}) {
  return (
    <div className="flex gap-3 flex-wrap mb-4">

      <input
        placeholder="Search user..."
        className="border px-3 py-2 rounded-lg"
        onChange={(e) =>
          setFilters((prev: any) => ({
            ...prev,
            search: e.target.value,
          }))
        }
      />

      <select
        className="border px-3 py-2 rounded-lg"
        onChange={(e) =>
          setFilters((prev: any) => ({
            ...prev,
            action: e.target.value,
          }))
        }
      >
        <option value="">All Actions</option>
        <option value="TABLE_RELEASED">Table Released</option>
        <option value="PAYMENT_CREATED">Payment</option>
        <option value="STOCK_ADJUSTED">Stock</option>
      </select>

      <select
        className="border px-3 py-2 rounded-lg"
        onChange={(e) =>
          setFilters((prev: any) => ({
            ...prev,
            entity: e.target.value,
          }))
        }
      >
        <option value="">All Entities</option>
        <option value="DiningTable">Table</option>
        <option value="Payment">Payment</option>
        <option value="DailyStock">Stock</option>
      </select>
    </div>
  );
}