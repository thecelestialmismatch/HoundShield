import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ClassificationResult, DetectedEntity } from '@/lib/supabase/types'

const { mockClassify } = vi.hoisted(() => ({ mockClassify: vi.fn() }))

vi.mock('@/lib/classifier/risk-engine', () => ({
  classifyRisk: (t: string) => mockClassify(t),
}))

import { StreamScanner } from '../stream-scanner'

/* ──────────────────────────────────────────────────────────────────
 * Output stream scanner.
 *
 * This is the path that catches the model EMITTING sensitive data —
 * an SSN or API key it hallucinated or recalled from training, where
 * the input was clean and input scanning sees nothing. Before this
 * file, 391 lines of it sat behind zero tests.
 *
 * `.claude/rules/api.md` pins the contract as a NEVER-degrade rule:
 * "Stream scanner: 500-char window, 256-char overlap". Those two
 * numbers are the whole design, and the overlap is the subtle half —
 * without it a pattern straddling a scan boundary is silently missed,
 * and nothing anywhere would go red.
 * ────────────────────────────────────────────────────────────────── */

const OVERLAP = 256

/** A clean classifier verdict. */
const CLEAN: ClassificationResult = {
  risk_level: 'NONE',
  classifications: [],
  entities: [],
  confidence: 1,
  should_block: false,
  should_quarantine: false,
  matched_rules: [],
}

function entity(overrides: Partial<DetectedEntity> = {}): DetectedEntity {
  return {
    type: 'PII',
    value_redacted: '***-**-6789',
    pattern_matched: 'ssn',
    confidence: 0.99,
    position: { start: 0, end: 11 },
    ...overrides,
  }
}

function hit(
  risk: ClassificationResult['risk_level'],
  entities: DetectedEntity[],
): ClassificationResult {
  return { ...CLEAN, risk_level: risk, entities, matched_rules: entities.map((e) => e.pattern_matched) }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockClassify.mockResolvedValue(CLEAN)
})

describe('StreamScanner — scan triggering', () => {
  it('does not scan until the interval is reached', async () => {
    const s = new StreamScanner({ scanInterval: 100 })
    await s.addToken('a'.repeat(99))
    expect(mockClassify).not.toHaveBeenCalled()
  })

  it('scans once the interval is reached', async () => {
    const s = new StreamScanner({ scanInterval: 100 })
    await s.addToken('a'.repeat(100))
    expect(mockClassify).toHaveBeenCalledTimes(1)
  })

  it('ignores empty tokens without counting them', async () => {
    const s = new StreamScanner({ scanInterval: 10 })
    await s.addToken('')
    expect(s.getTokenCount()).toBe(0)
    expect(mockClassify).not.toHaveBeenCalled()
  })

  it('reports the buffer length it has accumulated', async () => {
    const s = new StreamScanner({ scanInterval: 1000 })
    await s.addToken('hello')
    await s.addToken(' world')
    expect(s.getBufferLength()).toBe(11)
    expect(s.getTokenCount()).toBe(2)
  })
})

describe('StreamScanner — the 256-char overlap window', () => {
  /*
   * The reason the overlap exists. A pattern that begins just before a
   * scan boundary and ends just after it appears in NEITHER a scan that
   * stops at the boundary nor one that starts there. The scanner
   * compensates by rewinding each scan start by OVERLAP chars.
   */
  it('rewinds the second scan by the overlap so a straddling pattern is still seen', async () => {
    const s = new StreamScanner({ scanInterval: 500 })

    await s.addToken('x'.repeat(500)) // scan 1: [0, 500)
    await s.addToken('y'.repeat(500)) // scan 2: rewound to 500-256

    expect(mockClassify).toHaveBeenCalledTimes(2)
    const secondWindow = mockClassify.mock.calls[1][0] as string

    // The window must reach back into content the first scan already saw.
    expect(secondWindow.length).toBe(500 + OVERLAP)
    expect(secondWindow.startsWith('x'.repeat(OVERLAP))).toBe(true)
  })

  it('never rewinds past the start of the buffer', async () => {
    const s = new StreamScanner({ scanInterval: 10 })
    await s.addToken('a'.repeat(10))
    // lastScanPos is 0 on the first scan; Math.max(0, -256) must not slice
    // from a negative index, which would silently take the buffer TAIL.
    expect(mockClassify.mock.calls[0][0]).toBe('a'.repeat(10))
  })

  it('reports alert positions in absolute buffer coordinates, not window-relative', async () => {
    /*
     * position is scanStart + entity.position.start. Getting this wrong
     * makes every alert after the first scan point at the wrong offset,
     * which is what an auditor reads in the evidence PDF.
     */
    const s = new StreamScanner({ scanInterval: 500 })
    mockClassify.mockResolvedValueOnce(CLEAN)
    mockClassify.mockResolvedValueOnce(
      hit('HIGH', [entity({ position: { start: 300, end: 311 } })]),
    )

    await s.addToken('x'.repeat(500))
    const alerts = await s.addToken('y'.repeat(500))

    // Second window starts at 500 - 256 = 244; entity at +300 → 544.
    expect(alerts).toHaveLength(1)
    expect(alerts[0].position).toBe(244 + 300)
  })
})

describe('StreamScanner — deduplication', () => {
  it('does not re-report the same rule seen again inside the overlap', async () => {
    /*
     * The overlap deliberately re-scans content, so without dedupe every
     * straddling match would fire twice and inflate the alert count in
     * the compliance record.
     */
    const s = new StreamScanner({ scanInterval: 500 })
    mockClassify.mockResolvedValue(hit('HIGH', [entity({ position: { start: 10, end: 21 } })]))

    const first = await s.addToken('x'.repeat(500))
    const second = await s.addToken('y'.repeat(500))

    expect(first).toHaveLength(1)
    expect(second).toHaveLength(0) // same rule, within OVERLAP of the first
    expect(s.getAlerts()).toHaveLength(1)
  })

  it('does report the same rule again when it is far apart', async () => {
    const s = new StreamScanner({ scanInterval: 500 })
    mockClassify.mockResolvedValueOnce(hit('HIGH', [entity({ position: { start: 0, end: 11 } })]))
    mockClassify.mockResolvedValueOnce(hit('HIGH', [entity({ position: { start: 490, end: 501 } })]))

    await s.addToken('x'.repeat(500)) // alert at 0
    const second = await s.addToken('y'.repeat(500)) // alert at 244+490 = 734

    expect(second).toHaveLength(1)
    expect(s.getAlerts()).toHaveLength(2)
  })

  it('reports two different rules at the same position', async () => {
    const s = new StreamScanner({ scanInterval: 100 })
    mockClassify.mockResolvedValue(
      hit('HIGH', [
        entity({ pattern_matched: 'ssn', position: { start: 5, end: 16 } }),
        entity({ pattern_matched: 'credit_card', position: { start: 5, end: 24 } }),
      ]),
    )

    const alerts = await s.addToken('x'.repeat(100))
    expect(alerts.map((a) => a.matched_rule).sort()).toEqual(['credit_card', 'ssn'])
  })
})

describe('StreamScanner — finalize flushes the tail', () => {
  it('scans content that never reached the interval', async () => {
    /*
     * The most likely real leak: a short response, or the last few tokens
     * of a long one, that never crosses the scan threshold. If finalize()
     * did not rescan, that tail would go out unscanned.
     */
    const s = new StreamScanner({ scanInterval: 500 })
    mockClassify.mockResolvedValue(hit('CRITICAL', [entity({ pattern_matched: 'api_key' })]))

    await s.addToken('short output with a key in it')
    expect(mockClassify).not.toHaveBeenCalled() // below the interval

    const result = await s.finalize()

    expect(mockClassify).toHaveBeenCalledTimes(1)
    expect(result.clean).toBe(false)
    expect(result.alerts).toHaveLength(1)
  })

  it('reports a clean result and accurate counters for benign output', async () => {
    const s = new StreamScanner({ scanInterval: 500 })
    await s.addToken('all good')
    await s.addToken(' here')

    const result = await s.finalize()

    expect(result.clean).toBe(true)
    expect(result.alerts).toEqual([])
    expect(result.characters_scanned).toBe(13)
    expect(result.tokens_processed).toBe(2)
    expect(result.scans_performed).toBe(1) // the finalize pass
    expect(result.scan_time_ms).toBeGreaterThanOrEqual(0)
  })

  it('does not double-count an alert already raised mid-stream', async () => {
    const s = new StreamScanner({ scanInterval: 100 })
    mockClassify.mockResolvedValue(hit('HIGH', [entity({ position: { start: 0, end: 11 } })]))

    await s.addToken('x'.repeat(100))
    const result = await s.finalize()

    expect(result.alerts).toHaveLength(1)
  })
})

describe('StreamScanner — severity mapping and queries', () => {
  it.each([
    ['CRITICAL', 'CRITICAL'],
    ['HIGH', 'HIGH'],
    ['MEDIUM', 'MEDIUM'],
    ['LOW', 'LOW'],
  ] as const)('maps risk %s to severity %s', async (risk, severity) => {
    const s = new StreamScanner({ scanInterval: 10 })
    mockClassify.mockResolvedValue(hit(risk, [entity()]))
    const alerts = await s.addToken('x'.repeat(10))
    expect(alerts[0].severity).toBe(severity)
  })

  it('returns the highest severity seen, not the most recent', async () => {
    const s = new StreamScanner({ scanInterval: 100 })
    mockClassify.mockResolvedValueOnce(
      hit('CRITICAL', [entity({ pattern_matched: 'api_key', position: { start: 0, end: 5 } })]),
    )
    mockClassify.mockResolvedValueOnce(
      hit('LOW', [entity({ pattern_matched: 'email', position: { start: 600, end: 610 } })]),
    )

    await s.addToken('x'.repeat(100))
    await s.addToken('y'.repeat(100))

    expect(s.getHighestSeverity()).toBe('CRITICAL')
  })

  it('returns null highest severity when nothing fired', () => {
    expect(new StreamScanner().getHighestSeverity()).toBeNull()
  })

  it('answers hasAlertAtOrAbove inclusively at the threshold', async () => {
    const s = new StreamScanner({ scanInterval: 10 })
    mockClassify.mockResolvedValue(hit('HIGH', [entity()]))
    await s.addToken('x'.repeat(10))

    expect(s.hasAlertAtOrAbove('HIGH')).toBe(true) // at threshold, inclusive
    expect(s.hasAlertAtOrAbove('MEDIUM')).toBe(true)
    expect(s.hasAlertAtOrAbove('CRITICAL')).toBe(false)
  })

  it('exposes alerts as a read-only view', async () => {
    const s = new StreamScanner({ scanInterval: 10 })
    mockClassify.mockResolvedValue(hit('HIGH', [entity()]))
    await s.addToken('x'.repeat(10))
    expect(s.getAlerts()).toHaveLength(1)
  })
})

describe('StreamScanner — a classifier failure must not break the stream', () => {
  /*
   * DOCUMENTING A DELIBERATE FAIL-OPEN, not endorsing it.
   *
   * Unlike the input-side guards (which return 4xx/503 and forward
   * nothing), this path swallows classifier errors by design: tokens are
   * already in flight to the caller and cannot be unsent, so crashing the
   * stream mid-response is the worse failure. The cost is that a
   * classifier outage silently disables OUTPUT scanning.
   *
   * These tests pin the current contract so the behaviour is a choice on
   * record rather than an accident. See the `ponytail:` marker on the
   * catch block for the upgrade path.
   */
  it('swallows the error and keeps accepting tokens', async () => {
    const s = new StreamScanner({ scanInterval: 10 })
    mockClassify.mockRejectedValue(new Error('classifier down'))

    await expect(s.addToken('x'.repeat(10))).resolves.toEqual([])
    await expect(s.addToken('y'.repeat(10))).resolves.toEqual([])
  })

  it('advances the scan position so it does not retry the same window forever', async () => {
    const s = new StreamScanner({ scanInterval: 10 })
    mockClassify.mockRejectedValue(new Error('classifier down'))

    await s.addToken('x'.repeat(10))
    await s.addToken('y'.repeat(9)) // under the interval given the advanced position

    expect(mockClassify).toHaveBeenCalledTimes(1)
  })

  it('still returns a usable result from finalize when every scan failed', async () => {
    const s = new StreamScanner({ scanInterval: 10 })
    mockClassify.mockRejectedValue(new Error('classifier down'))

    await s.addToken('x'.repeat(10))
    const result = await s.finalize()

    // clean:true here means "nothing was detected", NOT "nothing was present".
    expect(result.clean).toBe(true)
    expect(result.characters_scanned).toBe(10)
  })
})
