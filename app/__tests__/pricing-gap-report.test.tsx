import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn(), replace: vi.fn() }),
}))
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt, ...p }: { src: string; alt: string; [k: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...(p as object)} />
  ),
}))
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// jsdom lacks these browser APIs used by scroll/reveal effects
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
if (typeof window !== 'undefined' && !window.matchMedia) {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: false,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }))
}

import PricingPage from '../pricing/page'

const PAYMENT_LINK = 'https://buy.stripe.com/aFa00lgzIgJx3Aqb7qgUM00'

describe('Pricing — CMMC AI Gap Report (one-time SKU)', () => {
  it('renders the Gap Report offer wired to the live payment link', () => {
    render(<PricingPage />)
    const section = screen.getByTestId('gap-report-offer')
    expect(section.textContent).toMatch(/CMMC AI Gap Report/)
    expect(section.textContent).toMatch(/\$499/)
    const link = section.querySelector(`a[href="${PAYMENT_LINK}"]`)
    expect(link).toBeTruthy()
    expect(link?.getAttribute('rel')).toContain('noopener')
  })

  it('frames the offer honestly: one-time, no subscription, local-only analysis', () => {
    render(<PricingPage />)
    const section = screen.getByTestId('gap-report-offer')
    expect(section.textContent).toMatch(/One-time engagement/i)
    expect(section.textContent).toMatch(/never leaves your network/i)
  })
})
