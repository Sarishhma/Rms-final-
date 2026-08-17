import { useState } from "react";
import { useStaff, useUpdateStaffRole } from "@/features/staff/hooks/useStaff";
import StaffForm from "@/features/staff/components/StaffForm";
import { Pencil, Trash } from "lucide-react";
import toast from "react-hot-toast";
import type { Staff, StaffRole } from "@/features/staff/services/staff.service";

export default function AllStaffPage() {
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const [selectedRole, setSelectedRole] = useState<StaffRole | null>(null);

  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const { data: staffData, isLoading, error } = useStaff();
  const { mutate: updateRole, isPending } = useUpdateStaffRole();

  // safe fallback (VERY IMPORTANT)
  const safeStaff = staffData ?? [];

  const filteredStaff = safeStaff.filter((staff) =>
    staff.name.toLowerCase().includes(search.toLowerCase()),
  );

  // LOADING STATE
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* header skeleton */}
          <div className="space-y-3">
            <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-96 bg-slate-200 rounded animate-pulse" />
          </div>

          {/* button skeleton */}
          <div className="h-12 w-40 bg-slate-200 rounded-xl animate-pulse" />

          {/* grid skeleton */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-32 bg-white border rounded-2xl p-5 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
  // ERROR STATE
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 font-medium">
          Failed to load staff data
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Staff Management
            </h1>
            <p className="text-slate-500 mt-2">
              Manage restaurant employees, roles, and permissions.
            </p>
          </div>

          <button
            className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-xl font-semibold"
            onClick={() => setOpenModal(true)}
          >
            + Add Staff
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>

        {/* Staff Grid */}
        {/* Staff Table */}
        {filteredStaff.length === 0 ? (
          <div className="text-center text-slate-500 mt-20">No staff found</div>
        ) : (
          <div className="overflow-x-auto bg-white border rounded-2xl shadow-sm">
            <table className="min-w-full text-sm text-left">
              {/* Table Head */}
              <thead className="bg-slate-50 border-b text-slate-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {filteredStaff.map((staff) => (
                  <tr
                    key={staff.id}
                    className="border-b hover:bg-slate-50 transition"
                  >
                    {/* Name */}
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {staff.name}
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 text-slate-600">{staff.email}</td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {staff.role}
                      </span>
                    </td>

                    {/* Status (FIXED) */}
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          staff.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {staff.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Created At */}
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(staff.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        {/* Edit */}
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => {
                            setEditStaff(staff);
                            setSelectedRole(staff.role);
                          }}
                        >
                          <Pencil size={16} />
                        </button>

                        {/* Delete */}
                        <button
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                          onClick={() => {}}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40  p-6">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-10">
            {/* Close Button */}
            <button
              onClick={() => setOpenModal(false)}
              className="absolute top-5 right-5 text-slate-500 hover:text-slate-800 text-xl"
            >
              ✕
            </button>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">
                Staff Registration
              </h1>

              <p className="text-gray-500 mt-2">
                Add new staff members to your restaurant system
              </p>
            </div>

            {/* Form */}
            <StaffForm onClose={() => setOpenModal(false)} />
          </div>
        </div>
      )}
      {editStaff && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl relative">
            {/* Close */}
            <button
              onClick={() => setEditStaff(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">Edit Role</h2>

            {/* Staff Info */}
            <p className="text-sm text-gray-500 mb-4">
              {editStaff.name} ({editStaff.email})
            </p>

            {/* Role Select */}
            <select
              value={selectedRole ?? editStaff.role}
              onChange={(e) => setSelectedRole(e.target.value as StaffRole)}
              className="w-full border px-3 py-2 rounded-lg mb-6"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="CASHIER">CASHIER</option>
              <option value="WAITER">WAITER</option>
              <option value="KITCHEN">KITCHEN</option>
              <option value="CASHIER_WAITER">CASHIER_WAITER</option>
            </select>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditStaff(null)}
                className="px-4 py-2 text-gray-600"
              >
                Cancel
              </button>

              <button
                disabled={isPending}
                onClick={() => {
                  if (!selectedRole) return;

                  updateRole(
                    {
                      userId: editStaff.id,
                      role: selectedRole,
                    },
                    {
                      onSuccess: () => {
                        toast.success("Role updated successfully");
                        setEditStaff(null);
                      },
                      onError: () => {
                        toast.error("Failed to update role");
                      },
                    },
                  );
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isPending ? "Updating..." : "Update Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
