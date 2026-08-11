/**
 * Response-latency equalization.
 *
 * The oracle: GoTrue runs bcrypt only when the address resolves to a user, so a
 * "hit" costs tens-to-hundreds of milliseconds more than a "miss". Identical
 * wording does not close that; a floor does.
 *
 * These tests assert the floor's arithmetic exactly (the pure function), then
 * assert the end-to-end property the routes depend on: a fast path and a slow
 * path land in the same latency band.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  AUTH_MIN_RESPONSE_MS,
  AUTH_JITTER_MS,
  remainingDelayMs,
  settleAuthTiming,
} from '@/lib/auth/timing';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('the floor is above the cost it has to hide', () => {
  it('exceeds a typical bcrypt round-trip', () => {
    // bcrypt at GoTrue's default cost plus a round trip is well under 600ms;
    // a floor beneath it would not hide the difference at all.
    expect(AUTH_MIN_RESPONSE_MS).toBeGreaterThanOrEqual(400);
  });

  it('stays inside what a person will wait for a sign-in', () => {
    expect(AUTH_MIN_RESPONSE_MS + AUTH_JITTER_MS).toBeLessThanOrEqual(1_500);
  });

  it('adds jitter, so repeated identical timings cannot be averaged out cheaply', () => {
    expect(AUTH_JITTER_MS).toBeGreaterThan(0);
  });
});

describe('remainingDelayMs', () => {
  it('owes the whole floor when no time has passed', () => {
    expect(remainingDelayMs(1_000, 1_000, 0)).toBe(AUTH_MIN_RESPONSE_MS);
  });

  it('owes the remainder when some work has already happened', () => {
    expect(remainingDelayMs(1_000, 1_000 + 100, 0)).toBe(AUTH_MIN_RESPONSE_MS - 100);
  });

  it('owes nothing once the real work has overrun the floor', () => {
    expect(remainingDelayMs(0, AUTH_MIN_RESPONSE_MS + 5_000, 0)).toBe(0);
  });

  it('never returns a negative delay', () => {
    expect(remainingDelayMs(0, 10_000_000, 1)).toBe(0);
  });

  it('adds up to AUTH_JITTER_MS on top of the floor', () => {
    expect(remainingDelayMs(0, 0, 0)).toBe(AUTH_MIN_RESPONSE_MS);
    expect(remainingDelayMs(0, 0, 1)).toBe(AUTH_MIN_RESPONSE_MS + AUTH_JITTER_MS);
    expect(remainingDelayMs(0, 0, 0.5)).toBe(AUTH_MIN_RESPONSE_MS + AUTH_JITTER_MS / 2);
  });

  it('clamps an out-of-range jitter fraction instead of trusting it', () => {
    expect(remainingDelayMs(0, 0, -5)).toBe(AUTH_MIN_RESPONSE_MS);
    expect(remainingDelayMs(0, 0, 99)).toBe(AUTH_MIN_RESPONSE_MS + AUTH_JITTER_MS);
    expect(remainingDelayMs(0, 0, Number.NaN)).toBe(AUTH_MIN_RESPONSE_MS);
  });

  /**
   * The property the whole module exists for, expressed directly: two paths
   * whose real cost differs land on the same total, as long as both finish
   * under the floor.
   */
  it('equalizes a fast path and a slow path to the same total', () => {
    const fastMissMs = 5; // unknown email — GoTrue returns without hashing
    const slowHitMs = 250; // known email — bcrypt runs
    const jitter = 0.4; // same draw, to isolate the floor's contribution

    const missTotal = fastMissMs + remainingDelayMs(0, fastMissMs, jitter);
    const hitTotal = slowHitMs + remainingDelayMs(0, slowHitMs, jitter);

    expect(missTotal).toBe(hitTotal);
  });

  it('cannot equalize a path that overruns the floor — stated, not hidden', () => {
    // Honest negative test. The floor is half the defence; the other half is
    // the attempt cap in lib/auth/lockout.ts, which bounds sample count.
    const overrun = AUTH_MIN_RESPONSE_MS + AUTH_JITTER_MS + 500;
    expect(overrun + remainingDelayMs(0, overrun, 1)).toBeGreaterThan(
      5 + remainingDelayMs(0, 5, 1),
    );
  });
});

describe('settleAuthTiming', () => {
  it('waits out the remaining floor', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const start = Date.now();

    let settled = false;
    const pending = settleAuthTiming(start).then(() => {
      settled = true;
    });

    await vi.advanceTimersByTimeAsync(AUTH_MIN_RESPONSE_MS - 1);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(2);
    await pending;
    expect(settled).toBe(true);
  });

  it('returns without scheduling a timer when the floor is already met', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const spy = vi.spyOn(globalThis, 'setTimeout');
    await settleAuthTiming(Date.now() - (AUTH_MIN_RESPONSE_MS + 1_000));
    expect(spy).not.toHaveBeenCalled();
  });

  it('resolves rather than throwing, so no route can be broken by it', async () => {
    vi.useFakeTimers();
    const pending = settleAuthTiming(Date.now());
    await vi.advanceTimersByTimeAsync(AUTH_MIN_RESPONSE_MS + AUTH_JITTER_MS);
    await expect(pending).resolves.toBeUndefined();
  });
});
