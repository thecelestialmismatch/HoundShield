import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

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
