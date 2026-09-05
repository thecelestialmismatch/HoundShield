import { describe, expect, it, vi, beforeEach } from 'vitest'

/*
 * The admin health route must do two things that the previous version did not:
 *
 *  1. Stay fail-closed. A missing session or a non-admin gets a 404 — not a
 *     403, which would confirm the endpoint exists.
 *  2. Actually REPORT. Until 2026-09-03 this route returned a hardcoded
 *     `status: 'ok'` and never touched `buildHealthReport()`, which meant the
 *     integration check named in CLAUDE.md's Session Start Protocol answered
 *     "ok" no matter which control was broken. These tests fail if it ever
 *     regresses to a constant.
 */

const { getSessionUser, isAdmin, buildHealthReport } = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  isAdmin: vi.fn(),
  buildHealthReport: vi.fn(),
}))

vi.mock('@/lib/auth/session', () => ({ getSessionUser }))
vi.mock('@/lib/admin/role', () => ({ isAdmin }))
vi.mock('@/lib/health/service-status', () => ({ buildHealthReport }))
vi.mock('@/lib/auth/auth-config', () => ({ isBetterAuthEnabled: () => false }))
vi.mock('@/lib/supabase/client', () => ({ isSupabaseConfigured: () => true }))

import { GET } from '../route'

const HEALTHY = {
  services: { database: 'connected', ai_router: 'connected' },
  degraded: [],
}

const DEGRADED = {
  services: {
    database: 'connected',
    rate_limit_store: 'missing_migration',
    reset_code_pepper: 'unset',
  },
  degraded: ['rate_limit_store', 'reset_code_pepper'],
}

beforeEach(() => {
  vi.clearAllMocks()
  buildHealthReport.mockResolvedValue(HEALTHY)
})

describe('GET /api/admin/health — the gate', () => {
  it('404s an anonymous caller and never builds a report', async () => {
    getSessionUser.mockResolvedValue(null)

    const res = await GET()

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
    // Fail closed BEFORE doing any database work.
    expect(buildHealthReport).not.toHaveBeenCalled()
  })

  it('404s a signed-in non-admin', async () => {
    getSessionUser.mockResolvedValue({ id: 'user-1' })
    isAdmin.mockResolvedValue(false)

    const res = await GET()

    expect(res.status).toBe(404)
    expect(buildHealthReport).not.toHaveBeenCalled()
  })

  it('never caches, so a stale "ok" cannot be served during an incident', async () => {
    getSessionUser.mockResolvedValue({ id: 'admin-1' })
    isAdmin.mockResolvedValue(true)

    const res = await GET()

    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })
})

describe('GET /api/admin/health — the report', () => {
  beforeEach(() => {
    getSessionUser.mockResolvedValue({ id: 'admin-1' })
    isAdmin.mockResolvedValue(true)
  })

  it('reports ok, with the probed services, when nothing is degraded', async () => {
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('ok')
    expect(body.degraded).toEqual([])
    expect(body.services).toEqual(HEALTHY.services)
  })

  it('reports degraded and NAMES the failing controls', async () => {
    buildHealthReport.mockResolvedValue(DEGRADED)

    const res = await GET()
    const body = await res.json()

    // The regression this route existed to prevent: answering "ok" while a
    // control store is missing its migration.
    expect(body.status).toBe('degraded')
    expect(body.degraded).toEqual(['rate_limit_store', 'reset_code_pepper'])
    expect(body.services.rate_limit_store).toBe('missing_migration')
  })

  it('actually calls the health builder rather than returning a constant', async () => {
    buildHealthReport.mockResolvedValue(DEGRADED)
    await GET()
    expect(buildHealthReport).toHaveBeenCalledTimes(1)
  })

  it('still carries the auth-provider diagnostics it reported before', async () => {
    const body = await (await GET()).json()
    expect(body.diagnostics).toEqual({
      authProvider: 'supabase-auth',
      supabaseConfigured: true,
    })
  })
})
