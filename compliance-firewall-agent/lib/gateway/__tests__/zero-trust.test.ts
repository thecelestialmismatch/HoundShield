import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ZeroTrustRule } from '../zero-trust'

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ from: mockFrom }),
}))

import {
  evaluateZeroTrust,
  isZeroTrustEnabled,
  loadZeroTrustRules,
  invalidateZeroTrustCache,
} from '../zero-trust'

/* ──────────────────────────────────────────────────────────────────
 * Zero-trust access decision.
 *
 * This is the allowlist that decides whether a request may reach an AI
 * provider at all — CMMC AC.1.001 / AC.1.002. It shipped with no tests.
 *
 * Writing them surfaced two real defects, both fixed alongside:
 *   1. Windows crossing midnight ("22:00-02:00") could never match,
 *      because the check was `>= start && <= end` on a range where end
 *      is numerically before start. Any org on a night shift was locked
 *      out, and the denial message told them they were outside business
 *      hours — technically true, permanently.
 *   2. A malformed rule value threw a TypeError out of the decision
 *      function instead of denying. Rule values are user-editable.
 *
 * The property every test here defends: an unclear answer is a DENIED
 * answer. Missing rules, unreadable rules and a dead database must all
 * narrow access, never widen it.
 * ────────────────────────────────────────────────────────────────── */

const ORG = 'org-1'

function rule(over: Partial<ZeroTrustRule> = {}): ZeroTrustRule {
  return {
    id: 'r1',
    org_id: ORG,
    rule_type: 'provider',
    value: 'openai',
    enabled: true,
    ...over,
  }
}

/** Wires the mocked Supabase query chain to resolve with `rules`. */
function withRules(rules: ZeroTrustRule[], error: { message: string } | null = null) {
  mockFrom.mockReturnValue({
    select: () => ({
      eq: () => ({
        eq: () => Promise.resolve({ data: error ? null : rules, error }),
      }),
    }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  invalidateZeroTrustCache(ORG)
  process.env.HOUNDSHIELD_ZERO_TRUST = 'true'
  withRules([])
})

afterEach(() => {
  delete process.env.HOUNDSHIELD_ZERO_TRUST
  invalidateZeroTrustCache(ORG)
  vi.useRealTimers()
})

describe('isZeroTrustEnabled', () => {
  it('is on only for the exact string "true"', () => {
    process.env.HOUNDSHIELD_ZERO_TRUST = 'true'
    expect(isZeroTrustEnabled()).toBe(true)

    for (const v of ['TRUE', '1', 'yes', 'false', '']) {
      process.env.HOUNDSHIELD_ZERO_TRUST = v
      expect(isZeroTrustEnabled(), `"${v}" must not enable zero-trust`).toBe(false)
    }

    delete process.env.HOUNDSHIELD_ZERO_TRUST
    expect(isZeroTrustEnabled()).toBe(false)
  })
})

describe('evaluateZeroTrust — the deny-by-default posture', () => {
  it('allows everything when zero-trust is off', async () => {
    delete process.env.HOUNDSHIELD_ZERO_TRUST
    const d = await evaluateZeroTrust(ORG, 'anything', 'any-model')
    expect(d.allowed).toBe(true)
    expect(d.reason).toMatch(/disabled/i)
  })

  it('denies when zero-trust is on but no rules are configured', async () => {
    withRules([])
    const d = await evaluateZeroTrust(ORG, 'openai', 'gpt-4o-mini')
    expect(d.allowed).toBe(false)
    expect(d.reason).toMatch(/no allowlist/i)
  })

  it('denies when the rules cannot be loaded at all', async () => {
    /*
     * A database error must not become an open door. loadZeroTrustRules
     * returns [] on failure, which lands in the no-rules branch above —
     * so an outage denies rather than admits.
     */
    withRules([], { message: 'connection refused' })
    const d = await evaluateZeroTrust(ORG, 'openai', 'gpt-4o-mini')
    expect(d.allowed).toBe(false)
  })
})

describe('evaluateZeroTrust — provider and model allowlists', () => {
  it('allows an allowlisted provider', async () => {
    withRules([rule({ rule_type: 'provider', value: 'openai' })])
    expect((await evaluateZeroTrust(ORG, 'openai', 'gpt-4o-mini')).allowed).toBe(true)
  })

  it('denies a provider that is not allowlisted, and says which are', async () => {
    withRules([rule({ rule_type: 'provider', value: 'openai' })])
    const d = await evaluateZeroTrust(ORG, 'anthropic', 'claude-3-haiku')
    expect(d.allowed).toBe(false)
    expect(d.reason).toContain('anthropic')
    expect(d.reason).toContain('openai')
  })

  it('matches provider and model case-insensitively', async () => {
    withRules([
      rule({ rule_type: 'provider', value: 'OpenAI' }),
      rule({ id: 'r2', rule_type: 'model', value: 'GPT-4o-Mini' }),
    ])
    expect((await evaluateZeroTrust(ORG, 'openai', 'gpt-4o-mini')).allowed).toBe(true)
  })

  it('denies a non-allowlisted model even when the provider is allowed', async () => {
    withRules([
      rule({ rule_type: 'provider', value: 'openai' }),
      rule({ id: 'r2', rule_type: 'model', value: 'gpt-4o-mini' }),
    ])
    const d = await evaluateZeroTrust(ORG, 'openai', 'gpt-4-turbo')
    expect(d.allowed).toBe(false)
    expect(d.reason).toMatch(/model/i)
  })

  it('leaves a dimension unconstrained when no rule of that type exists', async () => {
    // Only a provider rule → any model from that provider is permitted.
    withRules([rule({ rule_type: 'provider', value: 'openai' })])
    expect((await evaluateZeroTrust(ORG, 'openai', 'literally-anything')).allowed).toBe(true)
  })
})

describe('evaluateZeroTrust — team allowlist', () => {
  it('denies a team that is not allowlisted', async () => {
    withRules([rule({ rule_type: 'team', value: 'engineering' })])
    const d = await evaluateZeroTrust(ORG, 'openai', 'gpt-4o-mini', 'marketing')
    expect(d.allowed).toBe(false)
    expect(d.reason).toMatch(/team/i)
  })

  it('allows an allowlisted team', async () => {
    withRules([rule({ rule_type: 'team', value: 'engineering' })])
    expect(
      (await evaluateZeroTrust(ORG, 'openai', 'gpt-4o-mini', 'engineering')).allowed,
    ).toBe(true)
  })

  it('skips the team check when no team is supplied', async () => {
    // Documents current behaviour: an absent team bypasses team rules.
    withRules([rule({ rule_type: 'team', value: 'engineering' })])
    expect((await evaluateZeroTrust(ORG, 'openai', 'gpt-4o-mini')).allowed).toBe(true)
  })
})

describe('evaluateZeroTrust — time windows', () => {
  /** Freeze the clock at a given UTC hour:minute. */
  function atUtc(hour: number, minute = 0) {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(Date.UTC(2026, 7, 8, hour, minute, 0)))
  }

  it('allows inside a normal daytime window', async () => {
    withRules([rule({ rule_type: 'time_window', value: '09:00-17:00 UTC' })])
    atUtc(12)
    expect((await evaluateZeroTrust(ORG, 'openai', 'm')).allowed).toBe(true)
  })

  it('denies outside a normal daytime window', async () => {
    withRules([rule({ rule_type: 'time_window', value: '09:00-17:00 UTC' })])
    atUtc(20)
    const d = await evaluateZeroTrust(ORG, 'openai', 'm')
    expect(d.allowed).toBe(false)
    expect(d.reason).toMatch(/business hours/i)
  })

  it('is inclusive at both edges', async () => {
    withRules([rule({ rule_type: 'time_window', value: '09:00-17:00 UTC' })])
    atUtc(9, 0)
    expect((await evaluateZeroTrust(ORG, 'openai', 'm')).allowed).toBe(true)

    invalidateZeroTrustCache(ORG)
    withRules([rule({ rule_type: 'time_window', value: '09:00-17:00 UTC' })])
    atUtc(17, 0)
    expect((await evaluateZeroTrust(ORG, 'openai', 'm')).allowed).toBe(true)
  })

  it('handles a window that crosses midnight — the night-shift bug', async () => {
    /*
     * REGRESSION GUARD. "22:00-02:00" parses to start=1320, end=120.
     * The original `current >= 1320 && current <= 120` is unsatisfiable,
     * so 23:00 — squarely inside the window — was denied.
     */
    for (const [h, expected] of [
      [23, true],  // inside, after start
      [1, true],   // inside, before end
      [22, true],  // exactly at start
      [2, true],   // exactly at end
      [12, false], // the middle of the day is outside
      [3, false],  // just after the window closes
    ] as const) {
      invalidateZeroTrustCache(ORG)
      withRules([rule({ rule_type: 'time_window', value: '22:00-02:00 UTC' })])
      atUtc(h)
      const d = await evaluateZeroTrust(ORG, 'openai', 'm')
      expect(d.allowed, `${h}:00 UTC should be ${expected ? 'allowed' : 'denied'}`).toBe(
        expected,
      )
    }
  })

  it('allows when any one of several windows matches', async () => {
    withRules([
      rule({ rule_type: 'time_window', value: '09:00-12:00 UTC' }),
      rule({ id: 'r2', rule_type: 'time_window', value: '14:00-17:00 UTC' }),
    ])
    atUtc(15)
    expect((await evaluateZeroTrust(ORG, 'openai', 'm')).allowed).toBe(true)
  })

  it('parses a window without the " UTC" suffix', async () => {
    withRules([rule({ rule_type: 'time_window', value: '09:00-17:00' })])
    atUtc(10)
    expect((await evaluateZeroTrust(ORG, 'openai', 'm')).allowed).toBe(true)
  })

  it.each(['garbage', '', '25:00-26:00 UTC', '09:00', 'noon-midnight', '09:99-10:00'])(
    'denies rather than throwing on the malformed window %o',
    async (value) => {
      /*
       * Rule values are user-editable. Before the parser guard, a value
       * with no "-" left `end` undefined and `end.split(":")` threw a
       * TypeError straight out of the decision function.
       */
      withRules([rule({ rule_type: 'time_window', value })])
      atUtc(12)
      const d = await evaluateZeroTrust(ORG, 'openai', 'm')
      expect(d.allowed).toBe(false)
    },
  )

  it('still allows via a valid window when a sibling rule is malformed', async () => {
    withRules([
      rule({ rule_type: 'time_window', value: 'nonsense' }),
      rule({ id: 'r2', rule_type: 'time_window', value: '09:00-17:00 UTC' }),
    ])
    atUtc(10)
    expect((await evaluateZeroTrust(ORG, 'openai', 'm')).allowed).toBe(true)
  })
})

describe('loadZeroTrustRules — caching', () => {
  it('caches within the TTL instead of re-querying', async () => {
    withRules([rule()])
    await loadZeroTrustRules(ORG)
    await loadZeroTrustRules(ORG)
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })

  it('re-queries after the cache is invalidated', async () => {
    /*
     * A stale permit cache is a security bug: revoking a rule has to take
     * effect when the admin revokes it, not up to two minutes later.
     */
    withRules([rule()])
    await loadZeroTrustRules(ORG)

    invalidateZeroTrustCache(ORG)
    withRules([])
    const after = await loadZeroTrustRules(ORG)

    expect(mockFrom).toHaveBeenCalledTimes(2)
    expect(after).toEqual([])
  })

  it('does not cache a failed load, so a recovered database is picked up', async () => {
    withRules([], { message: 'boom' })
    expect(await loadZeroTrustRules(ORG)).toEqual([])

    withRules([rule()])
    expect(await loadZeroTrustRules(ORG)).toHaveLength(1)
  })

  it('keeps orgs isolated from one another', async () => {
    withRules([rule({ value: 'openai' })])
    await loadZeroTrustRules(ORG)

    withRules([rule({ org_id: 'org-2', value: 'anthropic' })])
    const other = await loadZeroTrustRules('org-2')

    expect(other[0].value).toBe('anthropic')
    invalidateZeroTrustCache('org-2')
  })
})
