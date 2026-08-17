import { useEffect, useRef, useState } from "react";
import {
  Plus,
  UtensilsCrossed,
  CalendarCheck,
  Circle,
  X,
  Search,
  Pencil,
  Trash2,
  MoreVerticalIcon,
  Unlock,
  Wrench,
} from "lucide-react";

import {
  useDeleteTable,
  useTableActions,
  useTables,
  useUpdateTable,
} from "@/features/tables/hooks/useTables";

import type { Table, TableStatus } from "@/features/tables/types";

import Loader from "@/features/shared/LottieLoader";
import TableForm from "@/features/tables/components/TableForm";
import { toast } from "react-hot-toast";
import { useConfirm } from "@/providers/ConfirmProvider";

type FloorTab = "all" | string;

const statusConfig = {
  AVAILABLE: {
    label: "AVAILABLE",
    badge: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    card: "border-emerald-300 hover:border-emerald-400",
    icon: Circle,
  },
  OCCUPIED: {
    label: "OCCUPIED",
    badge: "bg-red-50 text-red-800 border border-red-200",
    card: "border-red-300 hover:border-red-400",
    icon: UtensilsCrossed,
  },
  RESERVED: {
    label: "RESERVED",
    badge: "bg-amber-50 text-amber-800 border border-amber-200",
    card: "border-amber-300 hover:border-amber-400",
    icon: CalendarCheck,
  },
  MAINTENANCE: {
    label: "MAINTENANCE",
    badge: "bg-slate-100 text-slate-600 border border-slate-300",
    card: "border-slate-300 hover:border-slate-400",
    icon: Wrench, // import from lucide-react
  },
};

function TableCard({
  table,
  onEdit,
  onRelease,
  onDelete,
}: {
  table: Table;
  onEdit: (table: Table) => void;
  onRelease: (id: string) => void;
  onDelete: (table: Table) => void;
}) {
  const [openMenu, setOpenMenu] = useState(false);

  // ✅ FIX: ref must wrap BOTH the trigger button AND the dropdown
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // ✅ Now correctly detects clicks outside the entire menu container
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const cfg = statusConfig[table.status] || statusConfig.AVAILABLE;
  const id = Array.isArray(table.id) ? String(table.id[0]) : String(table.id);

  return (
    <div
      // ✅ Only navigate to edit when clicking the card body, not the menu area
      onClick={() => onEdit(table)}
      className={`relative border rounded-xl p-4 bg-white cursor-pointer transition ${cfg.card}`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <p className="font-medium">{table.name}</p>

        <div className="flex items-center gap-2">
          <span className={`text-xs px-1 py-1 rounded ${cfg.badge}`}>
            {cfg.label}
          </span>

          {/*
           * ✅ ROOT FIX: menuRef now wraps BOTH the kebab button and the
           *    dropdown panel. Previously, ref was only on the button wrapper,
           *    so dropdown clicks were "outside" the ref boundary — causing the
           *    menu to close instantly on any dropdown interaction.
           */}
          <div
            ref={menuRef}
            className="relative"
            onClick={(e) => e.stopPropagation()} // ✅ Prevent card's onEdit from firing
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu((prev) => !prev);
              }}
              className="p-1 hover:bg-slate-100 rounded"
            >
              <MoreVerticalIcon size={16} />
            </button>

            {/* ✅ Dropdown is now INSIDE the ref div — clicks here are "inside" */}
            {openMenu && (
              <div className="absolute right-0 top-8 bg-white border shadow-lg rounded-lg w-36 z-10">
                <button
                  onClick={() => {
                    setOpenMenu(false);
                    onEdit(table);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 hover:bg-slate-100 text-sm"
                >
                  <Pencil size={14} /> Edit
                </button>

                <button
                  onClick={() => {
                    setOpenMenu(false);
                    onDelete(table);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 hover:bg-slate-100 text-sm text-red-600"
                >
                  <Trash2 size={14} /> Delete
                </button>

                {table.status === "OCCUPIED" && (
                  <button
                    onClick={() => {
                      setOpenMenu(false);
                      onRelease(id);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-slate-100 text-sm text-purple-600"
                  >
                    <Unlock size={14} /> Release
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex justify-between items-center mt-2">
        <p className="text-sm text-slate-500">Capacity: {table.capacity}</p>
        <p className="text-xs font-bold text-slate-500">{table.floor}</p>
      </div>
    </div>
  );
}

export default function TablesPage() {
  const { releaseTable } = useTableActions();
  const deleteTable = useDeleteTable();
  const confirm = useConfirm();

  const [openModal, setOpenModal] = useState(false);
  const [activeFloor, setActiveFloor] = useState<FloorTab>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TableStatus>("all");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const { data: tables = [], isLoading } = useTables();
  const updateMutation = useUpdateTable();

  const handleDelete = async (table: Table) => {
    const ok = await confirm({
      title: "Delete Table?",
      description: `Are you sure you want to delete table "${table.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      type: "danger",
    });

    if (!ok) return;
    deleteTable.mutate(table.id);
  };

  const handleEdit = (table: Table) => {
    setSelectedTable(table);
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setSelectedTable(null);
  };

  const handleUpdate = async () => {
    if (!selectedTable) return;
    try {
      await updateMutation.mutateAsync(selectedTable);
      toast.success("Table updated");
      closeEdit();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update table");
    }
  };

  const handleRelease = async (id: string) => {
    try {
      await releaseTable.mutateAsync(id);
      toast.success("Table released successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to release table");
    }
  };

  if (isLoading) return <Loader />;

  // Dynamic floor tabs
  const floors = [
    "all",
    ...new Set(tables.map((t) => t.floor ?? "Unassigned")),
  ];
  // Combined filtering
  const filtered = tables.filter((table) => {
    const floorMatch = activeFloor === "all" || table.floor === activeFloor;
    const statusMatch = statusFilter === "all" || table.status === statusFilter;
    const searchMatch = table.name.toLowerCase().includes(search.toLowerCase());
    return floorMatch && statusMatch && searchMatch;
  });

  const stats = {
    total: tables.length,
    available: tables.filter((t) => t.status === "AVAILABLE").length,
    occupied: tables.filter((t) => t.status === "OCCUPIED").length,
    reserved: tables.filter((t) => t.status === "RESERVED").length,
    maintenance: tables.filter((t) => t.status === "MAINTENANCE").length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Tables</h1>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg"
          onClick={() => setOpenModal(true)}
        >
          <Plus size={16} />
          Add Table
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            label: "Total",
            val: stats.total,
            icon: UtensilsCrossed,
            bg: "from-violet-500 to-purple-600",
            light: "bg-violet-50",
          },
          {
            label: "Available",
            val: stats.available,
            icon: Circle,
            bg: "from-emerald-500 to-green-600",
            light: "bg-emerald-50",
          },
          {
            label: "Occupied",
            val: stats.occupied,
            icon: UtensilsCrossed,
            bg: "from-red-500 to-rose-600",
            light: "bg-red-50",
          },
          {
            label: "Reserved",
            val: stats.reserved,
            icon: CalendarCheck,
            bg: "from-amber-500 to-orange-500",
            light: "bg-amber-50",
          },
          {
            label: "Maintenance",
            val: stats.maintenance,
            icon: Wrench,
            bg: "from-amber-500 to-orange-500",
            light: "bg-amber-50",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`${item.light} rounded-3xl p-5 shadow-sm border border-white/60 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">
                    {item.label}
                  </p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">
                    {item.val}
                  </p>
                </div>
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.bg} flex items-center justify-center text-white shadow-md`}
                >
                  <Icon size={26} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floor Tabs */}
      <div className="flex gap-2 flex-wrap">
        {floors.map((floor) => (
          <button
            key={floor}
            onClick={() => setActiveFloor(floor)}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              activeFloor === floor
                ? "bg-violet-600 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {floor === "all" ? "All Floors" : floor}
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row gap-3 justify-between">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search table..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg pl-10 pr-4 py-2"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | TableStatus)
          }
          className="border rounded-lg px-4 py-2 bg-white"
        >
          <option value="all">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="RESERVED">Reserved</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
      </div>

      {/* Table Grid */}
      {filtered.length === 0 ? (
        <p className="text-center text-slate-400 py-10">No tables found</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filtered.map((table) => (
            <TableCard
              key={String(table.id)}
              table={table}
              onEdit={handleEdit}
              onRelease={handleRelease}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add Table Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpenModal(false)}
          />
          <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-xl p-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-lg">Create Table</h1>
              <button
                className="bg-slate-300 rounded-xl px-2 py-1"
                onClick={() => setOpenModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <TableForm onClose={() => setOpenModal(false)} />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && selectedTable && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={closeEdit}
        >
          <div
            className="bg-white p-6 rounded-xl w-[400px] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Edit Table</h2>

            <input
              className="w-full border p-2 rounded"
              value={selectedTable.name}
              onChange={(e) =>
                setSelectedTable({ ...selectedTable, name: e.target.value })
              }
            />

            <input
              type="number"
              className="w-full border p-2 rounded"
              value={selectedTable.capacity}
              onChange={(e) =>
                setSelectedTable({
                  ...selectedTable,
                  capacity: Number(e.target.value),
                })
              }
            />
            <input
              className="w-full border p-2 rounded"
              value={selectedTable.floor ?? ""}
              onChange={(e) =>
                setSelectedTable({
                  ...selectedTable,
                  floor: e.target.value || null,
                })
              }
            />

            <select
              className="w-full border p-2 rounded"
              value={selectedTable.status}
              onChange={(e) =>
                setSelectedTable({
                  ...selectedTable,
                  status: e.target.value as TableStatus,
                })
              }
            >
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="RESERVED">Reserved</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>

            <div className="flex justify-end gap-2">
              <button onClick={closeEdit}>Cancel</button>
              <button
                className="bg-orange-600 text-white px-3 py-1 rounded"
                onClick={handleUpdate}
              >
                {updateMutation.isPending ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
