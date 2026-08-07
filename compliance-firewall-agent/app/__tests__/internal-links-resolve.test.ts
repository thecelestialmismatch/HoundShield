import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

/**
 * Every internal link in the product must land on a page that exists.
 *
 * There was no check for this, and the cost of not having one is silent: a
 * `<Link href="/command-center/feed">` compiles, type-checks, lints clean, ships,
 * and 404s only when a customer clicks it. The founder hit exactly this class of
 * bug on 2026-08-07 (a URL the product hands out, answering 404) and asked for
 * the links to be verified — so the verification is a test rather than an
 * afternoon of clicking.
 *
 * The route table is built from the App Router filesystem the same way Next
 * builds it: `page.tsx`/`route.ts` marks a routable segment, `(groups)` are
 * transparent and never appear in the URL, `[param]` matches one segment,
 * `[...catchAll]` matches the rest, and `_private` folders are not routes.
 *
 * WHAT IS CHECKED — string literals only: `href="/x"`, `redirect('/x')`,
 * `router.push('/x')`. A computed href (`href={buildUrl(row)}`) is out of scope;
 * catching those needs types, not greps, and a grep that pretends otherwise
 * gives false confidence. 80-odd literals is the great majority of the surface.
 */

const CFA = path.resolve(__dirname, '../..')
const APP = path.join(CFA, 'app')

// ── the route table ─────────────────────────────────────────────────────────

const ROUTE_FILES = ['page.tsx', 'page.ts', 'route.ts', 'route.tsx']

function buildRoutes(): string[][] {
  const routes: string[][] = [[]] // the root page
  const walk = (dir: string, segs: string[]) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const name = entry.name
      // `_private` folders and `@slots` are never URL segments; `__tests__` is ours.
      if (name.startsWith('_') || name.startsWith('@') || name === '__tests__') continue

      const next = path.join(dir, name)
      // A (group) is organisational only — it never appears in the path.
      const isGroup = name.startsWith('(') && name.endsWith(')')
      const nextSegs = isGroup ? segs : [...segs, name]

      if (ROUTE_FILES.some((f) => existsSync(path.join(next, f)))) routes.push(nextSegs)
      walk(next, nextSegs)
    }
  }
  walk(APP, [])
  return routes
}

const ROUTES = buildRoutes()

function routeMatches(pathSegs: string[], route: string[]): boolean {
  let i = 0
  for (const seg of route) {
    if (seg.startsWith('[[...') || seg.startsWith('[...')) return true // catch-all swallows the rest
    if (seg.startsWith('[')) {
      if (i >= pathSegs.length) return false
      i++
      continue
    }
    if (pathSegs[i] !== seg) return false
    i++
  }
  return i === pathSegs.length
}

function resolves(urlPath: string): boolean {
  const segs = urlPath.split('/').filter(Boolean)
  return ROUTES.some((r) => routeMatches(segs, r))
}

// ── the links ───────────────────────────────────────────────────────────────

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  const walk = (d: string) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name)
      if (entry.isDirectory()) {
        if (['node_modules', '.next', '__tests__'].includes(entry.name)) continue
        walk(full)
        continue
      }
      if (/\.tsx?$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name)) out.push(full)
    }
  }
  walk(dir)
  return out
}

/** `href="/x"`, `href: '/x'`, `redirect('/x')`, `router.push('/x')`. */
const PATTERNS = [
  /\bhref[:=]\s*["'`](\/[^"'`$\s]*)["'`]/g,
  /\bredirect\(\s*["'`](\/[^"'`$\s]*)["'`]/g,
  /\brouter\.(?:push|replace)\(\s*["'`](\/[^"'`$\s]*)["'`]/g,
]

function collectLinks(): Map<string, Set<string>> {
  const found = new Map<string, Set<string>>()
  const files = ['app', 'components', 'lib'].flatMap((d) => sourceFiles(path.join(CFA, d)))

  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    for (const pattern of PATTERNS) {
      for (const m of src.matchAll(pattern)) {
        // Strip the fragment and query — routing only sees the path.
        const urlPath = m[1].split('#')[0].split('?')[0]
        if (!urlPath || urlPath === '/') continue
        if (!found.has(urlPath)) found.set(urlPath, new Set())
        found.get(urlPath)!.add(path.relative(CFA, file))
      }
    }
  }
  return found
}

const LINKS = collectLinks()

describe('internal links', () => {
  it('found a route table and a meaningful number of links to check', () => {
    // If either collapses to nothing the suite would pass vacuously forever.
    expect(ROUTES.length).toBeGreaterThan(100)
    expect(LINKS.size).toBeGreaterThan(50)
  })

  it('every internal href, redirect and router.push resolves to a real route', () => {
    const broken = [...LINKS.entries()]
      .filter(([urlPath]) => !resolves(urlPath))
      .map(([urlPath, files]) => `${urlPath}  ←  ${[...files].sort().join(', ')}`)
      .sort()

    expect(broken, `dead internal links:\n${broken.join('\n')}`).toEqual([])
  })

  it('the gateway base URL path answers, rather than falling through to the 404 page', () => {
    // Printed in Settings with a copy button, in the docs, in the day-3 email
    // and by Brain AI. Pasting it in a browser is the first thing anyone does.
    expect(existsSync(path.join(APP, 'api/v1/route.ts'))).toBe(true)
    expect(resolves('/api/v1')).toBe(true)
  })
})

describe('the route table itself is built correctly', () => {
  it('treats a (group) as transparent', () => {
    // /command-center/(tools)/overview/page.tsx serves /command-center/overview.
    expect(existsSync(path.join(APP, 'command-center/(tools)/overview/page.tsx'))).toBe(true)
    expect(resolves('/command-center/overview')).toBe(true)
    expect(resolves('/command-center/(tools)/overview')).toBe(false)
  })

  it('matches a [dynamic] segment but not a missing one', () => {
    expect(resolves('/blog/anything-here')).toBe(true)
    expect(resolves('/definitely/not/a/real/page')).toBe(false)
  })

  it('does not route _private folders', () => {
    // _shell holds the Command Center sidebar/topbar components, not a page.
    expect(existsSync(path.join(APP, 'command-center/(tools)/_shell'))).toBe(true)
    expect(resolves('/command-center/_shell')).toBe(false)
  })
})
