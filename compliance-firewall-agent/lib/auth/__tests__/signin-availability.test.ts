import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * "Try again in a moment" must never be shown for a condition that retrying
 * cannot change.
 *
 * The bug this pins: a Vercel PREVIEW build had NEXT_PUBLIC_SUPABASE_URL set but
 * NEXT_PUBLIC_SUPABASE_ANON_KEY missing. `createBrowserClient(url, '')` throws
 * synchronously, the catch treated it as a transient network blip, and the
 * founder retyped a correct password against a deployment that could never
 * accept it.
 */

const mockSupabaseConfigured = vi.fn()
const mockBetterAuth = vi.fn()

vi.mock('@/lib/supabase/client', () => ({ isSupabaseConfigured: () => mockSupabaseConfigured() }))
vi.mock('@/lib/auth/auth-client', () => ({ isBetterAuthClientEnabled: () => mockBetterAuth() }))

const { isSignInAvailable, SIGN_IN_UNAVAILABLE } = await import('../signin-availability')

beforeEach(() => {
  vi.clearAllMocks()
  mockSupabaseConfigured.mockReturnValue(true)
  mockBetterAuth.mockReturnValue(false)
})

describe('isSignInAvailable', () => {
  it('true when Supabase is configured', () => {
    expect(isSignInAvailable()).toBe(true)
  })

  it('FALSE when Supabase is unconfigured — the preview-deployment case', () => {
    mockSupabaseConfigured.mockReturnValue(false)
    expect(isSignInAvailable()).toBe(false)
  })

  it('true under Better Auth even with no Supabase — it is self-hosted at /api/auth', () => {
    mockSupabaseConfigured.mockReturnValue(false)
    mockBetterAuth.mockReturnValue(true)
    expect(isSignInAvailable()).toBe(true)
  })
})

describe('the message it produces', () => {
  it('does not tell the user to try again', () => {
    expect(SIGN_IN_UNAVAILABLE).not.toMatch(/try again|in a moment/i)
  })

  it('says the deployment is at fault, not the account', () => {
    expect(SIGN_IN_UNAVAILABLE).toMatch(/not configured|configuration/i)
    expect(SIGN_IN_UNAVAILABLE).toMatch(/not your account/i)
  })

  it('names no environment variable — this renders to end users', () => {
    // The remedy belongs to whoever owns the deployment, and leaking internal
    // variable names into a customer-facing error helps nobody who sees it.
    expect(SIGN_IN_UNAVAILABLE).not.toMatch(/NEXT_PUBLIC|SUPABASE|env|vercel/i)
  })
})
