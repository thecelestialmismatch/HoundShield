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

import { LiveCommandCenter, brainAnswer, escapeHtml } from '../LiveCommandCenter'
import { getEntitlements } from '@/lib/billing/entitlements'

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
