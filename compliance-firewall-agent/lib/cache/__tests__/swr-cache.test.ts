import { describe, it, expect, beforeEach } from "vitest";
import { cached, __resetSwrCache, swrCacheSize } from "@/lib/cache/swr-cache";

/** A clock you control, so TTL/stale/cooldown windows are deterministic. */
function fakeClock(start = 1_000_000) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

beforeEach(() => __resetSwrCache());

describe("swr-cache single-flight", () => {
  it("collapses a thundering herd into ONE origin call", async () => {
    let calls = 0;
    const fetcher = async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 10));
      return "value";
    };

    // 1,000 concurrent callers for the same key, before the first resolves.
    const results = await Promise.all(
      Array.from({ length: 1000 }, () => cached("k", fetcher, { ttlMs: 1000 })),
    );

    expect(calls).toBe(1);
    expect(results.every((r) => r === "value")).toBe(true);
  });

  it("serves a fresh value from memory with no further origin calls", async () => {
    const clock = fakeClock();
    let calls = 0;
    const fetcher = async () => {
      calls++;
      return calls;
    };

    const a = await cached("k", fetcher, { ttlMs: 1000, now: clock.now });
    const b = await cached("k", fetcher, { ttlMs: 1000, now: clock.now });
    const c = await cached("k", fetcher, { ttlMs: 1000, now: clock.now });

    expect([a, b, c]).toEqual([1, 1, 1]);
    expect(calls).toBe(1);
  });
});

describe("swr-cache TTL + stale-while-revalidate", () => {
  it("refetches once the value is fully expired past the stale window", async () => {
    const clock = fakeClock();
    let calls = 0;
    const fetcher = async () => {
      calls++;
      return calls;
    };

    const first = await cached("k", fetcher, { ttlMs: 100, staleMs: 0, now: clock.now });
    expect(first).toBe(1);

    clock.advance(101); // past ttl, no stale window
    const second = await cached("k", fetcher, { ttlMs: 100, staleMs: 0, now: clock.now });
    expect(second).toBe(2);
    expect(calls).toBe(2);
  });

  it("serves stale instantly and revalidates in the background", async () => {
    const clock = fakeClock();
    let calls = 0;
    const fetcher = async () => {
      calls++;
      return calls;
    };

    await cached("k", fetcher, { ttlMs: 100, staleMs: 10_000, now: clock.now }); // calls=1
    clock.advance(150); // stale but within stale window

    // Returns the stale value (1) immediately, kicks off one background refresh.
    const stale = await cached("k", fetcher, { ttlMs: 100, staleMs: 10_000, now: clock.now });
    expect(stale).toBe(1);

    // Let the background revalidation settle.
    await new Promise((r) => setTimeout(r, 0));
    expect(calls).toBe(2);

    // Next read (still fresh from the refresh) serves the new value.
    const fresh = await cached("k", fetcher, { ttlMs: 100, staleMs: 10_000, now: clock.now });
    expect(fresh).toBe(2);
  });
});

describe("swr-cache circuit breaker", () => {
  it("opens after the failure threshold and serves the last good value", async () => {
    const clock = fakeClock();
    let mode: "ok" | "fail" = "ok";
    let calls = 0;
    const fetcher = async () => {
      calls++;
      if (mode === "fail") throw new Error("origin down");
      return "good";
    };

    // Seed a good value.
    const seed = await cached("k", fetcher, {
      ttlMs: 0,
      staleMs: 10_000,
      failureThreshold: 3,
      cooldownMs: 1000,
      now: clock.now,
    });
    expect(seed).toBe("good");

    // Origin starts failing. Each expired read attempts a fetch but falls back
    // to the last good value rather than throwing.
    mode = "fail";
    for (let i = 0; i < 3; i++) {
      clock.advance(1);
      const v = await cached("k", fetcher, {
        ttlMs: 0,
        staleMs: 10_000,
        failureThreshold: 3,
        cooldownMs: 1000,
        now: clock.now,
      });
      expect(v).toBe("good");
    }

    const callsAfterTrip = calls;

    // Circuit is now open — within the cooldown, no further origin calls.
    clock.advance(1);
    const served = await cached("k", fetcher, {
      ttlMs: 0,
      staleMs: 10_000,
      failureThreshold: 3,
      cooldownMs: 1000,
      now: clock.now,
    });
    expect(served).toBe("good");
    expect(calls).toBe(callsAfterTrip); // breaker prevented the call
  });

  it("throws only when the origin fails AND there is no value to serve", async () => {
    const clock = fakeClock();
    const fetcher = async () => {
      throw new Error("cold and down");
    };
    await expect(
      cached("cold", fetcher, { ttlMs: 1000, now: clock.now }),
    ).rejects.toThrow("cold and down");
  });
});

describe("swr-cache diagnostics", () => {
  it("reports the number of cached keys", async () => {
    expect(swrCacheSize()).toBe(0);
    await cached("a", async () => 1, { ttlMs: 1000 });
    await cached("b", async () => 2, { ttlMs: 1000 });
    expect(swrCacheSize()).toBe(2);
  });
});
