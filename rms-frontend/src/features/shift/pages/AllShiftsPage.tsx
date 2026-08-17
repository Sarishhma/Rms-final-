import { useState } from 'react'
import { ListShiftsTable } from '../components/ListShiftTable'
import { Activity, Filter, Search } from 'lucide-react'
import type { ShiftStatus } from '../types/shift.type'
import { useshifts } from '../hooks/useGetService.hooks'

export default function AllShiftsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ShiftStatus | undefined>(undefined)
  const [openedById, setOpenedById] = useState<string | undefined>(undefined)

  const { data, isLoading, isError } = useshifts({ page, status, openedById });
  const shifts = data?.data ?? [];
  const meta = data?.meta;
  // fetch a separate unfiltered set just to build the staff dropdown
const { data: allShiftsData } = useshifts({ status });
const staffOptions = Array.from(
  new Map((allShiftsData?.data ?? []).map((s) => [s.openedBy.id, s.openedBy])).values()
);
  const handleStatusChange = (value: string) => {
    setStatus(value === "ALL" ? undefined : (value as ShiftStatus));
    setPage(1);
  };

  const handleStaffChange = (value: string) => {
    setOpenedById(value === "ALL" ? undefined : value);
    setPage(1);
  };

  const clearFilters = () => {
    setStatus(undefined);
    setOpenedById(undefined);
    setPage(1);
  };

  return (
    <div className='p-2 bg-white'>
      {/* ─── Page Header ────────────────────────────────────────────── */}
<div className="mb-6  px-2">
  <div className="flex items-center gap-3 ">
    <div className="p-2 rounded-xl bg-orange-100">
      <Activity className="w-6 h-6 text-orange-600" strokeWidth={1.5} />
    </div>
    <div className="text-center">
      <h1 className="text-2xl font-bold text-slate-800">All Shifts</h1>
      <p className="text-sm text-slate-500 mt-0.5">Manage all your shifts here</p>
    </div>
  </div>
</div>

      {/* ─── Filters ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white border border-slate-200/80 rounded-2xl px-4 py-3 shadow-sm">

        {/* Staff Filter (exact-match select, not free-text search) */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={2} />
          <select
            value={openedById ?? "ALL"}
            onChange={(e) => handleStaffChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-200 transition-all cursor-pointer"
          >
            <option value="ALL">All Staff</option>
            {staffOptions.map((staff) => (
              <option key={staff.id} value={staff.id}>{staff.name}</option>
            ))}
          </select>
        </div>

        <div className="h-6 w-px bg-slate-200" />

        {/* Filters Label */}
        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
          <Filter className="w-3.5 h-3.5" strokeWidth={2} />
          Filters
        </div>

        <div className="h-6 w-px bg-slate-200" />

        {/* Status Select */}
        <select
          value={status ?? "ALL"}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 pr-8 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-200 transition-all cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </select>

        {/* Clear Filters */}
        {(status || openedById) && (
          <button
            onClick={clearFilters}
            className="text-xs font-medium text-orange-600 hover:text-orange-700 hover:underline transition-colors ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ─── Table ────────────────────────────────────────────────────── */}
      <ListShiftsTable
        shifts={shifts}
        meta={meta}
        isLoading={isLoading}
        isError={isError}
        page={page}
        setPage={setPage}
      />
    </div>
  )
}