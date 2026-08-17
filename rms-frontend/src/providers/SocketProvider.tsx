import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { socket } from "@/lib/socket";
import api from "@/lib/client";
import type { Socket } from "socket.io-client";
export interface NotificationItem {
  id: string;
  message: string;
  timestamp: string; // ISO string
  read: boolean;
  type: string; // 'order' | 'kot' | 'table' | 'bill' | 'payment' | 'stock'
}
export interface SocketContextType {
  isConnected: boolean;
  socket: Socket;
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (message: string, type: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}
const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const isRefreshingRef = useRef(false);

  // ── Back-off state so we don't hammer the server on repeated errors ──────
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem("notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = (message: string, type: string) => {
    const newNotification: NotificationItem = {
      id: crypto.randomUUID(),
      message,
      timestamp: new Date().toISOString(),
      read: false,
      type,
    };
    setNotifications((prev) => [newNotification, ...prev].slice(0, 50));
  };

  const markAllAsRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const clearNotifications = () => setNotifications([]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return; // no token → don't even try to connect

    socket.connect();

    const onConnect = () => {
   
      setIsConnected(true);
      // Reset back-off on successful connect
      retryCountRef.current = 0;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      socket.emit("join", "floor");
      socket.emit("join", "kitchen");
      socket.emit("join", "cashier");
    };

    const onDisconnect = (_reason: string) => {
      setIsConnected(false);
    };
    const onConnectError = async (err: any) => {
     
      if (isRefreshingRef.current) return;

      // ── Guard 2: no tokens → no point retrying ───────────────────────────
      const hasToken = localStorage.getItem("accessToken");
      const hasRefreshToken = localStorage.getItem("refreshToken");
      if (!hasToken || !hasRefreshToken) return;

      // ── Guard 3: exponential back-off (1s → 2s → 4s → 8s → max 30s) ─────
      retryCountRef.current += 1;
      const backoffMs = Math.min(
        1000 * Math.pow(2, retryCountRef.current - 1),
        30_000,
      );

      console.warn(
        `[Socket] connect_error (attempt ${retryCountRef.current}): ${err.message}. Retrying in ${backoffMs / 1000}s…`,
      );

      // Clear any pending retry before scheduling a new one
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

      retryTimerRef.current = setTimeout(async () => {
        // ── Only do the token refresh on the first real failure ─────────────
        if (retryCountRef.current === 1) {
          isRefreshingRef.current = true;
          try {
            await api.get("/api/auth/me"); // triggers interceptor refresh if 401
          } catch {
            // interceptor already redirects on hard failure; nothing to do here
            isRefreshingRef.current = false;
            return;
          }
          isRefreshingRef.current = false;
        }

        // socket.io auto-reconnects, but we nudge it manually after back-off
        if (!socket.connected) {
          socket.connect();
        }
      }, backoffMs);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    return () => {
      // Clear pending retry timer on unmount
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        socket,
        notifications,
        unreadCount,
        addNotification,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
