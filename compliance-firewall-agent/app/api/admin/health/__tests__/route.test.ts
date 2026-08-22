/**
 * GET /api/admin/health — the operator's control-degradation report.
 *
 * The regression this exists to stop is not a wrong status value; it is the
 * report going BACK to being dead code. `lib/health/service-status.ts` was
 * written to close audit finding #20c, arrived complete and tested, and then
 * sat with zero production callers — its own test file was the only thing that
 * ever ran it. The source-text guard in `app/__tests__/health-liveness-contract`
 * pins the auth gate; this one pins that the gate is protecting something.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockGetSessionUser, mockIsAdmin, mockBuildHealthReport } = vi.hoisted(() => ({
  mockGetSessionUser: vi.fn(),
  mockIsAdmin: vi.fn(),
  mockBuildHealthReport: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({ getSessionUser: () => mockGetSessionUser() }));
vi.mock('@/lib/admin/role', () => ({ isAdmin: (id: string) => mockIsAdmin(id) }));
vi.mock('@/lib/health/service-status', () => ({
  buildHealthReport: () => mockBuildHealthReport(),
}));

import { GET } from '@/app/api/admin/health/route';

const ADMIN = { id: 'admin-1' };

beforeEach(() => {
  mockGetSessionUser.mockReset().mockResolvedValue(ADMIN);
  mockIsAdmin.mockReset().mockResolvedValue(true);
  mockBuildHealthReport.mockReset().mockResolvedValue({ services: {}, degraded: [] });
});

describe('GET /api/admin/health', () => {
  it('404s an anonymous caller and never builds the report', async () => {
    mockGetSessionUser.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(404);
    // Not merely hidden — the probes never run, so an unauthenticated request
    // cannot use response timing to infer which datastores are reachable.
    expect(mockBuildHealthReport).not.toHaveBeenCalled();
  });

  it('404s a signed-in non-admin and never builds the report', async () => {
    mockIsAdmin.mockResolvedValue(false);
    const res = await GET();
    expect(res.status).toBe(404);
    expect(mockBuildHealthReport).not.toHaveBeenCalled();
  });

  it('serves the real report to an admin — not a hardcoded pair of booleans', async () => {
    mockBuildHealthReport.mockResolvedValue({
      services: { captcha: 'enforcing', database: 'connected' },
      degraded: [],
    });
    const res = await GET();
    const body = await res.json();

    expect(mockBuildHealthReport).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.degraded).toEqual([]);
    expect(body.diagnostics.services).toEqual({ captcha: 'enforcing', database: 'connected' });
  });

  it('reports degraded at the TOP level when a control is not doing its job', async () => {
    mockBuildHealthReport.mockResolvedValue({
      services: {
        captcha: 'not_configured',
        captcha_hint: 'TURNSTILE_SECRET_KEY is not set.',
      },
      degraded: ['captcha'],
    });
    const res = await GET();
    const body = await res.json();

    // Buried inside `diagnostics` an operator has to go looking for it. The
    // whole point of this endpoint is that it says so first.
    expect(body.status).toBe('degraded');
    expect(body.degraded).toContain('captcha');
    // The remediation hint has to survive the trip, or the operator learns that
    // something is wrong without learning which variable to set.
    expect(body.diagnostics.services.captcha_hint).toMatch(/TURNSTILE_SECRET_KEY/);
  });

  it('never caches — a stale green during an incident is worse than no page', async () => {
    const res = await GET();
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });
});
