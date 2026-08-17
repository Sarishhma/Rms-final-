import { Server, type Socket } from "socket.io";
import { env } from "../config/env.js";
import { getCompanyId } from "../utils/context.js";
import { verifyAccessToken } from "../utils/jwt.js";
import type { WebsocketEvent } from "./events.js";

let io: Server | null = null;

// Every authenticated socket auto-joins its tenant-wide room so un-roomed
// broadcasts reach it without crossing company boundaries. Named rooms
// (kitchen/floor/cashier) are nested under the same per-tenant prefix.
const companyRoom = (companyId: string) => `tenant:${companyId}`;
const namedRoom = (companyId: string, room: string) => `tenant:${companyId}:${room}`;

const extractToken = (socket: Socket): string | undefined => {
  // Accept the access token only from the handshake auth payload or the
  // Authorization header — never the query string, which leaks into proxy and
  // access logs. Clients should connect with io(url, { auth: { token } }).
  const fromAuth = socket.handshake.auth?.token;
  if (typeof fromAuth === "string" && fromAuth) return fromAuth.replace(/^Bearer\s+/i, "");
  const header = socket.handshake.headers.authorization;
  if (typeof header === "string" && header) return header.replace(/^Bearer\s+/i, "");
  return undefined;
};

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      // Mirror the HTTP CORS policy: pin to FRONTEND_ORIGIN when configured,
      // and never reflect an arbitrary origin with credentials. Credentials are
      // disabled under a wildcard origin (spec-incompatible) and aren't needed
      // anyway since sockets authenticate via token, not cookies.
      origin: env.FRONTEND_ORIGIN === "*" ? "*" : env.FRONTEND_ORIGIN,
      credentials: env.FRONTEND_ORIGIN !== "*",
    },
  });

  // Authenticate during the handshake: reject any socket without a valid access
  // token or company binding before it can join a room or receive events.
  io.use((socket, next) => {
    const token = extractToken(socket);
    const payload = token ? verifyAccessToken(token) : null;
    if (!payload?.sub) return next(new Error("Unauthorized"));
    if (!payload.companyId) return next(new Error("Forbidden: no company context"));
    socket.data.userId = payload.sub;
    socket.data.companyId = payload.companyId;
    next();
  });

  io.on("connection", (socket) => {
    const companyId = socket.data.companyId as string;

    // Tenant-wide room for un-roomed broadcasts.
    socket.join(companyRoom(companyId));

    // Clients may only ever join rooms within their own tenant.
    socket.on("join:kitchen", () => socket.join(namedRoom(companyId, "kitchen")));
    socket.on("join:floor", () => socket.join(namedRoom(companyId, "floor")));
    socket.on("join:cashier", () => socket.join(namedRoom(companyId, "cashier")));
  });

  return io;
};

export const publishEvent = (event: WebsocketEvent, payload: unknown, room?: string) => {
  if (!io) {
    return;
  }

  // Derive the tenant from the active request context so events are confined to
  // the company that produced them. Without a company we cannot target safely,
  // so drop the event rather than broadcast it to every tenant.
  const companyId = getCompanyId();
  if (!companyId) {
    return;
  }

  const target = room ? namedRoom(companyId, room) : companyRoom(companyId);
  io.to(target).emit(event, payload);
};
