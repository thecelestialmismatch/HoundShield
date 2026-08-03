import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { OperatorDashboard } from '../OperatorDashboard'

/**
 * The dashboard as it ships: the founder's panels, mounted inside the shared
 * (tools) sidebar rather than a second shell of its own.
 *
 * The contract tests next door grep the source. This one mounts the thing and
 * checks the three properties that only exist at runtime: the panels render, the
 * CTAs go to real routes, and nothing simulated is on screen.
 */

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const EMPTY = {
  connected: false,
  windowDays: 7,
  totals: { events: 0, passed: 0, warning: 0, blocked: 0, blockRatePct: 0 },
  scanP50Ms: null,
  hourly: Array.from({ length: 24 }, (_, i) => ({ hour: i, events: 0, blocked: 0 })),
  daily: [], providers: [], riskMix: [], detections: [], recent: [], truncated: false,
}

const POPULATED = {
  ...EMPTY,
  connected: true,
  totals: { events: 412, passed: 380, warning: 12, blocked: 20, blockRatePct: 4.9 },
  scanP50Ms: 7,
  hourly: Array.from({ length: 24 }, (_, i) => ({ hour: i, events: i * 3, blocked: i % 4 })),
  providers: [{ provider: 'openai', passed: 300, warning: 8, blocked: 14, total: 322 }],
  detections: [{ name: 'CUI', count: 14 }],
  recent: [{
    ref: 'evt_aa11bb', createdAt: new Date().toISOString(), provider: 'openai',
    risk: 'CRITICAL', outcome: 'blocked', detected: 'CUI', scanMs: 6,
  }],
}

function mockApi(overview: unknown) {
  vi.stubGlobal('fetch', vi.fn((url: string) =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(String(url).includes('snapshot') ? { points: [] } : overview),
    } as Response),
  ))
}

beforeEach(() => { localStorage.clear(); push.mockClear() })
afterEach(() => vi.unstubAllGlobals())

describe('OperatorDashboard — the founder’s layout, inside the shared sidebar', () => {
  it('renders the Overview panels', async () => {
    mockApi(POPULATED)
    await act(async () => { render(<OperatorDashboard name="Sam" connected />) })
    await waitFor(() => expect(screen.getByText('Dashboard Overview')).toBeTruthy())
    for (const heading of ['24h activity', 'Provider breakdown', 'Risk assessment', 'Live events']) {
      expect(screen.getAllByText(heading).length, `${heading} missing`).toBeGreaterThan(0)
    }
  })

  it('brings the panel stylesheet but NOT a second sidebar', async () => {
    mockApi(POPULATED)
    const { container } = await act(async () => render(<OperatorDashboard connected />))
    // Every .op-* / .panel rule is scoped `.hs-lcc`, so the wrapper is required…
    expect(container.querySelector('.hs-lcc')).toBeTruthy()
    // …and `hs-embedded` neutralises the page-stage background.
    expect(container.querySelector('.hs-lcc.hs-embedded')).toBeTruthy()
    // …but `.shell` is the 248px sidebar grid. Mounting it here would paint a
    // second sidebar beside the (tools) one — the exact defect this move fixes.
    expect(container.querySelector('.shell')).toBeNull()
    expect(container.querySelector('aside')).toBeNull()
  })

  it('greets by name without inventing one when the profile is bare', async () => {
    mockApi(POPULATED)
    const { container } = await act(async () => render(<OperatorDashboard name={null} connected />))
    expect(screen.getByText('Ask Brain AI')).toBeTruthy()
    expect(container.textContent).not.toMatch(/Acme Defense|Sample preview/)
  })
})

describe('OperatorDashboard — CTAs are routes, not dead buttons', () => {
  it('sends the empty-state assessment CTA to the real 110-control board', async () => {
    mockApi(EMPTY)
    await act(async () => { render(<OperatorDashboard connected={false} />) })
    await waitFor(() => expect(screen.getAllByText('Open assessment').length).toBeGreaterThan(0))
    fireEvent.click(screen.getAllByText('Open assessment')[0].closest('button')!)
    expect(push).toHaveBeenCalledWith('/command-center/shield/assessment')
  })

  it('sends a Brain AI quick-ask to the analyst, carrying the question', async () => {
    mockApi(POPULATED)
    await act(async () => { render(<OperatorDashboard connected />) })
    fireEvent.click(screen.getByText('Am I CMMC ready?'))
    expect(push).toHaveBeenCalledWith('/command-center/chat?q=Am%20I%20CMMC%20ready%3F')
  })

  it('sends the checklist steps to pages that exist', async () => {
    mockApi(POPULATED)
    await act(async () => { render(<OperatorDashboard connected /> ) })
    fireEvent.click(screen.getByText('View proxy URL').closest('button')!)
    expect(push).toHaveBeenCalledWith('/command-center/settings')
  })
})

describe('OperatorDashboard — the activation checklist tells the truth', () => {
  it('does NOT tick "connected" for an operator with no traffic', async () => {
    mockApi(EMPTY)
    const { container } = await act(async () => render(<OperatorDashboard connected={false} />))
    await waitFor(() => expect(screen.getByText('Point your AI traffic at the proxy')).toBeTruthy())
    // A ticked step for someone who never connected is a fabricated completion
    // state on the one panel whose job is saying what is left to do.
    expect(container.querySelectorAll('.steprow.done').length).toBe(0)
  })

  it('ticks them once the gateway has actually seen traffic', async () => {
    mockApi(POPULATED)
    const { container } = await act(async () => render(<OperatorDashboard connected />))
    await waitFor(() => expect(screen.getByText('Point your AI traffic at the proxy')).toBeTruthy())
    expect(container.querySelectorAll('.steprow.done').length).toBe(2)
  })
})

describe('OperatorDashboard — Customize survived the move', () => {
  it('exposes the reorder/hide mode the old toolbar owned', async () => {
    mockApi(POPULATED)
    await act(async () => { render(<OperatorDashboard connected />) })
    fireEvent.click(screen.getByText('Customize').closest('button')!)
    expect(screen.getByText(/Customize mode/)).toBeTruthy()
    expect(screen.getByText('Done customizing')).toBeTruthy()
  })
})
