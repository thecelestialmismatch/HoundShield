/**
 * GUARD: requirement 3 — "verified email ownership before an account becomes
 * active" — is enforced by code, not by a dashboard toggle.
 *
 * WHY THE GUARD IS THE RIGHT PLACE. "Active" has to mean something a route
 * refuses, or the requirement is a statement about Supabase's settings page
 * rather than about this system. With "Confirm email" OFF, `signUp` mints a
 * live session immediately for an address nobody has proved they own, and every
 * `requireUser()` route would have accepted it. Checking here means the rule
 * holds however the session was obtained, in one place instead of ~40 handlers.
 *
 * The sibling file email-verification-required.test.ts covers the Better Auth
 * CONFIG (dormant, gated on AUTH_PROVIDER). This file covers the guard that
 * runs on the ACTIVE Supabase path. Both are needed: config alone does not
 * protect the provider that is actually serving traffic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  sessionUser: null as null | {
    id: string;
    email: string | null;
    name: string | null;
    emailVerified: boolean;
  },
}));

vi.mock('../session', () => ({ getSessionUser: async () => h.sessionUser }));

// Role lookup is not under test; make it inert and least-privileged.
vi.mock('@/lib/supabase/client', () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
    }),
  }),
}));

vi.mock('../auth-config', () => ({
  isBetterAuthEnabled: () => false,
  profileKeyColumn: () => 'id',
}));

const VERIFIED = { id: 'u-1', email: 'a@example.com', name: 'A', emailVerified: true };
const UNVERIFIED = { ...VERIFIED, emailVerified: false };

beforeEach(() => {
  h.sessionUser = null;
});

describe('requireUser', () => {
  it('401s when there is no session at all', async () => {
    const { requireUser } = await import('../api-guard');
    const result = await requireUser();
    expect(result.user).toBeNull();
    expect(result.response!.status).toBe(401);
  });

  it('403s a session whose email has not been verified', async () => {
    // The core case: a real, valid session that must still not transact.
    h.sessionUser = UNVERIFIED;
    const { requireUser } = await import('../api-guard');
    const result = await requireUser();
    expect(result.user).toBeNull();
    expect(result.response!.status).toBe(403);
  });

  it('gives the unverified case a distinguishable, actionable code', async () => {
    // Safe to be specific: the caller already authenticated, so this reveals
    // nothing about anyone else's account — and "go confirm your email" is
    // useless to a user if it arrives as a bare 403.
    h.sessionUser = UNVERIFIED;
    const { requireUser } = await import('../api-guard');
    const result = await requireUser();
    const body = await result.response!.json();
    expect(body.code).toBe('email_unverified');
  });

  it('admits a verified session', async () => {
    h.sessionUser = VERIFIED;
    const { requireUser } = await import('../api-guard');
    const result = await requireUser();
    expect(result.response).toBeNull();
    expect(result.user).toMatchObject({ id: 'u-1', email: 'a@example.com' });
  });

  it('defaults to the least-privileged role when the lookup returns nothing', async () => {
    h.sessionUser = VERIFIED;
    const { requireUser } = await import('../api-guard');
    const result = await requireUser();
    expect(result.user!.role).toBe('user');
  });
});

describe('requireRole inherits the verification check', () => {
  it('refuses an unverified session before it ever considers the role', async () => {
    // Otherwise an unverified admin would pass a role gate that a verified
    // ordinary user could not.
    h.sessionUser = UNVERIFIED;
    const { requireRole } = await import('../api-guard');
    const result = await requireRole(['admin', 'user']);
    expect(result.user).toBeNull();
    expect(result.response!.status).toBe(403);
  });
});

describe('the verified flag is not something a caller can supply', () => {
  it('is read from the session resolver, never from a request', async () => {
    // Source-level: api-guard must take emailVerified off the resolved session
    // object. If it ever reads a header or body field, this fails.
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const src = readFileSync(join(process.cwd(), 'lib/auth/api-guard.ts'), 'utf8');
    expect(src).toMatch(/sessionUser\.emailVerified/);
    expect(src).not.toMatch(/request\.headers|req\.headers|body\.emailVerified/);
  });
});
