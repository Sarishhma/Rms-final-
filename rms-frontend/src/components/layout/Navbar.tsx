import {
  Bell,
  LogOut,
  Menu,
  User,
  UserCircle,
  CheckCheck,
  Trash2,
  Lock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useAuthMe } from "@/features/auth/hook/useAuthMe";
import { useLogout } from "@/features/auth/service/auth";
import { useSocket } from "@/providers/SocketProvider";
import PasswordSettingsModal from "@/features/resetPassword/components/PasswordSettingModal";
import { hasPermission } from "@/utils/permissions";

interface AdminNavbarProps {
  onMenuClick?: () => void;
}
function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminNavbar({ onMenuClick }: AdminNavbarProps) {
  const [dateTime] = useState(new Date());
  const [passwordModalOpen, setPasswordModalOpen] = useState(false); // NEW — replaces navigate
  const { data: authMe } = useAuthMe();
  const logout = useLogout();
  const { notifications, unreadCount, markAllAsRead, clearNotifications } =
    useSocket();

  const user = authMe?.data;
  const canManageUsers = hasPermission(user?.role, "user:manage");
  return (
    <div className="w-full h-16 bg-white border-b border-gray-200 shadow-sm flex items-center px-4 md:px-6 shrink-0">
      <div className="flex justify-between items-center w-full">
        {/* Left — hamburger on mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition text-gray-600"
        >
          <Menu size={20} />
        </button>

        {/* Center — live clock */}
        <p className="text-sm text-gray-600">
          {dateTime.toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
        </p>

        {/* Right — bell + profile */}
        <div className="flex items-center gap-3">
          <DropdownMenu
            onOpenChange={(open) => {
              if (open && unreadCount > 0) markAllAsRead();
            }}
          >
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 rounded-xl hover:bg-gray-100 transition">
                <Bell size={20} className="text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-80 bg-white text-black p-0 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-800">
                  Notifications
                </span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition"
                  >
                    <Trash2 size={12} />
                    Clear all
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                    <CheckCheck size={24} className="text-gray-300" />
                    <p className="text-sm text-gray-400">
                      You're all caught up
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition ${
                        !n.read ? "bg-orange-50/50" : ""
                      }`}
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          n.read ? "bg-transparent" : "bg-orange-500"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-700 leading-snug">
                          {n.message}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {timeAgo(n.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-2 rounded-xl transition">
                <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  <User size={18} className="text-gray-600" />
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {user?.name || "Admin"}
                </span>
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="px-2 py-2 bg-white text-black w-48"
            >
              <DropdownMenuItem className="cursor-pointer">
                <UserCircle className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>

              {canManageUsers && (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setPasswordModalOpen(true)}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Password Settings
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer text-red-500 focus:text-red-600"
                onClick={() => logout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Modal — rendered once, outside the dropdowns */}
      <PasswordSettingsModal
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
        canResetStaff={canManageUsers}
      />
    </div>
  );
}
