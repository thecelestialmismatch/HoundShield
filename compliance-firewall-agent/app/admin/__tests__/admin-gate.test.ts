import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'

/**
 * The /admin gate, tested as the cross-tenant boundary it is.
 *
 * Everything under /admin reads WITHOUT a `user_id` filter — every customer's
 * orders, signups and gateway volume. A hole here is not one account's data, it
 * is all of them. So this file checks behaviour (does a customer get in?) and
 * structure (can the panel still be prerendered? does anything link to it?),
 * because the 2026-07-29 dashboard incident was a structural failure that no
 * behavioural test would have caught: the pages were correct, and Vercel served
 * them from the CDN to anonymous visitors anyway.
 */

const ADMIN_DIR = path.resolve(__dirname, '..')
const CFA = path.resolve(ADMIN_DIR, '../..')
const read = (p: string) => readFileSync(path.join(CFA, p), 'utf8')

const h = vi.hoisted(() => ({
  user: null as { id: string; email: string | null; name: string | null } | null,
  role: 'user' as string,
  roleThrows: false,
  redirected: [] as string[],
}))

vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    h.redirected.push(to)
    // Next's redirect() throws to halt rendering. Model that, or a test can
    // "pass" while the page body below the guard still executed.
    throw new Error(`NEXT_REDIRECT:${to}`)
  },
}))
vi.mock('@/lib/auth/session', () => ({ getSessionUser: async () => h.user }))
vi.mock('@/lib/admin/role', () => ({
  getViewerRole: async () => {
    if (h.roleThrows) throw new Error('database unreachable')
    return h.role
  },
}))

const ALICE = { id: 'u-alice', email: 'alice@example.com', name: 'Alice' }

async function enter() {
  const { default: AdminAuthLayout } = await import('../layout')
  return AdminAuthLayout({ children: null })
}

beforeEach(() => {
  h.user = null
  h.role = 'user'
  h.roleThrows = false
  h.redirected = []
  vi.resetModules()
})

describe('who gets in', () => {
  it('lets an admin through', async () => {
    h.user = ALICE
    h.role = 'admin'
    await expect(enter()).resolves.toBeDefined()
    expect(h.redirected).toEqual([])
  })

  it('sends a signed-out visitor to login', async () => {
    await expect(enter()).rejects.toThrow(/NEXT_REDIRECT/)
    expect(h.redirected[0]).toBe('/login?redirect=%2Fadmin')
  })

  it('sends a signed-in CUSTOMER to their own dashboard, not to a 403', async () => {
    h.user = ALICE
    h.role = 'user'
    await expect(enter()).rejects.toThrow(/NEXT_REDIRECT/)
    // A 403 confirms the URL exists and is worth attacking. The panel is
    // unlinked and noindex; a customer should simply land on their own page.
    expect(h.redirected[0]).toBe('/command-center/overview')
  })

  it.each(['consultant', 'ADMIN', 'admin ', 'superuser', ''])(
    'denies role %j — only exactly "admin" passes',
    async (role) => {
      h.user = ALICE
      h.role = role
      await expect(enter()).rejects.toThrow(/NEXT_REDIRECT/)
    },
  )
})

describe('it fails closed, not open', () => {
  it('denies when the role lookup throws', async () => {
    h.user = ALICE
    h.roleThrows = true
    // A transient database outage must deny, never grant. The panel reads every
    // tenant's data; "we could not check" cannot mean "let them in".
    await expect(enter()).rejects.toThrow()
    expect(h.redirected).not.toContain('/admin')
  })

  it('denies when there is a role but no session', async () => {
    h.user = null
    h.role = 'admin'
    await expect(enter()).rejects.toThrow(/NEXT_REDIRECT/)
    expect(h.redirected[0]).toBe('/login?redirect=%2Fadmin')
  })
})

describe('structure — the failure mode a behavioural test cannot see', () => {
  const layout = read('app/admin/layout.tsx')

  it('renders per request, so the subtree can never be served from the CDN', () => {
    // On 2026-07-29 /command-center was prerendered to static HTML and served
    // by Vercel to anonymous visitors with the gate never running. Same class
    // of bug, far worse blast radius here.
    expect(layout).toMatch(/export const dynamic = ['"]force-dynamic['"]/)
    expect(read('app/admin/page.tsx')).toMatch(/export const dynamic = ['"]force-dynamic['"]/)
  })

  it('is noindex', () => {
    expect(layout).toMatch(/robots:\s*\{\s*index:\s*false/)
  })

  it('resolves the role from the database, never from the session token', () => {
    // Supabase user_metadata is writable by the user in some flows, so a role
    // read off the session is a role the user can grant themselves.
    const role = read('lib/admin/role.ts')
    expect(role).toMatch(/from\(['"]profiles['"]\)/)
    expect(role).toMatch(/select\(['"]role['"]\)/)
    expect(layout).not.toMatch(/user_metadata/)
  })

  it('has exactly one gate — every route under /admin sits below the layout', () => {
    // A page in a sibling folder, or a route group that escapes this layout,
    // would be an ungated cross-tenant reader.
    const routes: string[] = []
    const walk = (dir: string, rel: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (!e.isDirectory() || e.name === '__tests__') continue
        walk(path.join(dir, e.name), `${rel}/${e.name}`)
      }
      if (existsSync(path.join(dir, 'page.tsx')) || existsSync(path.join(dir, 'route.ts'))) {
        routes.push(rel || '/')
      }
    }
    walk(ADMIN_DIR, '')
    expect(routes.length).toBeGreaterThan(0)
    // No nested route group may reintroduce its own layout-free branch.
    for (const r of routes) expect(r).not.toMatch(/\(/)
  })
})

describe('the cross-tenant reader is only reachable from behind the gate', () => {
  it('is imported by /admin and by nothing else', () => {
    // lib/admin/founder-metrics.ts reads with NO user_id filter. Importing it
    // from any customer-facing route is an instant cross-tenant leak.
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name)
        if (e.isDirectory()) {
          if (['node_modules', '.next', '__tests__'].includes(e.name)) continue
          walk(full)
          continue
        }
        if (!/\.tsx?$/.test(e.name) || /\.(test|spec)\./.test(e.name)) continue
        const rel = path.relative(CFA, full)
        if (rel.startsWith('app/admin') || rel.startsWith('lib/admin')) continue
        if (readFileSync(full, 'utf8').includes('founder-metrics')) offenders.push(rel)
      }
    }
    for (const d of ['app', 'components', 'lib']) walk(path.join(CFA, d))

    expect(
      offenders,
      `founder-metrics reads every tenant with no user_id filter and is only safe behind ` +
        `the /admin role gate. These files import it from outside:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('is marked server-only so it can never reach a client bundle', () => {
    expect(read('lib/admin/founder-metrics.ts')).toMatch(/^import 'server-only'/m)
    expect(read('lib/admin/role.ts')).toMatch(/^import 'server-only'/m)
  })

  it('is not linked from any customer surface', () => {
    // Not a security control — the gate is. But an unlinked panel is not in
    // anyone's crawl path or muscle memory, which is defence in depth for free.
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name)
        if (e.isDirectory()) {
          if (['node_modules', '.next', '__tests__'].includes(e.name)) continue
          walk(full)
          continue
        }
        if (!/\.tsx?$/.test(e.name) || /\.(test|spec)\./.test(e.name)) continue
        const rel = path.relative(CFA, full)
        if (rel.startsWith('app/admin')) continue
        if (/href[:=]\s*["'`]\/admin\b/.test(readFileSync(full, 'utf8'))) offenders.push(rel)
      }
    }
    for (const d of ['app', 'components', 'lib']) walk(path.join(CFA, d))
    expect(offenders).toEqual([])
  })
})
