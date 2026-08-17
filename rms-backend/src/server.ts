import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./prisma/client.js";
import { initSocket } from "./websocket/socket.js";
import { startTokenCleanupJob } from "./jobs/token-cleanup.js";
// import { initializeQzSigning } from "./modules/qz/service.js";

// Verify certificate/key configuration before opening a listener. A server
// without valid signing material must never start and later issue unsigned
// printing requests.


// try {
//   initializeQzSigning();
// } catch {
//   process.exit(1);
// }

// ─── Fail-fast: verify DB connectivity before accepting traffic ──────────────
try {
  await prisma.$queryRaw`SELECT 1`;
  console.log("✅ Database connection verified");
} catch (err) {
  console.error("❌ Unable to connect to the database. Aborting startup.");
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

const server = serve(
  {
    fetch: app.fetch,
    port: env.PORT
  },
  (info) => {
    console.log(`RMS backend listening on http://localhost:${info.port}`);
    console.log(`RMS backend listening on http://localhost:${info.port}/api-docs`);

  }
);

initSocket(server);
startTokenCleanupJob();
