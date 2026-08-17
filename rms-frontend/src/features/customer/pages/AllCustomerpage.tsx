import { useState } from "react";
import { Search, Plus, Users } from "lucide-react";
import type { Customer } from "../types";
import { useCustomers } from "../hooks/useCustomer.hook";
import { AddCustomerModal } from "../components/AddCustomerModel";
import { ManageCustomerModal } from "../components/ManageCustomerModal";

export default function AllCustomersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [manageCustomer, setManageCustomer] = useState<Customer | null>(null);

  const { data, isLoading } = useCustomers(page, 20);

  const customers = data?.data ?? [];
  const meta = data?.meta;

  const filtered = customers.filter(
    (c: Customer) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-2 bg-white">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-3 px-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-100">
            <Users className="w-6 h-6 text-orange-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage your customer database and contact details
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-semibold transition duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus size={18} />
          Add Customer
        </button>
      </div>

      {/* ─── Filters ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white border border-slate-200/80 rounded-2xl px-4 py-3 shadow-sm">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={2} />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-200 transition-all"
          />
        </div>
      </div>

      {/* ─── Table ────────────────────────────────────────────────────── */}
      {isLoading && customers.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No customers found</h3>
          <p className="text-slate-500 mt-1 text-sm max-w-xs mx-auto">
            Try adjusting your search or add a new customer to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3 hidden sm:table-cell">Phone</th>
                  <th className="px-5 py-3 hidden md:table-cell">Email</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((customer: Customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-slate-50/60 transition-colors duration-150"
                  >
                    <td className="px-5 py-3.5 font-semibold text-slate-800 text-sm">
                      {customer.name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-sm hidden sm:table-cell">
                      {customer.phone}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-sm hidden md:table-cell">
                      {customer.email || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          customer.isActive
                            ? "bg-green-50 text-green-700 border-green-100"
                            : "bg-red-50 text-red-700 border-red-100"
                        }`}
                      >
                        {customer.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setManageCustomer(customer)}
                        className="px-4 py-1.5 border border-slate-200 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 text-slate-700 font-semibold text-xs rounded-xl transition duration-150 active:scale-95 cursor-pointer"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {meta && (
            <div className="flex justify-between items-center px-5 py-3.5 border-t border-slate-200/80 bg-slate-50/50">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                Previous
              </button>
              <span className="text-sm font-semibold text-slate-600">
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
                disabled={page >= meta.totalPages}
                className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {manageCustomer && (
        <ManageCustomerModal
          customer={manageCustomer}
          onClose={() => setManageCustomer(null)}
        />
      )}
    </div>
  );
}

export { AllCustomersPage as CustomerList };