/**
 * The dashboard's load time, as a test.
 *
 * `supabase.auth.getUser()` is a NETWORK call to the GoTrue `/user` endpoint —
 * that is precisely why Supabase tells you to trust it on a server over the
 * locally-decoded `getSession()`. It costs a round-trip every single time.
 *
 * Rendering /command-center/overview used to make three of them, in series:
 *
 *   1. app/command-center/layout.tsx  — the fail-closed gate
 *   2. the page, via getSessionProfile('full_name')
 *   3. hasGatewayTraffic(), which resolves the session again for its tenant filter
 *
 * Three sequential auth round-trips before one byte of HTML streamed. On a phone
 * over mobile data that is the shield-and-progress-bar splash the founder
 * reported on 2026-08-07.
 *
 * The fix is React `cache()` on the export, which memoizes per REQUEST. This
 * file proves it, because the failure mode is completely invisible: without the
 * wrapper every caller still returns the correct user, just slowly. Nothing
 * breaks, nothing logs, the page is simply sluggish forever.
 *
 * ── Why this file mocks `react` ──────────────────────────────────────────────
 * `cache()` only memoizes in React's **react-server** build, and only inside a
 * cache scope supplied by the renderer (`ReactSharedInternals.A`). Next.js
 * resolves that build and opens that scope once per request; Vitest resolves the
 * *client* build, whose `cache()` is a bare passthrough. So a naive test here
 * would see three calls and "fail" against correct code.
 *
 * Rather than assert something weaker, the two lines Next.js provides are
 * reproduced honestly: `react` is mocked to the same react-server build Next
 * loads, and each `request()` below opens a fresh cache scope the way a render
 * does. Everything else is the real, unmodified lib/auth/session.ts.
 *
 * The properties proven are the ones that make request-scoped caching SAFE on an
 * authorization primitive, and those matter more than the speed:
 *   - callers within one request share a single round-trip
 *   - a NEW request re-resolves (no cross-request bleed — user A's session must
 *     never be served to user B)
 *   - a null result is cached too, so a signed-out visitor cannot fan out N
 *     auth calls per render
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoisted so the module factories below can reach them.
const h = vi.hoisted(() => ({ calls: 0, user: null as unknown }))

/**
 * Load React the way Next.js does for Server Components: the `react-server`
 * condition of the `react` package. Its `cache()` is the real implementation;
 * the default (client) condition ships a passthrough that never memoizes.
 */
vi.mock('react', async () => {
  const { createRequire } = await import('node:module')
  const path = (await import('node:path')).default
  const req = createRequire(import.meta.url)
  const reactDir = path.dirname(req.resolve('react/package.json'))
  return req(path.join(reactDir, 'react.react-server.js'))
})

vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
vi.mock('../better-auth', () => ({
  getAuth: () => null,
  isBetterAuthEnabled: () => false,
}))
vi.mock('@/lib/supabase/client', () => ({ isSupabaseConfigured: () => true }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      // The expensive call. Counting it IS the test.
      getUser: async () => {
        h.calls += 1
        return { data: { user: h.user } }
      },
    },
  }),
}))

/**
 * One request: a fresh React cache scope, exactly what the renderer opens per
 * request, wrapped around the caller's work. Two `request()` calls are two
 * different requests and must not share a cached session.
 */
async function request<T>(work: () => Promise<T>): Promise<T> {
  const React = (await import('react')) as unknown as Record<string, unknown>
  const internals = React.__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE as {
    A: unknown
  }
  const previous = internals.A
  const store = new Map<() => unknown, unknown>()
  internals.A = {
    getCacheForType(create: () => unknown) {
      if (!store.has(create)) store.set(create, create())
      return store.get(create)
    },
    cacheSignal: () => null,
  }
  try {
    return await work()
  } finally {
    internals.A = previous
  }
}

const ALICE = {
  id: 'u-alice',
  email: 'alice@example.com',
  user_metadata: { full_name: 'Alice Nguyen' },
}

beforeEach(() => {
  h.calls = 0
  h.user = ALICE
})

describe('getSessionUser request cache', () => {
  it('hits the auth backend once no matter how many callers ask', async () => {
    const { getSessionUser } = await import('../session')

    const seen = await request(async () => {
      // Exactly the /command-center/overview render: the fail-closed gate, then
      // the page's greeting, then the tenant filter inside hasGatewayTraffic.
      const gate = await getSessionUser()
      const page = await getSessionUser()
      const tenantFilter = await getSessionUser()
      return { gate, page, tenantFilter }
    })

    expect(h.calls).toBe(1)
    expect(seen.gate?.id).toBe('u-alice')
    expect(seen.page).toEqual(seen.gate)
    expect(seen.tenantFilter).toEqual(seen.gate)
  })

  it('dedupes concurrent callers too, not just sequential ones', async () => {
    const { getSessionUser } = await import('../session')

    const [a, b, c] = await request(() =>
      Promise.all([getSessionUser(), getSessionUser(), getSessionUser()]),
    )

    // Without the wrapper these three race into three simultaneous round-trips.
    expect(h.calls).toBe(1)
    expect(a).toEqual(b)
    expect(b).toEqual(c)
  })

  it("does not leak one request's session into the next", async () => {
    const { getSessionUser } = await import('../session')

    const first = await request(() => getSessionUser())
    expect(first?.email).toBe('alice@example.com')

    // New request, different signed-in user. The cache must not answer for Alice.
    h.user = { id: 'u-bob', email: 'bob@example.com', user_metadata: { full_name: 'Bob Ortiz' } }
    const second = await request(() => getSessionUser())

    expect(second?.email).toBe('bob@example.com')
    expect(h.calls).toBe(2)
  })

  it('caches the signed-out answer, so a guest cannot fan out N auth calls', async () => {
    h.user = null
    const { getSessionUser } = await import('../session')

    const results = await request(async () => [
      await getSessionUser(),
      await getSessionUser(),
      await getSessionUser(),
    ])

    expect(results).toEqual([null, null, null])
    expect(h.calls).toBe(1)
  })

  it('still reads the display name off user_metadata', async () => {
    const { getSessionUser } = await import('../session')
    const user = await request(() => getSessionUser())
    expect(user?.name).toBe('Alice Nguyen')
  })

  it('is a no-op passthrough outside a request scope, never a cross-user cache', async () => {
    const { getSessionUser } = await import('../session')

    // No scope open (a plain script, a test, a non-RSC runtime): React's cache()
    // falls back to calling straight through. Slower, never wrong — which is the
    // property that makes this safe to put on an auth primitive at all.
    await getSessionUser()
    await getSessionUser()

    expect(h.calls).toBe(2)
  })
})

describe('the dashboard page no longer queries a column it discards', () => {
  it('resolves its greeting from the session, not a profiles select', async () => {
    const { readFileSync } = await import('node:fs')
    const path = (await import('node:path')).default
    const src = readFileSync(
      path.join(__dirname, '../../../app/command-center/(tools)/overview/page.tsx'),
      'utf8',
    )

    // It used to import getSessionProfile, ask for 'full_name', then read
    // `user.name` off the session anyway — paying for a database round-trip on
    // every dashboard load whose payload was dropped on the very next line.
    expect(src).not.toMatch(/from '@\/lib\/auth\/profile'/)
    expect(src).toMatch(/getSessionUser\(\)/)
  })
})
