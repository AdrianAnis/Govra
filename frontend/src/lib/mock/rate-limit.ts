interface Bucket {
  count: number;
  resetAt: number;
}

const STORE_KEY = Symbol.for("govra.rate-limit");

function isStore(value: unknown): value is Map<string, Bucket> {
  return value instanceof Map;
}

function buckets(): Map<string, Bucket> {
  const existing: unknown = Reflect.get(globalThis, STORE_KEY);
  if (isStore(existing)) {
    return existing;
  }
  const fresh = new Map<string, Bucket>();
  Reflect.set(globalThis, STORE_KEY, fresh);
  return fresh;
}

export function allow(key: string, limit: number, windowMs: number, now: number): boolean {
  const store = buckets();
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) {
    return false;
  }
  bucket.count += 1;
  return true;
}
