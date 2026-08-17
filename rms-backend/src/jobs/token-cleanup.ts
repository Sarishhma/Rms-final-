import { authRepository } from "../modules/auth/repository.js";

/**
 * Periodically purge expired refresh tokens from the database.
 * Runs every 6 hours to keep the RefreshToken table lean.
 */
const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

export const startTokenCleanupJob = () => {
  const run = async () => {
    try {
      const result = await authRepository.deleteExpiredRefreshTokens();
      if (result.count > 0) {
        console.log(`[token-cleanup] Purged ${result.count} expired refresh tokens`);
      }
    } catch (err) {
      console.error("[token-cleanup] Failed to purge expired tokens:", err);
    }
  };

  // Run once at startup, then on the interval
  void run();
  setInterval(run, CLEANUP_INTERVAL_MS);
};
