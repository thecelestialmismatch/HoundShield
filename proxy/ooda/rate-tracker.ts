/**
 * Hound Shield OODA — in-memory sliding window rate tracker.
 *
 * Tracks requests-per-minute for orgs and users using a ring-buffer approach.
 * No SQLite — pure in-memory, intentionally ephemeral (resets on proxy restart).
 * Designed for <1ms overhead per request.
 */

// ── Types ──────────────────────────────────────────────────────────────────

interface RateBucket {
  /** Ring buffer of request timestamps (Unix ms), capped at MAX_WINDOW_SIZE. */
  timestamps: number[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const WINDOW_MS = 60_000; // 1-minute sliding window
const MAX_ENTRIES_PER_KEY = 500; // cap to bound memory per entity

// ── State ──────────────────────────────────────────────────────────────────

const orgBuckets = new Map<string, RateBucket>();
const userBuckets = new Map<string, RateBucket>();

// ── Core sliding window logic ───────────────────────────────────────────────

function getBucket(map: Map<string, RateBucket>, key: string): RateBucket {
  let bucket = map.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    map.set(key, bucket);
  }
  return bucket;
}

/**
 * Records a new request timestamp and returns the current rate (req/min).
 * Prunes timestamps outside the sliding window on every call.
 */
function recordAndCount(
  map: Map<string, RateBucket>,
  key: string,
  now: number
): number {
  const bucket = getBucket(map, key);
  const cutoff = now - WINDOW_MS;

  // Prune old entries (timestamps are appended in order, so prune from front)
  let start = 0;
  while (start < bucket.timestamps.length && bucket.timestamps[start]! < cutoff) {
    start++;
  }
  if (start > 0) bucket.timestamps = bucket.timestamps.slice(start);

  // Append current request
  bucket.timestamps.push(now);

  // Cap to prevent unbounded growth under sustained burst
  if (bucket.timestamps.length > MAX_ENTRIES_PER_KEY) {
    bucket.timestamps = bucket.timestamps.slice(-MAX_ENTRIES_PER_KEY);
  }

  return bucket.timestamps.length;
}

/**
 * Returns current req/min without recording (read-only).
 */
function countCurrent(
  map: Map<string, RateBucket>,
  key: string,
  now: number
): number {
  const bucket = map.get(key);
  if (!bucket) return 0;
  const cutoff = now - WINDOW_MS;
  return bucket.timestamps.filter((t) => t >= cutoff).length;
}

// ── Public API ─────────────────────────────────────────────────────────────

/** Record a request for an org and return its current req/min. */
export function recordOrgRequest(orgId: string, now = Date.now()): number {
  return recordAndCount(orgBuckets, orgId, now);
}

/** Record a request for a user and return their current req/min. */
export function recordUserRequest(userId: string, now = Date.now()): number {
  return recordAndCount(userBuckets, userId, now);
}

/** Read-only: current org req/min without recording. */
export function getOrgRate(orgId: string, now = Date.now()): number {
  return countCurrent(orgBuckets, orgId, now);
}

/** Read-only: current user req/min without recording. */
export function getUserRate(userId: string, now = Date.now()): number {
  return countCurrent(userBuckets, userId, now);
}

/** Reset all counters (used in tests). */
export function resetRateTracker(): void {
  orgBuckets.clear();
  userBuckets.clear();
}
