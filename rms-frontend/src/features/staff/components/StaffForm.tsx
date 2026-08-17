import React, { useState } from "react";
import toast from "react-hot-toast";
import type { NormalizedError } from "@/lib/api/interceptor";
import { useCreateStaff } from "../hooks/useStaff";
import type { StaffRole } from "../services/staff.service";

type StaffFormProps = {
  onClose?: () => void;
};

function StaffForm({ onClose }: StaffFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffRole>("WAITER");
  const { mutateAsync } = useCreateStaff();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        name,
        email,
        password,
        role,
      };

      await mutateAsync(payload);

      setName("");
      setEmail("");
      setPassword("");
      setRole("WAITER");

      toast.success("Staff created successfully");
    } catch (error) {
      const err = error as NormalizedError;

      toast.error(err.message);
    }
  };
  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter staff name"
            className="w-full rounded-2xl border border-orange-200 bg-white/80 px-5 py-4 outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter staff email"
            className="w-full rounded-2xl border border-orange-200 bg-white/80 px-5 py-4 outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter staff password"
            className="w-full rounded-2xl border border-orange-200 bg-white/80 px-5 py-4 outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRole)}
            className="w-full rounded-2xl border border-orange-200 bg-white/80 px-5 py-4 outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="WAITER">WAITER</option>
            <option value="CASHIER">CASHIER</option>
            <option value="KITCHEN">KITCHEN</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 border rounded-xl"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="bg-orange-600 text-white px-5 py-3 rounded-xl"
          >
            Create Staff
          </button>
        </div>
      </form>
    </div>
  );
}

export default StaffForm;
