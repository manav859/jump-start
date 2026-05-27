// Lightweight per-session API response cache.
//
// What it does
// ------------
// Wraps `sessionStorage` with TTL semantics so repeat reads of slow-changing
// endpoints (package catalog, dashboard summary, results listing, career
// detail) hit RAM instead of the network. Cache survives in-tab navigation
// but dies on tab close — so we don't have to worry about long-term
// staleness, only short-term (60s–10min) staleness within one session.
//
// Cache invariants
// ----------------
// 1. User-specific entries are namespaced by user identifier so two users
//    sharing one tab (e.g. dev laptop) never see each other's data.
// 2. On logout, `clearApiCache()` wipes the whole namespace.
// 3. After a mutating action (purchase a package, start a test, finish a
//    section), call `invalidateApiCache(key)` to force the next read to
//    re-fetch.
// 4. TTL is enforced on read — a stale entry returns `null`, so the page
//    falls through to the network like the cache wasn't there.

const NAMESPACE = "jumpstart:apiCache:";

const isAvailable = () => {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) return false;
    return true;
  } catch (_err) {
    return false;
  }
};

const userKey = (key, userId) => `${NAMESPACE}${userId || "anon"}:${key}`;

// Read a cached value. Returns the cached `data` field if the entry is
// younger than `ttlMs`, otherwise null.
export const readApiCache = (key, { userId = "anon", ttlMs } = {}) => {
  if (!isAvailable() || !ttlMs) return null;
  try {
    const raw = window.sessionStorage.getItem(userKey(key, userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > ttlMs) return null;
    return parsed.data;
  } catch (_err) {
    return null;
  }
};

// Store a response. `data` is whatever the page wants to put back into
// state — usually `res.data.data` already unwrapped.
export const writeApiCache = (key, data, { userId = "anon" } = {}) => {
  if (!isAvailable()) return;
  try {
    window.sessionStorage.setItem(
      userKey(key, userId),
      JSON.stringify({ data, ts: Date.now() })
    );
  } catch (_err) {
    // Quota exceeded or private-mode: silently fall through; the page
    // will just refetch next time, which is fine.
  }
};

// Drop one entry by logical key (across all users) — used after a
// mutation when we don't know the active user id at the call site.
export const invalidateApiCache = (key) => {
  if (!isAvailable()) return;
  try {
    const prefixes = [`${NAMESPACE}`];
    const matched = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const storageKey = window.sessionStorage.key(i);
      if (!storageKey) continue;
      if (prefixes.some((p) => storageKey.startsWith(p)) && storageKey.endsWith(`:${key}`)) {
        matched.push(storageKey);
      }
    }
    matched.forEach((k) => window.sessionStorage.removeItem(k));
  } catch (_err) {
    // ignore
  }
};

// Wipe the entire cache namespace — call from the logout path so the
// next user landing on this tab can't see the previous user's data.
export const clearApiCache = () => {
  if (!isAvailable()) return;
  try {
    const toRemove = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const storageKey = window.sessionStorage.key(i);
      if (storageKey && storageKey.startsWith(NAMESPACE)) {
        toRemove.push(storageKey);
      }
    }
    toRemove.forEach((k) => window.sessionStorage.removeItem(k));
  } catch (_err) {
    // ignore
  }
};

// Convenience: derive a stable user id from the auth context's user
// object. Falls back to "anon" so unauthenticated requests still get
// some caching benefit (e.g. /v1/public/config).
export const cacheUserKey = (user) =>
  (user && (user._id || user.id || user.email)) || "anon";

// Suggested TTLs (callers pass these explicitly so the values live next
// to the API call rather than in this util — easier to audit).
export const CACHE_TTL = {
  // Public, immutable-ish data
  PUBLIC_CONFIG_MS: 10 * 60 * 1000, // 10 min
  // User data that changes with actions — short TTL keeps it fresh
  // without making the API the critical-path block.
  USER_INIT_MS: 60 * 1000, // 60 sec
  USER_RESULTS_MS: 2 * 60 * 1000, // 2 min
  CAREER_RESULTS_MS: 2 * 60 * 1000, // 2 min
};
