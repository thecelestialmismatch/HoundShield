/**
 * GUARD: the authentication audit trail (Phase 2 #14).
 *
 * HoundShield sells SHA-256 hash-chained evidence and control mappings, and
 * kept no durable record of its own sign-ins — only `console.log` into Vercel's
 * rolling retention, which is unqueryable, short-lived, and mutable by anyone
 * with project access. NIST 800-171 3.3.1 asks for records sufficient to
 * investigate unauthorized activity; an authentication event is the canonical
 * example, and a vendor failing AU.2.041 internally while grading customers on
 * it is the finding that costs a deal in the assessment room.
 *
 * The three properties asserted here are the ones that would each, alone,
 * make the trail worthless:
 *   NEVER PII      — an address, a raw IP or a raw UA in the table turns an
 *                    audit record into a breach payload.
 *   FAIL OPEN      — a store outage must not become an authentication outage…
 *   …LOUDLY        — …but silence would make "no rows" indistinguishable from
 *                    "no attacks", which is what an assessor is ruling out.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const h = vi.hoisted(() => ({
  inserted: [] as Record<string, unknown>[],
  error: null as { message: string } | null,
  configured: true,
}));

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => h.configured,
  createServiceClient: () => ({
    from: (table: string) => ({
      insert: async (row: Record<string, unknown>) => {
        h.inserted.push({ __table: table, ...row });
        return { error: h.error };
      },
    }),
  }),
}));

import { recordAuthEvent, hashIp, userAgentFamily } from '../audit-log';
import { lockoutKey } from '../lockout';

beforeEach(() => {
  h.inserted = [];
  h.error = null;
  h.configured = true;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('recordAuthEvent writes to its own table', () => {
  it('writes to auth_audit_events, never compliance_events', async () => {
    // compliance_events has a CHECK on action_taken and feeds the operator's
    // gateway dashboard. An auth row there would corrupt customer telemetry.
    await recordAuthEvent({ event: 'login_success', email: 'a@example.com' });
    expect(h.inserted[0].__table).toBe('auth_audit_events');
  });

  it('records the event type', async () => {
    await recordAuthEvent({ event: 'lockout_triggered', email: 'a@example.com' });
    expect(h.inserted[0].event_type).toBe('lockout_triggered');
  });
});

describe('the trail never stores personal data', () => {
  it('stores an email HASH, not the address', async () => {
    await recordAuthEvent({ event: 'login_failure', email: 'jordan@acme.com' });
    const row = h.inserted[0];
    expect(row.email_hash).toBe(lockoutKey('jordan@acme.com'));
    expect(JSON.stringify(row)).not.toContain('jordan@acme.com');
  });

  it('normalizes case so the hash correlates with auth_lockouts', async () => {
    await recordAuthEvent({ event: 'login_failure', email: 'Jordan@ACME.com' });
    expect(h.inserted[0].email_hash).toBe(lockoutKey('jordan@acme.com'));
  });

  it('stores an IP hash, not the address', async () => {
    await recordAuthEvent({ event: 'login_failure', email: 'a@example.com', ip: '203.0.113.9' });
    const row = h.inserted[0];
    expect(row.ip_hash).toBeTruthy();
    expect(JSON.stringify(row)).not.toContain('203.0.113.9');
  });

  it('stores a coarse UA family, not the raw header', async () => {
    // Raw UA strings routinely carry corporate build identifiers — itself
    // sensitive for a defence customer.
    const raw = 'Mozilla/5.0 (Windows NT 10.0; ACME-SOE-Build-4471) Chrome/120.0.0.0';
    await recordAuthEvent({ event: 'login_success', email: 'a@example.com', userAgent: raw });
    expect(h.inserted[0].user_agent).toBe('chrome');
    expect(JSON.stringify(h.inserted[0])).not.toContain('ACME-SOE-Build-4471');
  });

  it('leaves user_id null unless identity is already established', async () => {
    // A row that exists only for real accounts would prove account existence.
    await recordAuthEvent({ event: 'login_failure', email: 'a@example.com' });
    expect(h.inserted[0].user_id).toBeNull();
  });

  it('carries user_id when it is supplied', async () => {
    await recordAuthEvent({ event: 'login_success', email: 'a@example.com', userId: 'u-1' });
    expect(h.inserted[0].user_id).toBe('u-1');
  });
});

describe('hashIp', () => {
  it('is salted, so the small IPv4 space cannot be brute-forced back', async () => {
    // An unsalted SHA-256 of an IP is a plaintext IP with extra steps: the
    // whole space is enumerable in minutes.
    const before = process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'salt-one';
    const a = hashIp('203.0.113.9');
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'salt-two';
    const b = hashIp('203.0.113.9');
    expect(a).not.toBe(b);
    if (before === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = before;
  });

  it('returns null for an absent or unknown address rather than hashing a placeholder', () => {
    expect(hashIp(null)).toBeNull();
    expect(hashIp(undefined)).toBeNull();
    expect(hashIp('')).toBeNull();
    expect(hashIp('unknown')).toBeNull();
  });
});

describe('userAgentFamily', () => {
  // Edge and Opera both contain "Chrome"; order-dependent and easy to regress.
  it.each([
    ['Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36', 'chrome'],
    ['Mozilla/5.0 (Macintosh) Version/17.0 Safari/605.1.15', 'safari'],
    ['Mozilla/5.0 Firefox/121.0', 'firefox'],
    ['Mozilla/5.0 Chrome/120.0.0.0 Edg/120.0.0.0', 'edge'],
    ['Mozilla/5.0 Chrome/120.0.0.0 OPR/106.0.0.0', 'opera'],
    ['curl/8.4.0', 'tool'],
    ['python-requests/2.31.0', 'tool'],
  ])('classifies %s as %s', (ua, expected) => {
    expect(userAgentFamily(ua)).toBe(expected);
  });

  it('returns unknown for an absent header and other for an unrecognised one', () => {
    expect(userAgentFamily(null)).toBe('unknown');
    expect(userAgentFamily('')).toBe('unknown');
    expect(userAgentFamily('SomeNewBrowser/1.0')).toBe('other');
  });
});

describe('failure posture', () => {
  it('never throws when the store rejects the write', async () => {
    // An audit outage must not become an authentication outage.
    h.error = { message: 'relation "auth_audit_events" does not exist' };
    await expect(
      recordAuthEvent({ event: 'login_success', email: 'a@example.com' }),
    ).resolves.toBeUndefined();
  });

  it('logs at error level when the write fails', async () => {
    // "No rows" must never be silently indistinguishable from "no attacks".
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    h.error = { message: 'permission denied' };
    await recordAuthEvent({ event: 'login_failure', email: 'a@example.com' });
    expect(spy).toHaveBeenCalled();
    expect(String(spy.mock.calls[0][0])).toContain('[auth-audit]');
  });

  it('never logs the raw address when it fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    h.error = { message: 'permission denied' };
    await recordAuthEvent({ event: 'login_failure', email: 'jordan@acme.com' });
    expect(JSON.stringify(spy.mock.calls)).not.toContain('jordan@acme.com');
  });

  it('is a no-op when Supabase is not configured', async () => {
    h.configured = false;
    await recordAuthEvent({ event: 'login_success', email: 'a@example.com' });
    expect(h.inserted).toHaveLength(0);
  });
});

describe('the credential routes actually call it', () => {
  // A writer nothing invokes is not an audit trail.
  it.each([
    ['app/api/auth/login/route.ts', ['login_success', 'login_failure', 'lockout_triggered']],
    ['app/api/auth/signup/route.ts', ['signup_requested']],
    ['app/api/auth/reset-password/route.ts', ['password_reset_requested']],
  ])('%s records %s', async (rel, events) => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const src = readFileSync(join(process.cwd(), rel), 'utf8');
    expect(src).toMatch(/recordAuthEvent\(/);
    for (const event of events as string[]) {
      expect(src).toContain(`'${event}'`);
    }
  });

  it('writes them off the response path, so auditing adds no timing oracle', async () => {
    // Inline, the DB round-trip would land on the failure branch only.
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    for (const rel of [
      'app/api/auth/login/route.ts',
      'app/api/auth/signup/route.ts',
      'app/api/auth/reset-password/route.ts',
    ]) {
      const src = readFileSync(join(process.cwd(), rel), 'utf8');
      expect(src).toMatch(/after\(\(\)\s*=>\s*\n?\s*recordAuthEvent\(/);
    }
  });
});
