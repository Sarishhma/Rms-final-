import StaffForm from "@/features/staff/components/StaffForm";

export default function StaffPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl backdrop-blur-xl bg-white/70 border border-white/50 shadow-2xl rounded-3xl p-10">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Staff Registration
          </h1>
          <p className="text-gray-500 mt-2">
            Add new staff members to your restaurant system
          </p>
        </div>

        <StaffForm />
      </div>
    </div>
  );
}
