/**
 * Lightweight in-memory TTL cache.
 * Used to avoid redundant external API / DB calls within short windows.
 */
export class TtlCache<T> {
  private store = new Map<string, { value: T; expiresAt: number }>();
  private readonly ttlMs: number;
  private readonly maxSize: number;

  constructor(opts: { ttlMs: number; maxSize?: number }) {
    this.ttlMs = opts.ttlMs;
    this.maxSize = opts.maxSize ?? 1_000;
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    // Evict oldest entries when at capacity
    if (this.store.size >= this.maxSize) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
