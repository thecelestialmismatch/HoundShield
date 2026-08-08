import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { OverviewTelemetry } from '@/lib/dashboard/overview-telemetry'

/* ──────────────────────────────────────────────────────────────────
 * /command-center/sdk — the analytics panel shows the customer's traffic.
 *
 * It used to invent it: a generator produced 24 hours of allowed/blocked
 * counts from a random-number call on every render, three stat tiles summed
 * that invention, and each carried a trend delta ("+12%", "-4%", "stable")
 * measured against no baseline. The only marker was a code comment, so
 * nothing on screen told the customer, and the block rate changed on reload.
 *
 * Found by sweeping every (tools) page after the same defect was fixed on
 * /command-center/security. This guard is the reason a third one would be
 * caught rather than discovered by a customer.
 * ────────────────────────────────────────────────────────────────── */

const src = readFileSync(join(process.cwd(), 'app/command-center/(tools)/sdk/page.tsx'), 'utf8')

describe('the SDK analytics panel invents nothing', () => {
  it('generates no traffic of its own', () => {
    expect(src).not.toMatch(/Math\.random/)
    expect(src).not.toMatch(/generateAnalyticsData/)
  })

  it('quotes no trend delta, because nothing here measures a trend', () => {
    // The gateway records events, not a baseline to compare them against.
    expect(src).not.toMatch(/"\+12%"|"-4%"|"stable"/)
    expect(src).not.toMatch(/trend:/)
  })

  it('reads the same tenant-scoped telemetry as the other dashboards', () => {
    expect(src).toContain('useOperatorTelemetry')
  })

  it('discloses seeded rows on screen', () => {
    expect(src).toContain('tel.synthetic')
  })
})

vi.mock('@/components/dashboard/operator/useOperatorTelemetry', () => ({
  useOperatorTelemetry: () => ({
    tel: {
      connected: false,
      synthetic: false,
      windowDays: 7,
      totals: { events: 0, passed: 0, warning: 0, blocked: 0, blockRatePct: 0 },
      scanP50Ms: null, scanP90Ms: null, scanP99Ms: null,
      hourly: [], daily: [], heat: [], heatBlocked: [],
      providers: [], riskMix: [], detections: [], actors: [], autonomousEvents: 0,
    } as unknown as OverviewTelemetry,
    recent: [], posture: { assessed: false, score: 0, controlsMet: 0, families: [] },
    history: [], loading: false, error: null, truncated: false,
    windowDays: 7, setWindowDays: vi.fn(), refresh: vi.fn(), lastUpdated: null,
  }),
}))

import SDKPage from '../page'

describe('a customer who has not connected yet', () => {
  it('is shown an empty state, not a zeroed chart', () => {
    render(<SDKPage />)
    // A flat line at zero reads as "we measured you and you send nothing".
    // The truth is that no request has arrived — which here is the call to
    // action for wiring up the SDK, so it says exactly that.
    expect(screen.getByTestId('sdk-no-traffic')).toBeTruthy()
    expect(screen.getByText(/No requests through the gateway yet/i)).toBeTruthy()
  })

  it('renders em dashes rather than zeros in the tiles', () => {
    const { container } = render(<SDKPage />)
    expect(container.textContent).toContain('—')
    expect(screen.queryByText('0%')).toBeNull()
  })
})
