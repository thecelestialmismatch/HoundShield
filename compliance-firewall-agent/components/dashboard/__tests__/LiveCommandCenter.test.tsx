import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt, ...p }: { src: string; alt: string; [k: string]: unknown }) => <img src={src} alt={alt} {...(p as object)} />,
}))
vi.mock('next/link', () => ({
  default: ({ children, href, ...p }: { children: React.ReactNode; href: string; [k: string]: unknown }) => <a href={href} {...(p as object)}>{children}</a>,
}))
// Keep the heavy 110-control board out of the render — a stub proves the
// inline mount without loading Framer Motion / localStorage machinery.
vi.mock('next/dynamic', () => ({
  default: () => {
    const Stub = () => <div data-testid="assessment-board">assessment board</div>
    return Stub
  },
}))
// The guide panel fetches /api/customer/status on mount — stub it out here;
// its own behaviour is covered by the customer-status suites.
vi.mock('@/components/dashboard/CustomerStatusPanel', () => ({
  CustomerStatusPanel: () => <div data-testid="status-panel">status panel</div>,
}))
vi.mock('@/components/WelcomeBanner', () => ({ WelcomeBanner: () => null }))
// Sign-out talks to the auth provider + next/navigation — covered by its own
// suite (SignOutButton.test.tsx); here we only assert presence/absence.
vi.mock('@/components/dashboard/SignOutButton', () => ({
  SignOutButton: ({ className }: { className?: string }) => (
    <button type="button" className={className}>Sign out</button>
  ),
}))

import { LiveCommandCenter, brainAnswer, escapeHtml } from '../LiveCommandCenter'
import { getEntitlements } from '@/lib/billing/entitlements'
import type { SprsInput } from '@/lib/customer/status'

describe('brainAnswer — on-device keyword analyst', () => {
  it('answers identity', () => {
    const [html, src] = brainAnswer('who are you?')
    expect(html).toMatch(/Brain AI/)
    expect(src).toMatch(/identity/)
  })
  it('answers SPRS', () => {
    expect(brainAnswer("what's my SPRS score?")[0]).toMatch(/\+78/)
  })
  it('answers DFARS 7012 spill', () => {
    const [html, src] = brainAnswer('what is a DFARS 7012 spill?')
    expect(html).toMatch(/252\.204-7012/)
    expect(src).toMatch(/dfars/)
  })
  it('answers what HoundShield is', () => {
    expect(brainAnswer('what is houndshield')[0]).toMatch(/local-only AI compliance firewall/)
  })
  it('falls back gracefully', () => {
    expect(brainAnswer('hello there')[1]).toBe('brain-core')
  })
})

describe('brainAnswer — personalized + tier-aware (human, not monotone)', () => {
  it('greets the operator by name when context is supplied', () => {
    const [html] = brainAnswer('who are you?', { name: 'Jordan' })
    expect(html).toMatch(/Jordan/)
  })
  it('leaves anonymous answers name-free (public demo path)', () => {
    expect(brainAnswer('who are you?')[0]).not.toMatch(/undefined|null/)
  })
  it('reports the plan + remaining Brain queries from entitlements', () => {
    const [html, src] = brainAnswer("what's on my plan?", {
      name: 'Rachel',
      ent: getEntitlements('pro'),
      brainUsed: 100,
    })
    expect(src).toMatch(/plan/)
    expect(html).toMatch(/Pro/)
    // 500 Pro cap − 100 used = 400 left
    expect(html).toMatch(/400/)
  })
  it('gates PDF reports truthfully by tier', () => {
    const pro = brainAnswer('can I generate a PDF report?', { ent: getEntitlements('pro') })[0]
    expect(pro).toMatch(/Growth/)
    const growth = brainAnswer('generate a PDF report', { ent: getEntitlements('growth') })[0]
    expect(growth).toMatch(/Reports/)
  })
})

describe('brainAnswer — a signed-in operator gets THEIR data, never the sample org (data honesty)', () => {
  const realSprs: SprsInput = {
    score: 42,
    completionPercent: 30,
    totalControls: 110,
    metCount: 25,
    partialCount: 5,
    unmetCount: 3,
    assessedCount: 33,
    topGaps: [
      { controlId: '3.1.1', title: 'Limit system access', status: 'UNMET', deduction: 5, fix: 'Do the thing', hours: 4 },
    ],
  }

  it('answers SPRS from the operator’s own assessment, not the hardcoded +78', () => {
    const [html, src] = brainAnswer("what's my SPRS score?", { own: { sprs: realSprs } })
    expect(html).toMatch(/\+42/)
    expect(html).not.toMatch(/\+78/)
    expect(html).toMatch(/3\.1\.1/)
    expect(src).toBe('sprs · your assessment')
  })

  it('is honest when the signed-in operator has not assessed yet', () => {
    const [html, src] = brainAnswer("what's my SPRS score?", { own: { sprs: null } })
    expect(html).toMatch(/haven't answered any controls/i)
    expect(html).not.toMatch(/\+78/)
    expect(src).toBe('sprs · your assessment')
  })

  it('readiness is computed from real open/partial counts', () => {
    const [html, src] = brainAnswer('am I CMMC ready?', { own: { sprs: realSprs } })
    expect(html).toMatch(/3 open/)
    expect(src).toBe('readiness · your assessment')
  })

  it('NEVER fabricates an incident determination — signed-in gets the truthful no-telemetry answer', () => {
    const [html, src] = brainAnswer('draft my incident summary', { own: { sprs: realSprs } })
    expect(html).not.toMatch(/No spill occurred|no reportable event/i)
    expect(html).toMatch(/don't have live audit-chain data/i)
    expect(src).toBe('incident · awaiting telemetry')
  })

  it('the anonymous demo incident answer is labeled a sample and issues no spill determination', () => {
    const [html, src] = brainAnswer('draft my incident summary')
    expect(html).toMatch(/not your data|sample/i)
    expect(html).not.toMatch(/No spill occurred|no reportable event/i)
    expect(src).toBe('incident · sample data')
  })

  it('anonymous demo posture answers are source-tagged as sample data', () => {
    expect(brainAnswer("what's my SPRS score?")[1]).toBe('sprs · sample data')
    expect(brainAnswer('what changed this week?')[1]).toBe('trend · sample data')
  })
})

describe('escapeHtml — injection-safe personalization boundary', () => {
  it('neutralizes angle brackets and quotes', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;',
    )
  })
})

describe('LiveCommandCenter — exact-copy after-login dashboard', () => {
  it('renders the standalone command-center shell', () => {
    const { container } = render(<LiveCommandCenter />)
    expect(container.querySelector('.hs-lcc')).toBeTruthy()
    expect(container.querySelector('.shell')).toBeTruthy()
  })

  it('renders every sidebar section — guide + plan live in the sidebar, not above the dashboard', () => {
    render(<LiveCommandCenter />)
    for (const s of ['Overview', 'Live Threat Feed', 'CMMC Assessment', 'Reports', 'Brain AI', 'Your Guide', 'Plan & Unlocks', 'Settings']) {
      expect(screen.getAllByText(s).length).toBeGreaterThanOrEqual(1)
    }
  })

  it('renders the four KPI tiles', () => {
    render(<LiveCommandCenter />)
    expect(screen.getByText('Prompts scanned (24h)')).toBeTruthy()
    expect(screen.getByText('Blocked today')).toBeTruthy()
    expect(screen.getAllByText('SPRS score').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Quarantine queue')).toBeTruthy()
  })

  it('shows the Acme Defense org and Brain AI chips', () => {
    render(<LiveCommandCenter />)
    // org appears on the hero identity band AND the sidebar footer
    expect(screen.getAllByText('Acme Defense').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Who are you?')).toBeTruthy()
  })

  it('switches tabs — clicking Settings activates the Settings panel', () => {
    const { container } = render(<LiveCommandCenter />)
    const settingsBtn = screen.getAllByText('Settings').find((el) => el.closest('.slink'))!.closest('button')!
    fireEvent.click(settingsBtn)
    const settingsTab = Array.from(container.querySelectorAll('.atab')).find((t) => t.textContent?.includes('Plan & usage'))
    expect(settingsTab?.className).toContain('on')
  })

  it('escapes operator input before it reaches the Brain transcript (no XSS)', () => {
    render(<LiveCommandCenter />)
    const input = document.getElementById('lcc-bi') as HTMLInputElement
    const send = document.getElementById('lcc-bsend')!
    input.value = '<img src=x onerror=alert(1)>'
    fireEvent.click(send)
    // The raw tag must never become a real element in the transcript.
    expect(document.querySelector('.blog img')).toBeNull()
  })

  it('the Settings "Copy" button REALLY copies the proxy URL (no fake confirmation)', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(<LiveCommandCenter />)
    fireEvent.click(screen.getAllByText('Copy')[0].closest('button')!)
    await screen.findByText('Copied')
    expect(writeText).toHaveBeenCalledWith('https://proxy.houndshield.com/v1')
  })

  it('Settings has NO fake-success chrome — Reveal/Edit stubs and fabricated keys are gone', () => {
    render(<LiveCommandCenter />)
    expect(screen.queryByText('Reveal')).toBeNull()
    expect(screen.queryByText('Edit')).toBeNull()
    // The fabricated masked credentials are gone; honest states shown instead.
    expect(document.body.textContent).not.toMatch(/hs_live_•|sk-or-•/)
    expect(screen.getByText(/keyless mode/)).toBeTruthy()
  })

  it('the active sidebar tab is exposed to assistive tech via aria-current', () => {
    const { container } = render(<LiveCommandCenter />)
    expect(container.querySelectorAll('[aria-current="page"]').length).toBe(1)
    const settingsBtn = screen.getAllByText('Settings').find((el) => el.closest('.slink'))!.closest('button')!
    fireEvent.click(settingsBtn)
    expect(settingsBtn.getAttribute('aria-current')).toBe('page')
    expect(container.querySelectorAll('[aria-current="page"]').length).toBe(1)
  })

  it('carries the persistent "Simulated preview" honesty affordance', () => {
    render(<LiveCommandCenter />)
    expect(screen.getByText('Simulated preview')).toBeTruthy()
  })
})

describe('LiveCommandCenter — honest state for signed-in customers vs the demo org', () => {
  const viewer = { company: 'Vector Defense', plan: 'Pro', initials: 'VD', tier: 'pro', firstName: 'Jordan' }

  it('demo org shows the lived-in checklist; a real customer starts at step 1', () => {
    const demo = render(<LiveCommandCenter />)
    expect(demo.container.querySelectorAll('.steprow.done').length).toBe(2)
    demo.unmount()
    const real = render(<LiveCommandCenter viewer={viewer} />)
    expect(real.container.querySelectorAll('.steprow.done').length).toBe(0)
  })

  it('a real customer’s scan meter starts at ZERO — never fabricated 57% usage', () => {
    const { container } = render(<LiveCommandCenter viewer={viewer} />)
    expect(container.querySelector('#lcc-useScan')?.textContent).toBe('0 / 50,000')
  })

  it('the demo org keeps the lived-in meter seed', () => {
    const { container } = render(<LiveCommandCenter />)
    expect(container.querySelector('#lcc-useScan')?.textContent).toBe('28,500 / 50,000')
  })

  it('sign-out exists for signed-in operators and not on the public demo', () => {
    const demo = render(<LiveCommandCenter />)
    expect(demo.queryByText('Sign out')).toBeNull()
    demo.unmount()
    render(<LiveCommandCenter viewer={viewer} />)
    expect(screen.getByText('Sign out')).toBeTruthy()
  })
})

describe('LiveCommandCenter — signed-in strip-down (founder: "strip it way down")', () => {
  const viewer = { company: 'Vector Defense', plan: 'Pro', initials: 'VD', tier: 'pro', firstName: 'Jordan' }

  it('a signed-in operator lands on a stripped Overview — simulated telemetry hidden by default', () => {
    render(<LiveCommandCenter viewer={viewer} />)
    // The demo telemetry panels start hidden for a logged-in user…
    expect(screen.queryByText('Prompts scanned (24h)')).toBeNull()
    expect(screen.queryByText('Gateway throughput')).toBeNull()
    expect(screen.queryByText('Live threat feed')).toBeNull()
    expect(screen.queryByText('Detections by engine · last hour')).toBeNull()
    // …while the real next action — the activation checklist that ends on the PDF — stays.
    expect(screen.getByText('Get to your first C3PAO-ready PDF')).toBeTruthy()
  })

  it('the public demo still shows every panel (marketing preview)', () => {
    render(<LiveCommandCenter />)
    expect(screen.getByText('Prompts scanned (24h)')).toBeTruthy()
    expect(screen.getByText('Gateway throughput')).toBeTruthy()
  })
})

describe('LiveCommandCenter — guide + paywall behind sidebar buttons (founder direction)', () => {
  const clickSidebar = (label: string) => {
    const btn = screen.getAllByText(label).find((el) => el.closest('.slink'))!.closest('button')!
    fireEvent.click(btn)
  }

  it('clicking "Plan & Unlocks" opens the restriction view with priced locks (free tier)', () => {
    const { container } = render(
      <LiveCommandCenter viewer={{ company: 'Acme', plan: 'Free', initials: 'AC', tier: 'free' }} />,
    )
    clickSidebar('Plan & Unlocks')
    const planTab = Array.from(container.querySelectorAll('.atab')).find((t) =>
      t.textContent?.includes('Restricted plan'),
    )
    expect(planTab?.className).toContain('on')
    // The restriction says exactly what unlocking costs.
    expect(planTab?.textContent).toMatch(/Available on Growth — \$499\/mo/)
  })

  it('clicking "Your Guide" opens the status/next-step panel', () => {
    const { container } = render(<LiveCommandCenter />)
    clickSidebar('Your Guide')
    const guideTab = screen.getByTestId('status-panel').closest('.atab')
    expect(guideTab?.className).toContain('on')
    // …and the Overview tab is no longer the active one.
    const overview = Array.from(container.querySelectorAll('.atab'))[0]
    expect(overview?.className).toBe('atab')
  })

  it('the dashboard (Overview) is what loads first — never the guide or assessment', () => {
    render(<LiveCommandCenter />)
    expect(screen.getAllByText('Live Operations').length).toBeGreaterThanOrEqual(1)
  })

  it('the assessment mounts inline in its tab on first open — no bounce link', () => {
    render(<LiveCommandCenter />)
    // Not mounted until the operator opens the tab (keeps first paint light).
    expect(screen.queryByTestId('assessment-board')).toBeNull()
    clickSidebar('CMMC Assessment')
    expect(screen.getByTestId('assessment-board')).toBeTruthy()
    // The old deep-link that bounced users off the dashboard is gone.
    expect(document.querySelector('a[href="/command-center/shield/assessment"]')).toBeNull()
  })
})

describe('LiveCommandCenter — founder: full access, no payment required', () => {
  const founder = {
    company: 'HoundShield',
    plan: 'Founder',
    initials: 'GA',
    tier: 'agency',
    firstName: 'Gaurav',
    isFounder: true,
  }

  it('shows the founder identity in the sidebar footer', () => {
    const { container } = render(<LiveCommandCenter viewer={founder} />)
    expect(container.querySelector('.side-foot .sub')?.textContent).toBe('Founder · full access')
    expect(container.querySelector('.plan-chip')?.textContent).toMatch(/Founder access/)
  })

  it('Plan & Unlocks shows everything unlocked with the no-payment banner', () => {
    const { container } = render(<LiveCommandCenter viewer={founder} />)
    const planTab = Array.from(container.querySelectorAll('.atab')).find((t) =>
      t.textContent?.includes('Founder plan'),
    )
    expect(planTab?.textContent).toMatch(/no payment required/i)
    expect(planTab?.textContent).not.toMatch(/Locked — upgrade to unlock/)
  })

  it('Settings shows the founder plan badge and no upgrade CTA', () => {
    const { container } = render(<LiveCommandCenter viewer={founder} />)
    expect(container.querySelector('.planbadge')?.textContent).toMatch(/Founder/)
    expect(container.querySelector('.topplan')?.textContent).toMatch(/no payment required/i)
    // Founder tier unlocks every capability in the settings feature grid.
    const lockedFeats = Array.from(container.querySelectorAll('.feat.off'))
    expect(lockedFeats).toEqual([])
  })
})

describe('LiveCommandCenter — data provenance: click any number to see where it comes from', () => {
  it('every KPI tile is a button that opens the data-source dialog', () => {
    render(<LiveCommandCenter />)
    const tile = screen.getByText('Prompts scanned (24h)').closest('button')!
    expect(tile.getAttribute('aria-haspopup')).toBe('dialog')
    fireEvent.click(tile)
    const dialog = screen.getByRole('dialog')
    expect(dialog.textContent).toMatch(/Simulated demo data/)
    expect(dialog.textContent).toMatch(/SCANS_24H/)
  })

  it('all four KPI tiles open their own entry (blocked, SPRS, quarantine)', () => {
    render(<LiveCommandCenter />)
    for (const [label, needle] of [
      ['Blocked today', /BLOCKED_TODAY/],
      ['Quarantine queue', /QUAR_SEED/],
    ] as const) {
      fireEvent.click(screen.getByText(label).closest('button')!)
      expect(screen.getByRole('dialog').textContent).toMatch(needle)
      fireEvent.keyDown(window, { key: 'Escape' })
      expect(screen.queryByRole('dialog')).toBeNull()
    }
    // SPRS tile: points the operator at their real score's home.
    const sprsTile = screen.getAllByText('SPRS score').map((el) => el.closest('button')).find(Boolean)!
    fireEvent.click(sprsTile)
    expect(screen.getByRole('dialog').textContent).toMatch(/CMMC Assessment tab/)
  })

  it('the "Simulated preview" pill opens the audit-chain provenance dialog', () => {
    render(<LiveCommandCenter />)
    fireEvent.click(screen.getByText('Simulated preview'))
    const dialog = screen.getByRole('dialog')
    expect(dialog.textContent).toMatch(/Evidence chain/)
    expect(dialog.textContent).toMatch(/SHA-256/)
  })

  it('the dialog’s Open Settings CTA lands the operator on the Settings tab', () => {
    const { container } = render(<LiveCommandCenter />)
    fireEvent.click(screen.getByText('Prompts scanned (24h)').closest('button')!)
    fireEvent.click(screen.getByText(/Open Settings · Proxy URL/))
    expect(screen.queryByRole('dialog')).toBeNull()
    const settingsTab = Array.from(container.querySelectorAll('.atab')).find((t) => t.textContent?.includes('Plan & usage'))
    expect(settingsTab?.className).toContain('on')
  })

  it('panel-header source chips open the matching chart provenance', () => {
    render(<LiveCommandCenter />)
    fireEvent.click(screen.getByText(/demo · prompts\/sec/).closest('button')!)
    expect(screen.getByRole('dialog').textContent).toMatch(/random-walk/i)
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.click(screen.getByText(/sample · 142,690 prompts/).closest('button')!)
    expect(screen.getByRole('dialog').textContent).toMatch(/HOURLY_SCANS/)
  })

  it('clicking a live-feed row explains the feed’s origin (delegated on innerHTML rows)', () => {
    const { container } = render(<LiveCommandCenter />)
    const row = container.querySelector('#feed .feed-row')!
    fireEvent.click(row)
    expect(screen.getByRole('dialog').textContent).toMatch(/pool of 16 illustrative events/)
  })

  it('signed-in operator: the gateway-scans meter chip reports THEIR account, not demo seeds', () => {
    render(<LiveCommandCenter viewer={{ company: 'Vector', plan: 'Pro', initials: 'VD', tier: 'pro' }} />)
    fireEvent.click(screen.getByText('AI gateway scans'))
    const dialog = screen.getByRole('dialog')
    expect(dialog.textContent).toMatch(/Your account/)
    expect(dialog.textContent).toMatch(/nothing is simulated for your account/i)
  })

  it('hero capability chips disclose their product-fact basis', () => {
    render(<LiveCommandCenter />)
    fireEvent.click(screen.getByText('Engines').closest('button')!)
    const dialog = screen.getByRole('dialog')
    expect(dialog.textContent).toMatch(/Product fact/)
    expect(dialog.textContent).toMatch(/16 detection pattern families/)
  })
})

describe('LiveCommandCenter — subscription-aware + personalized', () => {
  const viewer = { company: 'Vector Defense', plan: 'Growth', initials: 'VD', tier: 'growth', firstName: 'Jordan' }

  it('greets the signed-in operator by name', () => {
    render(<LiveCommandCenter viewer={viewer} />)
    expect(screen.getByText('Welcome back, Jordan')).toBeTruthy()
  })

  it("surfaces the operator's plan (chip + sidebar footer), not a hardcoded Pro", () => {
    const { container } = render(<LiveCommandCenter viewer={viewer} />)
    expect(container.querySelector('.plan-chip')?.textContent).toMatch(/Growth/)
    expect(container.querySelector('.side-foot .sub')?.textContent).toMatch(/Growth · 25 seats/)
  })

  it('drives the Settings plan meters + feature grid from entitlements', () => {
    const { container } = render(<LiveCommandCenter viewer={viewer} />)
    // Growth unlocks PDF reports; the feature grid marks it Included.
    const feats = Array.from(container.querySelectorAll('.feat'))
    const pdf = feats.find((f) => f.textContent?.includes('PDF compliance reports'))
    expect(pdf?.className).toContain('on')
    // Growth = unlimited gateway scans.
    expect(container.querySelector('#lcc-useScan')?.textContent).toMatch(/Unlimited/)
  })

  it('locks a higher-tier feature for a Pro viewer with a truthful unlock label', () => {
    const pro = { company: 'Acme', plan: 'Pro', initials: 'AC', tier: 'pro', firstName: 'Rachel' }
    const { container } = render(<LiveCommandCenter viewer={pro} />)
    const feats = Array.from(container.querySelectorAll('.feat'))
    const onprem = feats.find((f) => f.textContent?.includes('On-prem'))
    expect(onprem?.className).toContain('off')
    expect(onprem?.textContent).toMatch(/Enterprise\+/)
  })
})

/**
 * Redesign contract (founder-directed, "every button works and has meaning, not
 * generic"). Pins the two things the redesign changed:
 *  1. Every Brain control is a first-class React handler — the old imperative
 *     querySelectorAll/addEventListener wiring (the "nothing works" smell) is
 *     gone, and the chips/Send actually fire the analyst.
 *  2. A signed-in operator lands on THEIR product (an activation anchor with
 *     real next actions + honest "sample preview" framing), never a simulated
 *     demo wearing their name.
 */
describe('LiveCommandCenter — redesign: every control is a real React handler (no dead/DOM-wired buttons)', () => {
  const LCC_SRC = readFileSync(path.resolve(__dirname, '../LiveCommandCenter.tsx'), 'utf8')

  it('Brain-tab starter chips fire the analyst via React onClick', () => {
    const { container } = render(<LiveCommandCenter />)
    // "Who are you?" is unique to the Brain-tab chips (not the Overview quick-ask card).
    fireEvent.click(screen.getByText('Who are you?'))
    expect(container.querySelector('.blog .bub.u')?.textContent).toContain('Who are you?')
  })

  it('the Send button fires the analyst with the typed question (React-wired, reads the input)', () => {
    const { container } = render(<LiveCommandCenter />)
    const input = document.getElementById('lcc-bi') as HTMLInputElement
    input.value = 'is my proxy connected'
    fireEvent.click(document.getElementById('lcc-bsend')!)
    const userBubbles = Array.from(container.querySelectorAll('.blog .bub.u'))
    expect(userBubbles.some((b) => b.textContent?.includes('is my proxy connected'))).toBe(true)
  })

  it('the old imperative Brain wiring is gone (DOM listeners over React nodes)', () => {
    expect(LCC_SRC).not.toContain("querySelectorAll('.chips button')")
    expect(LCC_SRC).not.toMatch(/addEventListener\('click', onSend\)/)
    // …replaced by React-owned controls.
    expect(LCC_SRC).toMatch(/BRAIN_TAB_CHIPS\.map/)
    expect(LCC_SRC).toMatch(/id="lcc-bsend" onClick=/)
  })
})

describe('LiveCommandCenter — redesign: signed-in operators land on THEIR product, not a demo with their name', () => {
  const viewer = { company: 'Vector Defense', plan: 'Pro', initials: 'VD', tier: 'pro', firstName: 'Jordan' }

  it('anonymous visitors see the public demo — no activation anchor', () => {
    render(<LiveCommandCenter />)
    expect(screen.queryByText('Connect your proxy to go live')).toBeNull()
  })

  it('a signed-in operator gets the activation anchor (real state + real next actions)', () => {
    render(<LiveCommandCenter viewer={viewer} />)
    expect(screen.getByText('Connect your proxy to go live')).toBeTruthy()
    expect(screen.getByText(/Proxy · not connected/)).toBeTruthy()
  })

  it('the activation "Get your proxy URL" CTA lands the operator on Settings (a real destination)', () => {
    const { container } = render(<LiveCommandCenter viewer={viewer} />)
    fireEvent.click(screen.getByText('Get your proxy URL').closest('button')!)
    const settingsTab = Array.from(container.querySelectorAll('.atab')).find((t) => t.textContent?.includes('Plan & usage'))
    expect(settingsTab?.className).toContain('on')
  })

  it('the activation "Start your assessment" CTA opens the real 110-control board', () => {
    render(<LiveCommandCenter viewer={viewer} />)
    fireEvent.click(screen.getByText('Start your assessment').closest('button')!)
    expect(screen.getByTestId('assessment-board')).toBeTruthy()
  })

  it("the signed-in hero band reads 'Sample preview' (honest), never 'Live demo'", () => {
    const { container } = render(<LiveCommandCenter viewer={viewer} />)
    const liv = container.querySelector('.hero .liv')
    expect(liv?.textContent).toMatch(/Sample preview/)
    expect(liv?.textContent).not.toMatch(/Live demo/)
  })
})
