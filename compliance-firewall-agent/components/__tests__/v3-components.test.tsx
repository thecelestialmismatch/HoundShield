/**
 * Component tests for the shipped v3 surface.
 *
 * Five suites were removed on 2026-09-02 with the components they covered —
 * ThreatFeed, CountdownTimer, PricingToggle, CodeBlock and ComparisonFlow. Each
 * had exactly one consumer in the whole repository: this file. A component whose
 * only caller is its own test is not covered, it is embalmed: the test proves the
 * component still compiles, and nothing proves anyone wants it.
 *
 * What remains covers components a page actually renders.
 */
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── FaqAccordion ──────────────────────────────────────────────────
import { FaqAccordion, type FaqItem } from '../ui/FaqAccordion'

const SAMPLE_FAQ: FaqItem[] = [
  { question: 'Does data leave my network?', answer: 'No, it stays local.' },
  { question: 'How long to set up?',         answer: 'Under 10 minutes.' },
  { question: 'Which AI tools?',             answer: 'Any OpenAI-compatible.' },
]

describe('FaqAccordion', () => {
  it('renders all faq items', () => {
    render(<FaqAccordion items={SAMPLE_FAQ} />)
    expect(screen.getAllByTestId('faq-item').length).toBe(3)
  })

  it('answers are hidden initially', () => {
    render(<FaqAccordion items={SAMPLE_FAQ} />)
    const answers = screen.getAllByTestId('faq-answer')
    answers.forEach(a => {
      expect(a.getAttribute('aria-hidden')).toBe('true')
    })
  })

  it('clicking a question reveals its answer', async () => {
    render(<FaqAccordion items={SAMPLE_FAQ} />)
    const btn = screen.getByText('Does data leave my network?').closest('button')!
    fireEvent.click(btn)
    expect(screen.getAllByTestId('faq-answer')[0].getAttribute('aria-hidden')).toBe('false')
  })

  it('clicking the same question collapses it again', () => {
    render(<FaqAccordion items={SAMPLE_FAQ} />)
    const btn = screen.getByText('Does data leave my network?').closest('button')!
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(screen.getAllByTestId('faq-answer')[0].getAttribute('aria-hidden')).toBe('true')
  })

  it('only one item open at a time', () => {
    render(<FaqAccordion items={SAMPLE_FAQ} />)
    fireEvent.click(screen.getByText('Does data leave my network?').closest('button')!)
    fireEvent.click(screen.getByText('How long to set up?').closest('button')!)
    const open = screen.getAllByTestId('faq-answer').filter(a => a.getAttribute('aria-hidden') === 'false')
    expect(open.length).toBe(1)
  })
})

// ── PricingToggle ─────────────────────────────────────────────────
import { NavV3 } from '../layout/NavV3'

// Mock next/navigation — NavV3 doesn't use pathname but next/link needs router
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

describe('NavV3', () => {
  it('renders main navigation landmark', () => {
    render(<NavV3 />)
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeTruthy()
  })

  it('mobile menu is closed initially', () => {
    render(<NavV3 />)
    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(nav.getAttribute('data-mobile-open')).toBe('false')
  })

  it('clicking burger opens mobile menu', () => {
    render(<NavV3 />)
    const burger = screen.getByRole('button', { name: 'Open navigation' })
    fireEvent.click(burger)
    expect(screen.getByRole('navigation', { name: 'Main navigation' }).getAttribute('data-mobile-open')).toBe('true')
  })

  it('shows the purchasable CTA link, pointed at the live checkout', () => {
    render(<NavV3 />)
    expect(screen.getAllByText(/Get the \$499 report/i).length).toBeGreaterThanOrEqual(1)
    expect(document.querySelector('a[href="/pricing"]')).toBeTruthy()
  })

  it('logo image uses the demo brand-mark class (no logo-img idle/filter treatment)', () => {
    render(<NavV3 />)
    const logoImg = document.querySelector('img[alt="HoundShield"]')
    expect(logoImg).toBeTruthy()
    expect(logoImg!.className).toContain('brand-mark')
    expect(logoImg!.className).not.toContain('logo-img')
  })

  it('logo image is NOT wrapped in a bg-white div', () => {
    render(<NavV3 />)
    const logoImg = document.querySelector('img[alt="HoundShield"]')
    const parent = logoImg?.parentElement
    // Parent should be the Link anchor, not a bg-white box
    expect(parent?.className ?? '').not.toContain('bg-white')
  })

  it('logo image renders at the demo 28x36 (36px-high mark)', () => {
    render(<NavV3 />)
    const logoImg = document.querySelector('img[alt="HoundShield"]') as HTMLImageElement
    expect(logoImg?.width).toBe(28)
    expect(logoImg?.height).toBe(36)
  })
})

// ── FooterV3 ──────────────────────────────────────────────────────
import { FooterV3 } from '../layout/FooterV3'

describe('FooterV3', () => {
  it('renders footer element', () => {
    render(<FooterV3 />)
    expect(document.querySelector('footer')).toBeTruthy()
  })

  it('logo image uses the demo brand-mark class (no logo-img idle/filter treatment)', () => {
    render(<FooterV3 />)
    const logoImg = document.querySelector('img[alt="HoundShield"]')
    expect(logoImg).toBeTruthy()
    expect(logoImg!.className).toContain('brand-mark')
    expect(logoImg!.className).not.toContain('logo-img')
  })

  it('logo image is NOT wrapped in a bg-white div', () => {
    render(<FooterV3 />)
    const logoImg = document.querySelector('img[alt="HoundShield"]')
    const parent = logoImg?.parentElement
    expect(parent?.className ?? '').not.toContain('bg-white')
  })

  it('logo image renders at the demo 28x36 (36px-high mark)', () => {
    render(<FooterV3 />)
    const logoImg = document.querySelector('img[alt="HoundShield"]') as HTMLImageElement
    expect(logoImg?.width).toBe(28)
    expect(logoImg?.height).toBe(36)
  })

  it('renders compliance badges', () => {
    render(<FooterV3 />)
    expect(screen.getByText('CMMC LVL 2')).toBeTruthy()
    // HIPAA appears in both badge strip and footer link column
    const hipaaEls = screen.getAllByText('HIPAA')
    expect(hipaaEls.length).toBeGreaterThanOrEqual(1)
  })

  it('renders Product section links', () => {
    render(<FooterV3 />)
    expect(screen.getByText('Product')).toBeTruthy()
    expect(screen.getByText('Pricing')).toBeTruthy()
  })
})
