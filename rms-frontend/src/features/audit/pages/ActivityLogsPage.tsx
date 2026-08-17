import { useState } from "react";
import { useAuditLogs } from "@/features/audit/hooks/audit.hook";
import ActivityCard from "@/features/audit/components/ActivityCard";
import AuditFilters from "@/features/audit/components/AuditFilters";

export default function ActivityLogsPage() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    action: "",
    entity: "",
  });

  const { data, isLoading } = useAuditLogs(filters);

  const logs = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="p-6 space-y-4">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Activity Logs
        </h1>
        <p className="text-slate-500">
          System audit trail & actions history
        </p>
      </div>

      {/* Filters */}
      <AuditFilters setFilters={setFilters} />

      {/* Content */}
      {isLoading ? (
        <p>Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-center text-slate-400">
          No activity found
        </p>
      ) : (
        <div className="grid gap-3">
          {logs.map((log) => (
            <ActivityCard key={log.id} log={log} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center pt-4">
        <button
          disabled={filters.page === 1}
          onClick={() =>
            setFilters((p) => ({
              ...p,
              page: p.page - 1,
            }))
          }
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        <p className="text-sm text-slate-500">
          Page {meta?.page} / {meta?.totalPages}
        </p>

        <button
          disabled={filters.page === meta?.totalPages}
          onClick={() =>
            setFilters((p) => ({
              ...p,
              page: p.page + 1,
            }))
          }
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}