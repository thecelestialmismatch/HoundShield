import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/*
 * ─── The defect this guards ────────────────────────────────────────────────
 *
 * There were two browser sign-outs and only one branched on the active auth
 * provider. `app/command-center/(tools)/settings/page.tsx` called Supabase's
 * `signOut()` unconditionally and ignored the result:
 *
 *     const supabase = createClient();
 *     await supabase.auth.signOut();   // no error check
 *     router.push('/login');
 *
 * Under `AUTH_PROVIDER=better-auth` that is a no-op against a Better Auth
 * session: the user is redirected to /login and told they signed out while the
 * session stays live on the server. Ignoring the error was the second half —
 * a failed revocation still redirected.
 *
 * The fix was not to patch the copy. `tasks/lessons.md` records `escapeHtml`
 * drifting across four copies, one of which had a real gap; the same shape
 * produced this bug. The provider branch now lives once in
 * `lib/auth/sign-out.ts`, and the structural test below fails the build if any
 * component calls a provider's signOut directly again.
 */

const APP = join(__dirname, '..', '..', '..')
const ROOTS = ['app', 'components'].map((d) => join(APP, d))

/**
 * Every .ts/.tsx under app/ and components/, EXCLUDING `app/api/**`.
 *
 * Server routes are deliberately out of scope. `lib/auth/sign-out.ts` is a
 * `"use client"` module and cannot be imported by a route handler, and a route
 * that calls `supabase.auth.signOut()` is doing something different from a user
 * pressing "Sign out". `app/api/auth/signup/route.ts` is the real example: it
 * discards the session Supabase mints when "Confirm email" is OFF, because the
 * Set-Cookie difference between a fresh and an existing address was an
 * enumeration oracle an attacker could read without parsing the body. That call
 * already fails loudly on error and is covered by the enumeration contract.
 *
 * Narrowing the walk here rather than allow-listing that file keeps the rule
 * honest: any NEW browser sign-out is still caught, and a future server-side
 * discard does not need an exception added.
 */
function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) {
      if (entry === '__tests__' || entry === 'node_modules') continue
      // app/api/** is server-side; see the note above.
      if (relative(APP, p).replace(/\\/g, '/') === 'app/api') continue
      sourceFiles(p, out)
    } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      out.push(p)
    }
  }
  return out
}

const FILES = ROOTS.flatMap((r) => sourceFiles(r))
const rel = (p: string) => relative(APP, p)

describe('browser sign-out has exactly one implementation', () => {
  it('finds a meaningful number of files to check', () => {
    // Guards against this whole suite passing because the walk broke.
    expect(FILES.length).toBeGreaterThan(100)
  })

  it('no component calls a provider signOut directly', () => {
    const offenders = FILES.filter((f) => {
      const src = readFileSync(f, 'utf8')
      // Supabase: `.auth.signOut(`  ·  Better Auth: an imported `signOut` call.
      const supabaseDirect = /\.auth\s*\.\s*signOut\s*\(/.test(src)
      const betterAuthDirect =
        /from\s+['"]@\/lib\/auth\/auth-client['"]/.test(src) && /\bsignOut\b/.test(src)
      return supabaseDirect || betterAuthDirect
    }).map(rel)

    expect(
      offenders,
      'These call a provider sign-out directly instead of signOutEverywhere() ' +
        'from lib/auth/sign-out.ts. That is how the settings page ended up ' +
        'redirecting to /login without ending a Better Auth session. Route the ' +
        'call through the shared helper so the provider branch cannot be forgotten.',
    ).toEqual([])
  })

  it('every sign-out call site imports the shared helper', () => {
    const callers = FILES.filter((f) => /signOutEverywhere\s*\(/.test(readFileSync(f, 'utf8')))
    // Both known call sites: the console button and the settings page.
    expect(callers.length).toBeGreaterThanOrEqual(2)
    for (const f of callers) {
      expect(
        readFileSync(f, 'utf8'),
        `${rel(f)} calls signOutEverywhere without importing it`,
      ).toMatch(/from\s+['"]@\/lib\/auth\/sign-out['"]/)
    }
  })

  it('no sign-out call site redirects without awaiting the result', () => {
    // The original bug in one assertion: a router.push that is not guarded by
    // the outcome of the sign-out. Every caller must await, and must not push
    // on the same statement.
    for (const f of FILES.filter((x) => /signOutEverywhere\s*\(/.test(readFileSync(x, 'utf8')))) {
      const src = readFileSync(f, 'utf8')
      expect(src, `${rel(f)} must await signOutEverywhere()`).toMatch(
        /await\s+signOutEverywhere\s*\(/,
      )
      expect(
        src,
        `${rel(f)} must handle a failed sign-out rather than redirecting anyway`,
      ).toMatch(/catch/)
    }
  })
})

describe('signOutEverywhere ends the session with the ACTIVE provider', () => {
  const betterAuthSignOut = vi.fn()
  const supabaseSignOut = vi.fn()

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    supabaseSignOut.mockResolvedValue({ error: null })
    betterAuthSignOut.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  async function load() {
    vi.doMock('@/lib/auth/auth-client', () => ({
      isBetterAuthClientEnabled: () =>
        (process.env.NEXT_PUBLIC_AUTH_PROVIDER ?? '').trim() === 'better-auth',
      signOut: betterAuthSignOut,
    }))
    vi.doMock('@/lib/supabase/browser', () => ({
      createClient: () => ({ auth: { signOut: supabaseSignOut } }),
    }))
    return (await import('../sign-out')).signOutEverywhere
  }

  it('uses Better Auth — and NOT Supabase — when Better Auth is the provider', async () => {
    vi.stubEnv('NEXT_PUBLIC_AUTH_PROVIDER', 'better-auth')
    const signOutEverywhere = await load()

    await signOutEverywhere()

    expect(betterAuthSignOut).toHaveBeenCalledTimes(1)
    // The regression: the settings page called this one under Better Auth,
    // which left the real session alive.
    expect(supabaseSignOut).not.toHaveBeenCalled()
  })

  it('uses Supabase when Better Auth is not selected', async () => {
    vi.stubEnv('NEXT_PUBLIC_AUTH_PROVIDER', '')
    const signOutEverywhere = await load()

    await signOutEverywhere()

    expect(supabaseSignOut).toHaveBeenCalledTimes(1)
    expect(betterAuthSignOut).not.toHaveBeenCalled()
  })

  it('throws when Supabase revocation fails, so the caller cannot redirect', async () => {
    vi.stubEnv('NEXT_PUBLIC_AUTH_PROVIDER', '')
    supabaseSignOut.mockResolvedValue({ error: new Error('network') })
    const signOutEverywhere = await load()

    await expect(signOutEverywhere()).rejects.toThrow('network')
  })

  it('propagates a Better Auth failure rather than reporting success', async () => {
    vi.stubEnv('NEXT_PUBLIC_AUTH_PROVIDER', 'better-auth')
    betterAuthSignOut.mockRejectedValue(new Error('revoke failed'))
    const signOutEverywhere = await load()

    await expect(signOutEverywhere()).rejects.toThrow('revoke failed')
  })
})
