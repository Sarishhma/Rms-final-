import { tooManyRequests } from "./app-error.js";

// In-memory per-account login throttle. After MAX_FAILS consecutive failed
// logins for an email the account is locked for LOCK_MS; a successful login
// clears the record. This complements the per-IP rate limiter by slowing a
// brute-force targeted at one account.
//
// Single-instance only (same caveat as the rate limiter) — move to a shared
// store (Redis) when scaling horizontally [[S5]]. Trade-off: an attacker who
// knows an email could lock it out (DoS); the per-IP limit caps overall
// attempts and the lock window is intentionally short.
type Entry = { fails: number; lockedUntil: number };

const store = new Map<string, Entry>();
const MAX_FAILS = 5;
const LOCK_MS = 3 * 60 * 1000; // 3 minutes

// Evict stale entries that are neither failing nor locked.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.lockedUntil <= now && entry.fails === 0) store.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

const normalize = (email: string) => email.trim().toLowerCase();

export const loginThrottle = {
  /** Throw 429 if the account is currently locked. Call before verifying the password. */
  assertNotLocked: (email: string) => {
    const entry = store.get(normalize(email));
    if (entry && entry.lockedUntil > Date.now()) {
      const retryAfter = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
      throw tooManyRequests(
        `Too many failed login attempts. Try again in ${retryAfter} seconds.`,
      );
    }
  },

  /** Record a failed attempt; lock the account once the threshold is reached. */
  recordFailure: (email: string) => {
    const key = normalize(email);
    const entry = store.get(key) ?? { fails: 0, lockedUntil: 0 };
    entry.fails += 1;
    if (entry.fails >= MAX_FAILS) {
      entry.lockedUntil = Date.now() + LOCK_MS;
      entry.fails = 0; // counter reset; the lock window now governs
    }
    store.set(key, entry);
  },

  /** Clear any failure/lock state after a successful login. */
  recordSuccess: (email: string) => {
    store.delete(normalize(email));
  },
};
