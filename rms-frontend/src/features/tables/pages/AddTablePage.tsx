import TableForm from "@/features/tables/components/TableForm";

export default function AddTablePage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Add New Table</h1>
          <p className="text-slate-500 mt-2">
            Create and manage restaurant table information.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-800">
              Table Details
            </h2>
          </div>

          <TableForm />
        </div>
      </div>
    </div>
  );
}
