/**
 * THE DATA RAIL — the chain that has to be unbroken for a customer's dashboard
 * to contain anything at all:
 *
 *   Settings mints a real key  →  the key authenticates the gateway
 *   →  the gateway RECORDS every decision in `compliance_events`
 *   →  /api/dashboard/overview reads `compliance_events` for that user
 *   →  the Command Center overview draws it.
 *
 * Every link in that chain was broken at once, and each break was invisible on
 * its own — which is why the dashboard looked like a UI problem for weeks when
 * it was really a plumbing problem:
 *
 *   1. Settings displayed a credential derived from the user's id that was
 *      never stored, so the gateway answered 401. `generateApiKey()` existed
 *      with no caller and `api_keys` had zero rows — no customer could obtain
 *      a key that worked.
 *   2. `POST /api/v1/chat/completions`, the rail customers actually point their
 *      client at, wrote NOTHING. It advertised a request id "for audit lookup"
 *      against a table that could never receive a row.
 *   3. The one path that did write, wrote twice for quarantines.
 *
 * These are source-level guards on purpose. The unit tests around each piece
 * prove behaviour; this file proves the pieces are still WIRED TO EACH OTHER,
 * which is the property that no single-component test can see and the one that
 * actually failed.
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import path from 'path'
import { GATEWAY_BASE_URL } from '@/lib/gateway/base-url'

const CFA = process.cwd()
const read = (rel: string) => readFileSync(path.join(CFA, rel), 'utf8')

/**
 * Source with comments stripped.
 *
 * These guards assert what the code DOES, and every file here documents the
 * bug it fixed — so the banned identifiers appear in the prose that explains
 * why they are banned. Scanning raw text would fail on the explanation and
 * quietly pressure the next author to delete the history. Scan the code.
 */
const codeOf = (rel: string) =>
  read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')

const V1_ROUTE = 'app/api/v1/chat/completions/route.ts'
const KEYS_ROUTE = 'app/api/gateway/keys/route.ts'
const RECORDER = 'lib/audit/record-decision.ts'

/** Every .ts/.tsx file under the app's own source roots. */
function sourceFiles(): string[] {
  const out: string[] = []
  const walk = (rel: string) => {
    for (const entry of readdirSync(path.join(CFA, rel), { withFileTypes: true })) {
      const child = path.join(rel, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
        walk(child)
      } else if (/\.tsx?$/.test(entry.name)) {
        out.push(child)
      }
    }
  }
  for (const root of ['app', 'components', 'lib']) walk(root)
  return out
}

describe('link 0 — the URL we hand the customer is one that answers', () => {
  // Probed against production 2026-08-05. Both branded hosts resolve to Vercel
  // edge IPs with no project attached and answer 404 on every path; only
  // GATEWAY_BASE_URL reaches the route (401 on a bad key — failing closed, which
  // means the router and the database were both reached).
  const DEAD_HOSTS = ['proxy.houndshield.com', 'gateway.houndshield.com']

  // base-url.ts is the single source of truth and documents both dead hosts in
  // its docstring; this file names them above to say what it is banning.
  const ALLOWED = new Set([
    'lib/gateway/base-url.ts',
    path.join('app', '__tests__', 'dashboard-data-rail.test.ts'),
  ])

  it('no source file advertises a gateway host that 404s', () => {
    const offenders: string[] = []
    for (const rel of sourceFiles()) {
      if (ALLOWED.has(rel)) continue
      // Comments stripped: several files narrate the dead hosts as the history
      // they exist to correct, and that history is worth keeping.
      // Backslashes stripped: the one that escaped the first sweep of this fix
      // was `proxy\.houndshield\.com` inside a test's regex literal.
      const code = codeOf(rel).replace(/\\/g, '')
      for (const host of DEAD_HOSTS) {
        if (code.includes(host)) offenders.push(`${rel} → ${host}`)
      }
    }
    // Eight copies of a dead string is how this shipped: FAQ answers, the
    // system prompt, a day-3 onboarding email, the docs page, Settings, the
    // dashboard copy button. Import GATEWAY_BASE_URL instead of adding a ninth.
    expect(offenders, `dead gateway host in source:\n${offenders.join('\n')}`).toEqual([])
  })

  it('the constant points at the origin that actually serves the route', () => {
    expect(GATEWAY_BASE_URL).toBe('https://www.houndshield.com/api/v1')
    expect(existsSync(path.join(CFA, 'app/api/v1/chat/completions/route.ts'))).toBe(true)
  })

  it('the surfaces that quote a base URL import it rather than spelling it out', () => {
    for (const rel of [
      'lib/brain-ai/faq.ts',
      'components/GlobalChat.tsx',
      'lib/email/templates/day3.ts',
      'app/docs/api-data.ts',
      'app/command-center/(tools)/settings/GatewayKeys.tsx',
      'components/dashboard/LiveCommandCenter.tsx',
    ]) {
      expect(codeOf(rel), `${rel} no longer sources its URL from base-url`).toMatch(
        /from ['"]@\/lib\/gateway\/base-url['"]/
      )
    }
  })
})

describe('link 1 — a customer can obtain a key that actually authenticates', () => {
  it('an issuance endpoint exists', () => {
    expect(existsSync(path.join(CFA, KEYS_ROUTE))).toBe(true)
  })

  it('it mints through the same generator the gateway resolves against', () => {
    // Any bespoke key-string builder here is the old bug wearing a new hat: the
    // gateway hashes the incoming key and looks it up, so the ONLY value that
    // can ever authenticate is one whose hash this route stored.
    const route = read(KEYS_ROUTE)
    expect(route).toContain('generateApiKey')
    expect(route).toContain('key_hash')
  })

  it('identity comes from the session, never from the request body', () => {
    const route = codeOf(KEYS_ROUTE)
    expect(route).toContain('requireUser')
    expect(route).toContain('auth.user.id')
    // A body-supplied owner would let any signed-in customer mint a key
    // scoped to someone else's telemetry.
    expect(route).not.toMatch(/user_id:\s*body\./)
  })

  it('Settings reaches that endpoint instead of building a string locally', () => {
    const ui = read('app/command-center/(tools)/settings/GatewayKeys.tsx')
    expect(ui).toContain('/api/gateway/keys')
  })

  it('and it will not issue a key to a plan the gateway rejects', () => {
    // Both ends must consult the SAME predicate. If issuance skips it, a free
    // user gets a real, listed credential plus a curl snippet promising events
    // on their dashboard — and every request 402s forever.
    for (const rel of [KEYS_ROUTE, V1_ROUTE]) {
      expect(codeOf(rel), `${rel} does not gate on plan`).toContain('canAccessGateway')
    }
  })
})

describe('link 2 — the gateway records what it decides', () => {
  const route = read(V1_ROUTE)

  it('the OpenAI-compatible rail writes an audit record', () => {
    expect(route).toContain('recordGatewayDecision')
  })

  it('it records BEFORE it returns a block and before it forwards upstream', () => {
    // Ordering is the whole guarantee. If the record moved below the early
    // returns, BLOCKED and QUARANTINED — the two decisions that matter most to
    // an assessor — would silently stop being logged while ALLOWED kept working.
    const code = codeOf(V1_ROUTE)
    const recordAt = code.indexOf('recordGatewayDecision({')
    const blockAt = code.indexOf('compliance_blocked')
    const quarantineAt = code.indexOf('compliance_quarantined')
    // The CALL, not the declaration higher up the file.
    const upstreamAt = code.indexOf('return buildStreamingProxy(')

    expect(recordAt).toBeGreaterThan(-1)
    expect(upstreamAt).toBeGreaterThan(-1)
    expect(recordAt).toBeLessThan(blockAt)
    expect(recordAt).toBeLessThan(quarantineAt)
    expect(recordAt).toBeLessThan(upstreamAt)
  })

  it('it records under the SERVER-resolved user id', () => {
    // `resolved.userId` comes from the key hash. The x-user-id header is
    // caller-supplied and must never become the tenant key on an audit row.
    const code = codeOf(V1_ROUTE)
    expect(code).toMatch(/userId,/)
    expect(code).not.toMatch(/userId:\s*req\.headers\.get/)
  })

  it('it discloses whether the record landed', () => {
    expect(route).toContain('X-HoundShield-Audit')
    expect(route).toContain('degraded')
  })
})

describe('link 3 — exactly one event per decision', () => {
  it('quarantine attaches to an existing event instead of minting a rival one', () => {
    const handler = codeOf('lib/quarantine/handler.ts')
    // The signature is the guard: taking an eventId is what makes a second
    // insert impossible.
    expect(handler).toMatch(/eventId:\s*string/)
    expect(handler).toContain('event_id: eventId')
    expect(handler).not.toMatch(/from\("compliance_events"\)\s*\.insert/)
  })

  it('both gateway rails funnel through the one recorder', () => {
    expect(read('lib/interceptor/middleware.ts')).toContain('recordGatewayDecision')
    expect(read(V1_ROUTE)).toContain('recordGatewayDecision')
  })

  it('the recorder is the only place either rail writes an event', () => {
    for (const rel of [V1_ROUTE, 'lib/interceptor/middleware.ts']) {
      expect(codeOf(rel), `${rel} writes events directly`).not.toContain('logComplianceEvent')
    }
    expect(codeOf(RECORDER)).toContain('logComplianceEvent')
  })

  it('an audit failure degrades — it never throws into the proxy path', () => {
    const recorder = codeOf(RECORDER)
    expect(recorder).toContain('catch')
    // A rethrow here would turn a database blip into a 500 on a customer's
    // production AI traffic, on a request whose safety decision was already
    // made and enforced.
    expect(recorder).not.toMatch(/catch[\s\S]{0,300}\bthrow\b/)
  })
})

describe('link 4 — the dashboard reads what the gateway wrote', () => {
  it('the overview endpoint reads compliance_events, scoped to the session', () => {
    const route = read('app/api/dashboard/overview/route.ts')
    expect(route).toContain('compliance_events')
    expect(route).toContain('requireUser')
  })

  it('and it still has no seeded fallback — real or empty, never invented', () => {
    // Comments stripped: this file's own docstring NAMES the mockup datasets it
    // exists to keep out, and that history is worth keeping.
    const telemetry = codeOf('lib/dashboard/overview-telemetry.ts')
    expect(telemetry).toContain('emptyTelemetry')
    for (const seed of ['generateTokenData', 'providerBreakdown =', 'REVENUE_DATA']) {
      expect(telemetry, `seed "${seed}" is back`).not.toContain(seed)
    }
  })
})

describe('link 5 — that dashboard is where login lands', () => {
  it('every post-login redirect enters the command centre', () => {
    // The seven landings the #255/#256 work deliberately left pointing at
    // /command-center so no bookmark could go stale. If one of them is
    // repointed at a path that does not exist, a customer signs in to a 404.
    const landings: [string, string][] = [
      ['app/auth/callback/route.ts', "'/command-center'"],
      ['lib/auth/confirm-redirect.ts', "'/command-center'"],
      ['lib/auth/signup-result.ts', '"/command-center?welcome=true"'],
    ]
    for (const [file, target] of landings) {
      expect(read(file), `${file} no longer lands in the command centre`).toContain(target)
    }
  })

  it('and /command-center forwards to the real dashboard', () => {
    expect(read('app/command-center/page.tsx')).toMatch(
      /redirect\(['"]\/command-center\/overview['"]\)/
    )
    expect(read('app/command-center/(tools)/overview/page.tsx')).toContain('OperatorDashboard')
  })
})
