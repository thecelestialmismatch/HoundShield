/**
 * Account lockout — NIST 800-171 3.1.8 / CMMC AC.2.008.
 *
 * The behaviours that matter to the control, and therefore to the tests:
 *   1. it locks at a defined consecutive-failure threshold inside 3-10;
 *   2. it counts CONSECUTIVE failures — success clears the streak;
 *   3. the lock expires on schedule;
 *   4. it is keyed on the SUBMITTED address, not on a user id, or "locked"
 *      would itself prove the account exists;
 *   5. it fails OPEN, because a Postgres blip must not lock out every paying
 *      customer of a product whose sign-in does not depend on this table.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockConfigured, mockFrom, mockRpc, mockDelete } = vi.hoisted(() => ({
  mockConfigured: vi.fn().mockReturnValue(true),
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => mockConfigured(),
  createServiceClient: () => ({ from: mockFrom, rpc: mockRpc }),
}));

import {
  LOCKOUT_THRESHOLD,
  LOCKOUT_MINUTES,
  lockoutKey,
  minutesRemaining,
  lockStateFrom,
  checkLockout,
  registerFailure,
  clearFailures,
} from '@/lib/auth/lockout';

/** `from('auth_lockouts').select(...).eq(...).maybeSingle()` */
function selectReturns(result: unknown) {
  mockFrom.mockReturnValue({
    select: () => ({ eq: () => ({ maybeSingle: async () => result }) }),
  });
}

function selectThrows(err: Error) {
  mockFrom.mockReturnValue({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => {
          throw err;
        },
      }),
    }),
  });
}

beforeEach(() => {
  mockConfigured.mockReturnValue(true);
  mockFrom.mockReset();
  mockRpc.mockReset();
  mockDelete.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the threshold is the one HoundShield tells its own customers to use', () => {
  it('sits inside the 3-10 band from lib/shieldready/controls/ac.ts', () => {
    expect(LOCKOUT_THRESHOLD).toBeGreaterThanOrEqual(3);
    expect(LOCKOUT_THRESHOLD).toBeLessThanOrEqual(10);
  });

  it('holds the lock long enough to defeat an automated retry loop', () => {
    expect(LOCKOUT_MINUTES).toBeGreaterThanOrEqual(5);
  });
});

describe('lockoutKey — the enumeration-safety property', () => {
  it('never contains the address', () => {
    const key = lockoutKey('rachel@clinic.example');
    expect(key).not.toContain('rachel');
    expect(key).not.toContain('@');
    expect(key).not.toContain('clinic');
    expect(key).toMatch(/^[0-9a-f]{32}$/);
  });

  it('normalizes case and whitespace, so case-flipping cannot defeat the lock', () => {
    const canonical = lockoutKey('user@acme.com');
    expect(lockoutKey('  User@ACME.com  ')).toBe(canonical);
    expect(lockoutKey('USER@ACME.COM')).toBe(canonical);
  });

  it('separates different addresses', () => {
    expect(lockoutKey('a@acme.com')).not.toBe(lockoutKey('b@acme.com'));
  });

  it('keys an address that has no account exactly as it keys one that does', () => {
    // The function cannot see account existence at all — that is the point.
    expect(lockoutKey('ghost@nowhere.test')).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe('minutesRemaining — pure clock arithmetic', () => {
  const now = Date.UTC(2026, 7, 11, 12, 0, 0);

  it('is 0 when there is no lock', () => {
    expect(minutesRemaining(null, now)).toBe(0);
    expect(minutesRemaining(undefined, now)).toBe(0);
  });

  it('is 0 for a lock that has already expired', () => {
    expect(minutesRemaining(new Date(now - 1_000).toISOString(), now)).toBe(0);
  });

  it('is 0 exactly at the expiry instant, not 1', () => {
    expect(minutesRemaining(new Date(now).toISOString(), now)).toBe(0);
  });

  it('rounds up, so the stated wait is never shorter than the real one', () => {
    expect(minutesRemaining(new Date(now + 61_000).toISOString(), now)).toBe(2);
    expect(minutesRemaining(new Date(now + 1).toISOString(), now)).toBe(1);
  });

  it('is 0 for an unparseable timestamp rather than NaN', () => {
    expect(minutesRemaining('not-a-date', now)).toBe(0);
  });
});

describe('lockStateFrom', () => {
  const now = Date.UTC(2026, 7, 11, 12, 0, 0);

  it('reports locked while time remains', () => {
    const s = lockStateFrom(new Date(now + 5 * 60_000).toISOString(), now, 5);
    expect(s).toEqual({ locked: true, minutesRemaining: 5, consecutiveFailures: 5, degraded: false });
  });

  it('reports unlocked once the lock lapses, keeping the failure count', () => {
    const s = lockStateFrom(new Date(now - 1).toISOString(), now, 4);
    expect(s.locked).toBe(false);
    expect(s.consecutiveFailures).toBe(4);
  });

  it('never reports a negative failure count', () => {
    expect(lockStateFrom(null, now, -3).consecutiveFailures).toBe(0);
  });
});

describe('checkLockout', () => {
  it('reads the row for the hashed address and reports the lock', async () => {
    const until = new Date(Date.now() + 10 * 60_000).toISOString();
    selectReturns({ data: { locked_until: until, consecutive_failures: 5 }, error: null });
    const state = await checkLockout('user@acme.com');
    expect(state.locked).toBe(true);
    expect(state.minutesRemaining).toBeGreaterThan(0);
    expect(state.consecutiveFailures).toBe(5);
    expect(mockFrom).toHaveBeenCalledWith('auth_lockouts');
  });

  it('reports unlocked when no row exists', async () => {
    selectReturns({ data: null, error: null });
    const state = await checkLockout('fresh@acme.com');
    expect(state).toEqual({
      locked: false,
      minutesRemaining: 0,
      consecutiveFailures: 0,
      degraded: false,
    });
  });

  it('fails OPEN and flags degraded when the store errors', async () => {
    selectReturns({ data: null, error: { message: 'relation does not exist' } });
    const state = await checkLockout('user@acme.com');
    expect(state.locked).toBe(false);
    expect(state.degraded).toBe(true);
  });

  it('fails OPEN and flags degraded when the store throws', async () => {
    selectThrows(new Error('ECONNREFUSED'));
    const state = await checkLockout('user@acme.com');
    expect(state.locked).toBe(false);
    expect(state.degraded).toBe(true);
  });

  it('is a no-op when Supabase is not configured (dev/demo)', async () => {
    mockConfigured.mockReturnValue(false);
    const state = await checkLockout('user@acme.com');
    expect(state.locked).toBe(false);
    expect(state.degraded).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('registerFailure', () => {
  it('counts and locks in ONE statement, passing the named constants', async () => {
    mockRpc.mockResolvedValue({ data: [{ locked_until: null, consecutive_failures: 1 }], error: null });
    await registerFailure('user@acme.com');
    expect(mockRpc).toHaveBeenCalledWith('register_auth_failure', {
      p_email_hash: lockoutKey('user@acme.com'),
      p_threshold: LOCKOUT_THRESHOLD,
      p_lock_minutes: LOCKOUT_MINUTES,
    });
  });

  it('does not lock below the threshold', async () => {
    mockRpc.mockResolvedValue({
      data: [{ locked_until: null, consecutive_failures: LOCKOUT_THRESHOLD - 1 }],
      error: null,
    });
    const state = await registerFailure('user@acme.com');
    expect(state.locked).toBe(false);
    expect(state.consecutiveFailures).toBe(LOCKOUT_THRESHOLD - 1);
  });

  it('locks when the RPC returns a lock_until at the threshold', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          locked_until: new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString(),
          consecutive_failures: LOCKOUT_THRESHOLD,
        },
      ],
      error: null,
    });
    const state = await registerFailure('user@acme.com');
    expect(state.locked).toBe(true);
    expect(state.minutesRemaining).toBeGreaterThan(0);
    expect(state.minutesRemaining).toBeLessThanOrEqual(LOCKOUT_MINUTES);
  });

  it('accepts a bare object as well as a single-row set', async () => {
    mockRpc.mockResolvedValue({ data: { locked_until: null, consecutive_failures: 2 }, error: null });
    expect((await registerFailure('user@acme.com')).consecutiveFailures).toBe(2);
  });

  it('sends the hash, never the address', async () => {
    mockRpc.mockResolvedValue({ data: [{ locked_until: null, consecutive_failures: 1 }], error: null });
    await registerFailure('rachel@clinic.example');
    expect(JSON.stringify(mockRpc.mock.calls[0])).not.toContain('rachel@clinic.example');
  });

  it('fails OPEN when the RPC errors — an outage must not lock everyone out', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'function does not exist' } });
    const state = await registerFailure('user@acme.com');
    expect(state.locked).toBe(false);
    expect(state.degraded).toBe(true);
  });

  it('fails OPEN when the RPC throws', async () => {
    mockRpc.mockRejectedValue(new Error('timeout'));
    const state = await registerFailure('user@acme.com');
    expect(state).toEqual({
      locked: false,
      minutesRemaining: 0,
      consecutiveFailures: 0,
      degraded: true,
    });
  });
});

describe('clearFailures — what makes the count CONSECUTIVE', () => {
  it('deletes the row for the hashed address', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    mockDelete.mockReturnValue({ eq });
    mockFrom.mockReturnValue({ delete: mockDelete });
    await clearFailures('user@acme.com');
    expect(mockFrom).toHaveBeenCalledWith('auth_lockouts');
    expect(eq).toHaveBeenCalledWith('email_hash', lockoutKey('user@acme.com'));
  });

  it('swallows a store failure — a successful sign-in must still succeed', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('down');
    });
    await expect(clearFailures('user@acme.com')).resolves.toBeUndefined();
  });

  it('is a no-op when Supabase is not configured', async () => {
    mockConfigured.mockReturnValue(false);
    await clearFailures('user@acme.com');
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
