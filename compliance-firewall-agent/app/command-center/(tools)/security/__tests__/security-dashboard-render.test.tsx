import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { OverviewTelemetry } from '@/lib/dashboard/overview-telemetry'

/* ──────────────────────────────────────────────────────────────────
 * The source-level guard next to this file proves the fabricated series are
 * gone. It cannot prove the page mounts: this route now renders Recharts-backed
 * panels, and Recharts has crashed this codebase on render before (which is why
 * Recharts components are pinned to ssr:false). So this actually mounts it.
 *
 * The assertions are the founder's requirement stated literally — click a
 * number, land on the records that produced it.
 * ────────────────────────────────────────────────────────────────── */

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

/** Field names are taken from OverviewTelemetry, not guessed — an inaccurate
 *  fixture tests fiction. `hourly`/`daily`/`heat` are fixed-length by contract
 *  (24 buckets, 7 buckets, 7x24), so they are built at the right size. */
const tel = {
  connected: true,
  synthetic: false,
  windowDays: 7,
  totals: { events: 1240, passed: 1100, warning: 40, blocked: 100, blockRatePct: 8 },
  scanP50Ms: 7,
  scanP90Ms: 9,
  scanP99Ms: 10,
  hourly: Array.from({ length: 24 }, (_, h) => ({ hour: h, events: 10, blocked: 1 })),
  daily: Array.from({ length: 7 }, (_, d) => ({ day: `d${d}`, events: 100, blocked: 8 })),
  heat: Array.from({ length: 7 }, () => Array(24).fill(1)),
  heatBlocked: Array.from({ length: 7 }, () => Array(24).fill(0)),
  providers: [{ name: 'openai', count: 900 }],
  riskMix: [{ name: 'HIGH', count: 60 }, { name: 'CRITICAL', count: 40 }],
  detections: [{ name: 'CUI', count: 55 }],
  actors: [],
  autonomousEvents: 0,
} as unknown as OverviewTelemetry

const refresh = vi.fn()

vi.mock('@/components/dashboard/operator/useOperatorTelemetry', () => ({
  useOperatorTelemetry: () => ({
    tel,
    recent: [],
    posture: { assessed: false, score: 0, controlsMet: 0, families: [] },
    history: [],
    loading: false,
    error: null,
    truncated: false,
    windowDays: 7,
    setWindowDays: vi.fn(),
    refresh,
    lastUpdated: '2026-08-08T05:00:00.000Z',
  }),
}))

import SecurityDashboardPage from '../page'

describe('/command-center/security renders', () => {
  it('mounts without throwing', () => {
    expect(() => render(<SecurityDashboardPage />)).not.toThrow()
  })

  it('shows the tenant’s real measured figures in the KPI tiles', () => {
    const { container } = render(<SecurityDashboardPage />)
    // Scoped to the tile row: the same totals legitimately appear again inside
    // the reused panels, so a page-wide query is ambiguous rather than wrong.
    const tiles = container.querySelector('.kpis')
    expect(tiles).toBeTruthy()
    const nums = [...tiles!.querySelectorAll('.n')].map((n) => n.textContent)
    expect(nums).toEqual(['1,240', '100', '40', '7ms'])
  })

  it('every KPI tile navigates to the records behind it', () => {
    const { container } = render(<SecurityDashboardPage />)
    const hrefs = [...container.querySelectorAll('a[href^="/command-center/"]')].map((a) =>
      a.getAttribute('href'),
    )
    expect(hrefs).toContain('/command-center/events')
    expect(hrefs).toContain('/command-center/events?outcome=blocked')
    expect(hrefs).toContain('/command-center/quarantine')
    expect(hrefs).toContain('/command-center/realtime')
  })
})

describe('it tells the truth when there is nothing to show', () => {
  it('renders an em dash, not a zero, for an unconnected tenant', async () => {
    vi.resetModules()
    vi.doMock('@/components/dashboard/operator/useOperatorTelemetry', () => ({
      useOperatorTelemetry: () => ({
        tel: { ...tel, connected: false, scanP50Ms: null },
        recent: [], posture: { assessed: false, score: 0, controlsMet: 0, families: [] },
        history: [], loading: false, error: null, truncated: false,
        windowDays: 7, setWindowDays: vi.fn(), refresh, lastUpdated: null,
      }),
    }))
    const { default: Page } = await import('../page')
    const { container } = render(<Page />)
    // A tenant with no gateway traffic must not be shown "0 blocked" — that
    // reads as "we checked and you are clean".
    expect(container.textContent).toContain('—')
    expect(screen.queryByText('1,240')).toBeNull()
  })
})
