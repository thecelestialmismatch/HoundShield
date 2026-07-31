import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * The activation checklist's "are you connected yet?" probe.
 *
 * Two things matter and both are security-or-honesty properties, not cosmetics:
 * the tenant boundary (the service-role client bypasses RLS, so the `user_id`
 * filter IS the isolation), and the direction it fails in (a broken probe must
 * never tick a step the operator did not complete).
 */

const mockGetSessionUser = vi.fn()
const mockIsConfigured = vi.fn(() => true)
const eq = vi.fn()
const select = vi.fn(() => ({ eq }))
const from = vi.fn(() => ({ select }))

vi.mock('@/lib/auth/session', () => ({ getSessionUser: () => mockGetSessionUser() }))
vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => mockIsConfigured(),
  createServiceClient: () => ({ from }),
}))

const { hasGatewayTraffic } = await import('../gateway-traffic')

/** The chain ends `.eq(...).limit(1)`; only the final result is awaited. */
function result(value: { count?: number | null; error?: { message: string } | null }) {
  eq.mockReturnValue({ limit: vi.fn(() => Promise.resolve({ count: null, error: null, ...value })) })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockIsConfigured.mockReturnValue(true)
  mockGetSessionUser.mockResolvedValue({ id: 'user-1' })
})

describe('hasGatewayTraffic — the tenant boundary', () => {
  it('scopes the count to the SESSION user, never a caller-supplied id', async () => {
    result({ count: 3 })
    await hasGatewayTraffic()
    expect(from).toHaveBeenCalledWith('compliance_events')
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1')
    // Exactly one filter: a second .eq would mean another identity crept in.
    expect(eq).toHaveBeenCalledTimes(1)
  })

  it('never queries at all without a session', async () => {
    mockGetSessionUser.mockResolvedValue(null)
    expect(await hasGatewayTraffic()).toBe(false)
    expect(from).not.toHaveBeenCalled()
  })

  it('reads no prompt metadata — a head count only', async () => {
    result({ count: 1 })
    await hasGatewayTraffic()
    expect(select).toHaveBeenCalledWith('id', { count: 'exact', head: true })
  })
})

describe('hasGatewayTraffic — answers honestly', () => {
  it('true only when the operator’s own gateway has events', async () => {
    result({ count: 12 })
    expect(await hasGatewayTraffic()).toBe(true)
  })

  it('false at zero', async () => {
    result({ count: 0 })
    expect(await hasGatewayTraffic()).toBe(false)
  })

  it('false when the count is missing rather than assuming traffic', async () => {
    result({ count: null })
    expect(await hasGatewayTraffic()).toBe(false)
  })

  it('FAILS CLOSED on a query error — never ticks a step nobody completed', async () => {
    result({ error: { message: 'connection refused' } })
    expect(await hasGatewayTraffic()).toBe(false)
  })

  it('fails closed when the session lookup throws', async () => {
    mockGetSessionUser.mockRejectedValue(new Error('auth unreachable'))
    expect(await hasGatewayTraffic()).toBe(false)
  })

  it('returns false in demo mode instead of querying a database that is not there', async () => {
    mockIsConfigured.mockReturnValue(false)
    expect(await hasGatewayTraffic()).toBe(false)
    expect(from).not.toHaveBeenCalled()
  })
})
