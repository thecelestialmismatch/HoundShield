import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { OperatorOverview } from '../OperatorOverview'
import { ALL_CONTROLS } from '@/lib/shieldready/controls'
import type { DashboardPrefs } from '@/lib/dashboard/use-dashboard-prefs'

/**
 * Does the signed-in dashboard actually render — and does it stay honest with
 * real data in it?
 *
 * The contract test next door greps the source for banned seeds; this one mounts
 * the thing. Between them: no invented numbers in the file, and no invented
 * numbers on screen either.
 */

const EMPTY = {
  connected: false,
  windowDays: 7,
  totals: { events: 0, passed: 0, warning: 0, blocked: 0, blockRatePct: 0 },
  scanP50Ms: null,
  hourly: Array.from({ length: 24 }, (_, i) => ({ hour: i, events: 0, blocked: 0 })),
  daily: [],
  providers: [],
  riskMix: [],
  detections: [],
  recent: [],
  truncated: false,
}

const POPULATED = {
  ...EMPTY,
  connected: true,
  totals: { events: 412, passed: 380, warning: 12, blocked: 20, blockRatePct: 4.9 },
  scanP50Ms: 7,
  hourly: Array.from({ length: 24 }, (_, i) => ({ hour: i, events: i * 3, blocked: i % 4 })),
  providers: [
    { provider: 'openai', passed: 300, warning: 8, blocked: 14, total: 322 },
    { provider: 'anthropic', passed: 80, warning: 4, blocked: 6, total: 90 },
  ],
  detections: [{ name: 'CUI', count: 14 }, { name: 'PII', count: 6 }],
  recent: [
    { ref: 'evt_aa11bb', createdAt: new Date().toISOString(), provider: 'openai', risk: 'CRITICAL', outcome: 'blocked', detected: 'CUI', scanMs: 6 },
    { ref: 'evt_cc22dd', createdAt: new Date().toISOString(), provider: 'anthropic', risk: 'LOW', outcome: 'passed', detected: '', scanMs: 11 },
  ],
}

function mockApi(overview: unknown, points: unknown[] = []) {
  vi.stubGlobal('fetch', vi.fn((url: string) =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(String(url).includes('snapshot') ? { points } : overview),
    } as Response),
  ))
}

/**
 * Prefs stub: nothing hidden, registry order — the signed-in default.
 *
 * Deliberately a stub rather than the real hook. useDashboardPrefs has its own
 * test file; mounting it here would make every assertion below depend on
 * localStorage hydration timing, which is not what this file is checking.
 */
const PREFS: DashboardPrefs = {
  themeId: 'aurora',
  order: [],
  hidden: [],
  ready: true,
  setTheme: () => {},
  move: () => {},
  toggleHidden: () => {},
  isHidden: () => false,
  orderOf: () => 0,
  reset: () => {},
}

/** Mount with nothing hidden — the signed-in default. */
function renderOverview() {
  return render(
    <OperatorOverview
      prefs={PREFS}
      editing={false}
      onSource={() => {}}
      onTab={() => {}}
      brainSlot={<div>brain-slot</div>}
      checklistSlot={<div>checklist-slot</div>}
    />,
  )
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe('OperatorOverview — the founder’s panels are on screen', () => {
  it('renders every requested panel', async () => {
    mockApi(POPULATED)
    await act(async () => { renderOverview() })
    await waitFor(() => expect(screen.getByText('Dashboard Overview')).toBeTruthy())

    for (const heading of [
      'Total events', 'Blocked', 'Scan latency p50', 'SPRS score', 'Controls met', 'Quarantine queue',
      '24h activity', 'Provider breakdown', 'SPRS compliance trend', 'Risk assessment',
      'Live events', 'Detections by engine',
    ]) {
      // getAllByText: "Blocked" is legitimately both a KPI label and a filter
      // chip, so an exact-one assertion would fail on a correct render.
      expect(screen.getAllByText(heading).length, `${heading} is missing`).toBeGreaterThan(0)
    }
  })

  it('mounts the shared Brain AI + checklist slots rather than duplicating them', async () => {
    mockApi(POPULATED)
    await act(async () => { renderOverview() })
    expect(screen.getByText('brain-slot')).toBeTruthy()
    expect(screen.getByText('checklist-slot')).toBeTruthy()
  })

  it('renders the quick actions as real links to pages that exist', async () => {
    mockApi(POPULATED)
    await act(async () => { renderOverview() })
    const scan = screen.getByText('Run full scan').closest('a')
    expect(scan?.getAttribute('href')).toBe('/command-center/scanner')
  })
})

describe('OperatorOverview — real numbers, and only real numbers', () => {
  it('shows the operator’s own totals', async () => {
    mockApi(POPULATED)
    await act(async () => { renderOverview() })
    await waitFor(() => expect(screen.getByText('412')).toBeTruthy())
    expect(screen.getByText('7ms')).toBeTruthy()
    expect(screen.getByText('4.9% of traffic')).toBeTruthy()
  })

  it('lists the operator’s own events', async () => {
    mockApi(POPULATED)
    await act(async () => { renderOverview() })
    await waitFor(() => expect(screen.getByText('evt_aa11bb')).toBeTruthy())
    // A clean request is labelled as clean — never padded with a fake finding.
    expect(screen.getByText('Clean request — no policy match')).toBeTruthy()
  })

  it('filters the event list', async () => {
    mockApi(POPULATED)
    await act(async () => { renderOverview() })
    await waitFor(() => expect(screen.getByText('evt_aa11bb')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Blocked' }))
    expect(screen.queryByText('evt_cc22dd')).toBeNull()
    expect(screen.getByText('evt_aa11bb')).toBeTruthy()
  })

  it('NEVER shows a demo seed', async () => {
    mockApi(POPULATED)
    const { container } = await act(async () => renderOverview())
    const text = container.textContent ?? ''
    // The demo shell's signature numbers. Any of them on a signed-in dashboard
    // means simulated data leaked into a paying customer's view.
    for (const seed of ['142,690', '2,233', 'Acme Defense', 'sample']) {
      expect(text, `demo seed "${seed}" leaked`).not.toContain(seed)
    }
  })
})

describe('OperatorOverview — the empty customer', () => {
  it('says there is no data instead of drawing zeros', async () => {
    mockApi(EMPTY)
    const { container } = await act(async () => renderOverview())
    await waitFor(() => expect(screen.getByText('Dashboard Overview')).toBeTruthy())

    expect(screen.getAllByText(/No .* yet/).length).toBeGreaterThan(0)
    // An em dash, not a 0 — "0ms" would read as a measurement.
    expect(container.textContent).toContain('—')
    expect(screen.getByText('no traffic yet')).toBeTruthy()
  })

  it('tells an unassessed operator to start the assessment — once', async () => {
    mockApi(EMPTY)
    await act(async () => { renderOverview() })
    // getByText, not getAllByText: the radar owns this empty state. The family
    // matrix hides itself rather than repeating the same card underneath it.
    await waitFor(() => expect(screen.getByText('No assessment yet')).toBeTruthy())
    expect(screen.getByText('not assessed yet')).toBeTruthy()
    expect(screen.queryByText('Control coverage by family')).toBeNull()
  })

  it('refuses to draw a trend from a single point', async () => {
    mockApi(EMPTY, [{ score: 40, completion: 20, at: new Date().toISOString() }])
    await act(async () => { renderOverview() })
    await waitFor(() => expect(screen.getByText('Not enough history yet')).toBeTruthy())
  })

  it('draws the trend once there are two points', async () => {
    mockApi(EMPTY, [
      { score: 40, completion: 20, at: '2026-01-01T00:00:00.000Z' },
      { score: 61, completion: 55, at: '2026-06-01T00:00:00.000Z' },
    ])
    const { container } = await act(async () => renderOverview())
    await waitFor(() => expect(screen.queryByText('Not enough history yet')).toBeNull())
    expect(container.querySelector('polyline')).toBeTruthy()
  })
})

describe('OperatorOverview — the assessed customer', () => {
  /** Seed the on-device assessment the same way the assessment page does. */
  function seedAssessment(count: number) {
    localStorage.setItem(
      'shieldready_assessment',
      JSON.stringify(
        ALL_CONTROLS.slice(0, count).map((c, i) => ({
          controlId: c.id,
          status: i % 7 === 0 ? 'PARTIAL' : 'MET',
          notes: '',
          evidenceUploaded: false,
          answeredAt: '2026-07-01T00:00:00.000Z',
        })),
      ),
    )
  }

  it('breaks the radar down into all 14 control families', async () => {
    seedAssessment(74)
    mockApi(POPULATED)
    const { container } = await act(async () => renderOverview())
    await waitFor(() => expect(screen.getByText('Control coverage by family')).toBeTruthy())

    const rows = container.querySelectorAll('.op-matrix-r')
    expect(rows.length, 'one row per NIST 800-171 family').toBe(14)
    // Every visual column carries its own header. A single header over a
    // multi-column flow leaves the right-hand families unlabelled.
    const groups = container.querySelectorAll('.op-matrix-col')
    expect(groups.length).toBe(2)
    for (const g of Array.from(groups)) {
      expect(g.querySelector('.op-matrix-h'), 'column without a header').toBeTruthy()
    }
    // Coverage comes from the operator's own answers, so it must never read 0/110.
    expect(screen.queryByText('0 met · 0 partial · 0 unmet')).toBeNull()
  })
})

describe('OperatorOverview — failure is visible, not silent', () => {
  it('says the read failed rather than showing an empty dashboard', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 500 } as Response)))
    await act(async () => { renderOverview() })
    await waitFor(() =>
      expect(screen.getByText(/Could not load your gateway telemetry/)).toBeTruthy())
    expect(screen.getByText('Offline')).toBeTruthy()
  })

  it('discloses aggregation truncation', async () => {
    mockApi({ ...POPULATED, truncated: true })
    await act(async () => { renderOverview() })
    await waitFor(() => expect(screen.getByText(/5,000-event/)).toBeTruthy())
  })
})

describe('OperatorOverview — the radar draws valid geometry', () => {
  it('emits no NaN coordinates, populated or empty', async () => {
    mockApi(POPULATED)
    const { container } = await act(async () => renderOverview())
    await waitFor(() => expect(screen.getByText('Risk assessment')).toBeTruthy())
    for (const el of Array.from(container.querySelectorAll('polygon, polyline, line, circle'))) {
      const attrs = Array.from(el.attributes).map((a) => a.value).join(' ')
      expect(attrs, `NaN in ${el.tagName}`).not.toMatch(/NaN|Infinity|undefined/)
    }
  })
})
