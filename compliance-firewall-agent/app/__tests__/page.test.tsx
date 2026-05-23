import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────
vi.mock('next/image', () => ({
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
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

// Stub all complex client components
vi.mock('@/components/ui/ThreatFeed',    () => ({ ThreatFeed:    () => <div data-testid="threat-feed-mock" /> }))
vi.mock('@/components/ui/CountdownTimer',() => ({ CountdownTimer:() => <div data-testid="countdown-mock">days</div> }))
vi.mock('@/components/ui/ComparisonFlow',() => ({ ComparisonFlow:() => <div data-testid="comparison-flow-mock" /> }))
vi.mock('@/components/ui/FaqAccordion',  () => ({
  FaqAccordion: ({ items }: { items: { question: string; answer: string }[] }) => (
    <dl>{items.map(i => <div key={i.question}><dt>{i.question}</dt><dd>{i.answer}</dd></div>)}</dl>
  ),
}))
vi.mock('@/components/ui/CodeBlock',     () => ({ CodeBlock: ({ code }: { code: string }) => <pre>{code}</pre> }))
vi.mock('@/components/landing/FeaturesGrid', () => ({
  FeaturesGrid: () => <section data-testid="features-grid-mock">Features Grid</section>,
}))
vi.mock('@/components/layout/NavV3',    () => ({ NavV3:    () => <nav>Nav</nav> }))
vi.mock('@/components/layout/FooterV3', () => ({ FooterV3: () => <footer>Footer</footer> }))

import HomePage from '../page'

// ── Tests ─────────────────────────────────────────────────────────

describe('HomePage', () => {
  it('renders without crashing', () => {
    const { container } = render(<HomePage />)
    expect(container.firstChild).toBeTruthy()
  })

  it('H1 contains "CUI"', () => {
    render(<HomePage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toContain('CUI')
  })

  it('H1 contains "ChatGPT"', () => {
    render(<HomePage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toContain('ChatGPT')
  })

  it('H1 updated copy: Stop your team from leaking', () => {
    render(<HomePage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toMatch(/Stop your team from leaking/i)
  })

  it('renders ThreatFeed in hero', () => {
    render(<HomePage />)
    expect(screen.getByTestId('threat-feed-mock')).toBeTruthy()
  })

  it('renders FeaturesGrid section', () => {
    render(<HomePage />)
    expect(screen.getByTestId('features-grid-mock')).toBeTruthy()
  })

  it('renders CountdownTimer in CTA', () => {
    render(<HomePage />)
    expect(screen.getByTestId('countdown-mock')).toBeTruthy()
  })

  it('renders "days" label in countdown area', () => {
    render(<HomePage />)
    expect(screen.getByTestId('countdown-mock').textContent).toContain('days')
  })

  it('Jordan section is present', () => {
    render(<HomePage />)
    expect(screen.getByTestId('jordan-section')).toBeTruthy()
  })

  it('Jordan section contains "BUILT FOR JORDAN"', () => {
    render(<HomePage />)
    const jordan = screen.getByTestId('jordan-section')
    expect(jordan.textContent).toMatch(/BUILT FOR JORDAN/i)
  })

  it('Jordan pull quote is present', () => {
    render(<HomePage />)
    expect(screen.getByText(/I needed the PDF I could hand my C3PAO assessor/i)).toBeTruthy()
  })

  it('Jordan buyer profile card shows Role field', () => {
    render(<HomePage />)
    expect(screen.getByText('IT Security Manager')).toBeTruthy()
  })

  it('Jordan buyer profile card shows Deadline field', () => {
    render(<HomePage />)
    expect(screen.getByText('November 10, 2026')).toBeTruthy()
  })

  it('stats strip renders 4 stat values', () => {
    render(<HomePage />)
    expect(screen.getByText('16')).toBeTruthy()
    expect(screen.getByText('~80,000')).toBeTruthy()
    expect(screen.getByText('Nov 2026')).toBeTruthy()
    expect(screen.getByText('<10ms')).toBeTruthy()
  })

  it('renders Asymmetric Advantage section headline', () => {
    render(<HomePage />)
    expect(screen.getByText(/Every other tool makes/i)).toBeTruthy()
  })

  it('ComparisonFlow is rendered', () => {
    render(<HomePage />)
    expect(screen.getByTestId('comparison-flow-mock')).toBeTruthy()
  })

  it('How It Works heading updated copy', () => {
    render(<HomePage />)
    expect(screen.getByText(/Live in ten minutes/i)).toBeTruthy()
  })

  it('How It Works subheading: Audited in ten seconds', () => {
    render(<HomePage />)
    expect(screen.getByText(/Audited in ten seconds/i)).toBeTruthy()
  })

  it('renders 3 How It Works steps', () => {
    render(<HomePage />)
    expect(screen.getByText('01')).toBeTruthy()
    expect(screen.getByText('02')).toBeTruthy()
    expect(screen.getByText('03')).toBeTruthy()
  })

  it('env var code block present in step 01', () => {
    render(<HomePage />)
    expect(screen.getByText('OPENAI_BASE_URL=https://proxy.houndshield.com')).toBeTruthy()
  })

  it('pricing section is present', () => {
    render(<HomePage />)
    expect(screen.getByText('Pricing that scales with your team')).toBeTruthy()
  })

  it('renders 5 pricing tiers', () => {
    render(<HomePage />)
    expect(screen.getByText('Free')).toBeTruthy()
    expect(screen.getByText('Pro')).toBeTruthy()
    expect(screen.getByText('Growth')).toBeTruthy()
    expect(screen.getByText('Enterprise')).toBeTruthy()
    expect(screen.getByText('Federal')).toBeTruthy()
  })

  it('Pro plan marked as most popular', () => {
    render(<HomePage />)
    expect(screen.getByText('Most popular')).toBeTruthy()
  })

  it('CTA final section contains audit copy', () => {
    render(<HomePage />)
    expect(screen.getByText(/The audit doesn/i)).toBeTruthy()
  })

  it('primary CTA has Start free link', () => {
    render(<HomePage />)
    const links = screen.getAllByText(/Start free/i)
    expect(links.length).toBeGreaterThanOrEqual(1)
  })

  it('CMMC deadline badge visible in hero', () => {
    render(<HomePage />)
    // Appears in hero badge and final CTA — both are correct
    const els = screen.getAllByText(/CMMC Level 2 deadline/i)
    expect(els.length).toBeGreaterThanOrEqual(1)
  })

  it('FAQ section renders first question', () => {
    render(<HomePage />)
    expect(screen.getByText(/Does prompt content ever leave my network/i)).toBeTruthy()
  })
})
