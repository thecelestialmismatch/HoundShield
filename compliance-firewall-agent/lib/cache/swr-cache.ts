/**
 * Single-flight, stale-while-revalidate in-process cache with a circuit breaker.
 *
 * This is the application-layer answer to "a million people hit the same thing
 * at the same instant." The expensive scenario is not a million *different*
 * reads — it is a million *identical* reads stampeding the database. This cache
 * collapses them:
 *
 *   - SINGLE-FLIGHT: while one fetch for a key is in progress, every other
 *     caller for that key awaits the same promise. A million concurrent callers
 *     trigger exactly one origin call.
 *   - TTL: a fresh value is served from memory with zero origin calls.
 *   - STALE-WHILE-REVALIDATE: once past the TTL but within the stale window, the
 *     last value is served instantly while a single background refresh runs, so
 *     latency never spikes on expiry.
 *   - CIRCUIT BREAKER: after `failureThreshold` consecutive origin failures the
 *     circuit opens for `cooldownMs`; during that window the last good value is
 *     served (never an error storm), and the origin is given time to recover.
 *
 * It is intentionally per-instance (no external dependency). On serverless that
 * means one warm instance == one cache; combined with single-flight that still
 * cuts origin load by orders of magnitude under a thundering herd. For a shared
 * tier, back the same interface with Redis — callers never change.
 */

type Entry<T> = {
  value: T;
  /** Epoch ms when the value becomes stale (TTL boundary). */
  freshUntil: number;
  /** Epoch ms after which even a stale value must not be served. */
  staleUntil: number;
};

type Breaker = {
  failures: number;
  /** Epoch ms until which the circuit stays open; 0 = closed. */
  openUntil: number;
};

export interface SwrOptions {
  /** How long a value is considered fresh. Default 30_000ms. */
  ttlMs?: number;
  /**
   * Extra window past the TTL during which a stale value may be served while a
   * background refresh runs. Default 5 minutes. Set 0 to disable SWR.
   */
  staleMs?: number;
  /** Consecutive origin failures before the circuit opens. Default 5. */
  failureThreshold?: number;
  /** How long the circuit stays open once tripped. Default 10_000ms. */
  cooldownMs?: number;
  /** Clock injection for tests. Defaults to Date.now. */
  now?: () => number;
}

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();
const breakers = new Map<string, Breaker>();

/** Test/seam helper: wipe all cache state. */
export function __resetSwrCache(): void {
  store.clear();
  inflight.clear();
  breakers.clear();
}

/** Current number of cached keys — for diagnostics/health endpoints. */
export function swrCacheSize(): number {
  return store.size;
}

function getBreaker(key: string): Breaker {
  let b = breakers.get(key);
  if (!b) {
    b = { failures: 0, openUntil: 0 };
    breakers.set(key, b);
  }
  return b;
}

/**
 * Fetch `key` through the cache. Concurrent callers for the same in-flight key
 * share one promise. Returns fresh-from-cache, stale-while-revalidating, a
 * single origin call, or — if the origin is failing and the circuit is open —
 * the last known good value.
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: SwrOptions = {},
): Promise<T> {
  const {
    ttlMs = 30_000,
    staleMs = 5 * 60_000,
    failureThreshold = 5,
    cooldownMs = 10_000,
    now = Date.now,
  } = options;

  const t = now();
  const entry = store.get(key) as Entry<T> | undefined;

  // 1. Fresh hit — zero origin work.
  if (entry && t < entry.freshUntil) return entry.value;

  const breaker = getBreaker(key);
  const circuitOpen = t < breaker.openUntil;

  // 2. Circuit open: serve the last good value rather than stampede a failing
  //    origin. Only fall through to a fetch if we have nothing to serve.
  if (circuitOpen && entry && t < entry.staleUntil) return entry.value;

  // 3. Stale-while-revalidate: serve stale now, refresh once in the background.
  if (entry && t < entry.staleUntil && !circuitOpen) {
    if (!inflight.has(key)) {
      // Fire-and-forget; swallow errors here (handled by the breaker in refresh).
      void revalidate(key, fetcher, { ttlMs, staleMs, failureThreshold, cooldownMs, now }).catch(
        () => undefined,
      );
    }
    return entry.value;
  }

  // 4. No servable value (cold, or expired past the stale window). Block on a
  //    single shared fetch.
  return revalidate(key, fetcher, { ttlMs, staleMs, failureThreshold, cooldownMs, now });
}

/** Run (or join) the single in-flight fetch for `key`, updating cache + breaker. */
function revalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
  opts: Required<Omit<SwrOptions, "now">> & { now: () => number },
): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = (async () => {
    try {
      const value = await fetcher();
      const t = opts.now();
      store.set(key, {
        value,
        freshUntil: t + opts.ttlMs,
        staleUntil: t + opts.ttlMs + opts.staleMs,
      });
      const b = getBreaker(key);
      b.failures = 0;
      b.openUntil = 0;
      return value;
    } catch (err) {
      const b = getBreaker(key);
      b.failures += 1;
      if (b.failures >= opts.failureThreshold) {
        b.openUntil = opts.now() + opts.cooldownMs;
      }
      // Serve last known good value if we still have one, even if expired —
      // a slightly stale number beats a 500 during an origin outage.
      const stale = store.get(key) as Entry<T> | undefined;
      if (stale) return stale.value;
      throw err;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}
