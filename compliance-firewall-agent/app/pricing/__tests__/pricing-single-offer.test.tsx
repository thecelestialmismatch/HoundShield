import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/pricing',
}))
vi.mock('@/components/layout/NavV3', () => ({ NavV3: () => <nav>Nav</nav> }))
vi.mock('@/components/layout/FooterV3', () => ({ FooterV3: () => <footer>Footer</footer> }))
vi.mock('@/components/ReportOfferCard', () => ({
  ReportOfferCard: () => <div data-testid="report-offer">$499 one-time report</div>,
}))
vi.mock('@/components/seo/FaqSection', () => ({
  FaqSection: () => <section>FAQ</section>,
}))

import PricingPage from '../page'

/* ──────────────────────────────────────────────────────────────────
 * Pricing single-offer contract.
 *
 * /pricing previously showed the $499 one-time report AND a monthly grid
 * containing a "Growth — $499/mo" tier. Two different things cost "$499"
 * on the page where money changes hands, so a buyer could not tell what
 * they were buying.
 *
 * CLAUDE.md doctrine: ONE pricing grid; never lead with a subscription
 * before the $499 report is proven to sell. Subscriptions return only
 * after 3 customers have paid $499 — and never as a second grid here.
 * ────────────────────────────────────────────────────────────────── */

describe('/pricing — exactly one offer', () => {
  it('shows the $499 one-time report offer', () => {
    render(<PricingPage />)
    expect(screen.getByTestId('report-offer')).toBeTruthy()
  })

  it('advertises no monthly subscription price', () => {
    const { container } = render(<PricingPage />)
    const text = container.textContent ?? ''
    for (const price of ['$199', '$999', '$2,499', '$159', '$399', '$799']) {
      expect(text).not.toContain(price)
    }
    expect(text).not.toMatch(/\/mo\b/)
  })

  it('renders no tier-comparison table', () => {
    const { container } = render(<PricingPage />)
    expect(container.querySelector('table')).toBeNull()
  })

  it('offers no free tier or trial on the page where money changes hands', () => {
    const { container } = render(<PricingPage />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/Start free/i)
    expect(text).not.toMatch(/7-day trial/i)
  })

  it('states the one-time, no-subscription nature explicitly', () => {
    const { container } = render(<PricingPage />)
    expect(container.textContent).toMatch(/one-time/i)
  })
})
