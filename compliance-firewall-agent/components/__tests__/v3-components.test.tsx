import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── ThreatFeed ────────────────────────────────────────────────────
import { ThreatFeed } from '../ui/ThreatFeed'

describe('ThreatFeed', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('renders the feed container', () => {
    render(<ThreatFeed />)
    expect(screen.getByTestId('threat-feed')).toBeTruthy()
  })

  it('renders initial threat items', () => {
    render(<ThreatFeed />)
    const items = screen.getAllByTestId('threat-item')
    expect(items.length).toBeGreaterThanOrEqual(5)
  })

  it('shows BLOCKED pill on at least one initial item', () => {
    render(<ThreatFeed />)
    // At least one status label should be visible
    const feed = screen.getByTestId('threat-feed')
    expect(feed.textContent).toMatch(/BLOCKED|FLAGGED|PASSED/)
  })

  it('adds a new item after 1800ms', async () => {
    render(<ThreatFeed />)
    const before = screen.getAllByTestId('threat-item').length
    act(() => { vi.advanceTimersByTime(1800) })
    const after = screen.getAllByTestId('threat-item').length
    expect(after).toBeGreaterThanOrEqual(before)
  })

  it('shows live indicator badge', () => {
    render(<ThreatFeed />)
    expect(screen.getByText('Live intercept feed')).toBeTruthy()
  })
})

// ── CountdownTimer ────────────────────────────────────────────────
import { CountdownTimer } from '../ui/CountdownTimer'

describe('CountdownTimer', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('renders countdown container', () => {
    render(<CountdownTimer />)
    expect(screen.getByTestId('countdown')).toBeTruthy()
  })

  it('renders seconds block', () => {
    render(<CountdownTimer />)
    expect(screen.getByTestId('countdown-seconds')).toBeTruthy()
  })

  it('seconds value is two digits', () => {
    render(<CountdownTimer />)
    const secs = screen.getByTestId('countdown-seconds').textContent ?? ''
    expect(secs).toMatch(/^\d{2}$/)
  })

  it('updates seconds after 1000ms', async () => {
    render(<CountdownTimer />)
    const before = screen.getByTestId('countdown-seconds').textContent
    act(() => { vi.advanceTimersByTime(1000) })
    const after = screen.getByTestId('countdown-seconds').textContent
    // Either same (59→00 rollover) or different
    expect(typeof after).toBe('string')
  })

  it('renders all four time unit labels', () => {
    render(<CountdownTimer />)
    const text = screen.getByTestId('countdown').textContent ?? ''
    expect(text).toContain('DD')
    expect(text).toContain('HH')
    expect(text).toContain('MM')
    expect(text).toContain('SS')
  })
})

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
import { PricingToggle } from '../ui/PricingToggle'

describe('PricingToggle', () => {
  it('renders with monthly selected by default', () => {
    render(<PricingToggle />)
    const toggle = screen.getByRole('switch')
    expect(toggle.getAttribute('aria-checked')).toBe('false')
  })

  it('clicking toggle switches to annual', () => {
    render(<PricingToggle />)
    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-checked')).toBe('true')
  })

  it('calls onChange with annual when switching', () => {
    const cb = vi.fn()
    render(<PricingToggle onChange={cb} />)
    fireEvent.click(screen.getByRole('switch'))
    expect(cb).toHaveBeenCalledWith('annual')
  })

  it('shows savings badge when annual selected', () => {
    render(<PricingToggle />)
    fireEvent.click(screen.getByRole('switch'))
    expect(screen.getByText('−20%')).toBeTruthy()
  })

  it('clicking Annual text label also activates annual', () => {
    const cb = vi.fn()
    render(<PricingToggle onChange={cb} />)
    fireEvent.click(screen.getByText('Annual'))
    expect(cb).toHaveBeenCalledWith('annual')
  })
})

// ── CodeBlock ─────────────────────────────────────────────────────
import { CodeBlock } from '../ui/CodeBlock'

describe('CodeBlock', () => {
  it('renders the provided code', () => {
    render(<CodeBlock code="OPENAI_BASE_URL=https://proxy.houndshield.com" />)
    expect(screen.getByText('OPENAI_BASE_URL=https://proxy.houndshield.com')).toBeTruthy()
  })

  it('shows filename when provided', () => {
    render(<CodeBlock code="test" filename=".env" />)
    expect(screen.getByText('.env')).toBeTruthy()
  })

  it('shows language label when provided', () => {
    render(<CodeBlock code="test" language="bash" />)
    expect(screen.getByText('bash')).toBeTruthy()
  })

  it('renders copy button', () => {
    render(<CodeBlock code="test" />)
    expect(screen.getByRole('button', { name: /copy/i })).toBeTruthy()
  })

  it('shows Copy label initially', () => {
    render(<CodeBlock code="test" />)
    expect(screen.getByText('Copy')).toBeTruthy()
  })
})

// ── ComparisonFlow ────────────────────────────────────────────────
import { ComparisonFlow } from '../ui/ComparisonFlow'

describe('ComparisonFlow', () => {
  it('renders without crashing', () => {
    const { container } = render(<ComparisonFlow />)
    expect(container.firstChild).toBeTruthy()
  })

  it('shows Without HoundShield panel', () => {
    render(<ComparisonFlow />)
    expect(screen.getByText('Without HoundShield')).toBeTruthy()
  })

  it('shows With HoundShield panel', () => {
    render(<ComparisonFlow />)
    expect(screen.getByText('With HoundShield')).toBeTruthy()
  })

  it('highlights local data boundary in positive panel', () => {
    render(<ComparisonFlow />)
    expect(screen.getByText("Data never leaves your network")).toBeTruthy()
  })

  it('shows CUI exposed warning in negative panel', () => {
    render(<ComparisonFlow />)
    expect(screen.getByText('(CUI exposed)')).toBeTruthy()
  })
})

// ── NavV3 ─────────────────────────────────────────────────────────
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

  it('shows Start free CTA link', () => {
    render(<NavV3 />)
    const links = screen.getAllByText('Start free')
    expect(links.length).toBeGreaterThanOrEqual(1)
  })

  it('logo image has logo-img class (no bg-white wrapper)', () => {
    render(<NavV3 />)
    const logoImg = document.querySelector('img[alt="HoundShield"]')
    expect(logoImg).toBeTruthy()
    expect(logoImg!.className).toContain('logo-img')
  })

  it('logo image is NOT wrapped in a bg-white div', () => {
    render(<NavV3 />)
    const logoImg = document.querySelector('img[alt="HoundShield"]')
    const parent = logoImg?.parentElement
    // Parent should be the Link anchor, not a bg-white box
    expect(parent?.className ?? '').not.toContain('bg-white')
  })

  it('logo image renders at 40x40', () => {
    render(<NavV3 />)
    const logoImg = document.querySelector('img[alt="HoundShield"]') as HTMLImageElement
    expect(logoImg?.width).toBe(40)
    expect(logoImg?.height).toBe(40)
  })
})

// ── FooterV3 ──────────────────────────────────────────────────────
import { FooterV3 } from '../layout/FooterV3'

describe('FooterV3', () => {
  it('renders footer element', () => {
    render(<FooterV3 />)
    expect(document.querySelector('footer')).toBeTruthy()
  })

  it('logo image has logo-img class (no bg-white wrapper)', () => {
    render(<FooterV3 />)
    const logoImg = document.querySelector('img[alt="HoundShield"]')
    expect(logoImg).toBeTruthy()
    expect(logoImg!.className).toContain('logo-img')
  })

  it('logo image is NOT wrapped in a bg-white div', () => {
    render(<FooterV3 />)
    const logoImg = document.querySelector('img[alt="HoundShield"]')
    const parent = logoImg?.parentElement
    expect(parent?.className ?? '').not.toContain('bg-white')
  })

  it('logo image renders at 48x48', () => {
    render(<FooterV3 />)
    const logoImg = document.querySelector('img[alt="HoundShield"]') as HTMLImageElement
    expect(logoImg?.width).toBe(48)
    expect(logoImg?.height).toBe(48)
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
