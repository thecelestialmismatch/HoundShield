import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CROSS_INDUSTRY_GENAI, REGULATED_SHARE_GENAI } from '@/lib/market/netskope'

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

vi.mock('@/components/layout/NavV3',    () => ({ NavV3:    () => <nav>Nav</nav> }))
vi.mock('@/components/layout/FooterV3', () => ({ FooterV3: () => <footer>Footer</footer> }))
vi.mock('@/components/ModeBNotice',     () => ({
  ModeBNotice: () => <aside data-testid="mode-b-notice">Mode B notice</aside>,
}))

import HomePage from '../page'
import { ENGINE_COUNT } from '@/lib/detection/engines'

/* ──────────────────────────────────────────────────────────────────
 * Homepage contract — HERMES demo parity (Direction A · Steel & Cream).
 * Demo home structure, in order:
 *   hero → stat row → asymmetric advantage → one platform → CTA band
 * plus the Mode-B deployment-boundary notice (compliance gate).
 * ────────────────────────────────────────────────────────────────── */

describe('HomePage — HERMES demo parity', () => {
  it('renders without crashing', () => {
    const { container } = render(<HomePage />)
    expect(container.firstChild).toBeTruthy()
  })

  it('mounts the Direction-A design system (.hermes scope)', () => {
    const { container } = render(<HomePage />)
    expect((container.firstChild as HTMLElement).className).toContain('hermes')
  })

  // ── Hero ─────────────────────────────────────────────────────────
  // The hero leads with the control boundary rather than a claimed regulatory
  // outcome or an unsupported assertion about every external AI provider.
  it('H1 leads with the buyer-controlled boundary, not a compliance promise', () => {
    render(<HomePage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toMatch(/Keep regulated data inside your control boundary/i)
    expect(h1.textContent).not.toContain('ChatGPT')
  })

  it('hero pill leads with HIPAA and NIST, not a CMMC certification date', () => {
    render(<HomePage />)
    expect(screen.getByText(/Customer-operated controls · HIPAA & NIST 800-171 mapping/i)).toBeTruthy()
  })

  it('never badges SOC 2 in the hero — it is not started', () => {
    const { container } = render(<HomePage />)
    // A framework name in the badge row reads as a certification we hold.
    // Guarding the pill specifically, not the whole page, so prose that
    // legitimately discusses SOC 2 coverage elsewhere is unaffected.
    const pill = container.querySelector('.pill')
    expect(pill).toBeTruthy()
    expect(pill?.textContent).not.toMatch(/SOC\s?2/i)
  })

  it('hero sub scopes controls to compatible traffic inside the customer environment', () => {
    const { container } = render(<HomePage />)
    expect(container.textContent).toMatch(/scans compatible traffic inside your environment/i)
  })

  it('labels the hero dashboard as an illustrative preview rather than live customer telemetry', () => {
    render(<HomePage />)
    expect(screen.getByText('Illustrative preview')).toBeTruthy()
    expect(screen.getByText('Sample policy decisions')).toBeTruthy()
    expect(screen.getByText('not a customer score')).toBeTruthy()
  })

  it('hero trust row distinguishes hosted evaluation from the self-hosted path', () => {
    const { container } = render(<HomePage />)
    for (const t of ['Hosted evaluation clearly labelled', 'Self-hosted path for sensitive workloads', 'Your deployment, your boundary', 'Evidence-oriented PDF']) {
      expect(container.textContent).toContain(t)
    }
    // The free tier was removed from /pricing; the hero must not re-promise it.
    expect(container.textContent).not.toContain('Free to start')
  })

  // ── Stat row ─────────────────────────────────────────────────────
  it('stat row renders counts derived from the shipped detection registry', () => {
    render(<HomePage />)
    expect(screen.getByText(String(ENGINE_COUNT))).toBeTruthy()
    expect(screen.getByText('110')).toBeTruthy()
    expect(screen.getByText('<10ms')).toBeTruthy()
    expect(screen.getByText('NIST 800-171 controls')).toBeTruthy()
  })

  /**
   * Merge resolution (#302 <- main): this branch asserted a "2 / deployment
   * paths" tile and the ABSENCE of 89%; main asserts the Netskope figure. The
   * stat grid is a hard `repeat(4, 1fr)`, so only one tile fits and the source
   * was resolved to main's. The deployment distinction is still asserted — by
   * the Mode-B notice test below, which covers it more strictly than a stat
   * tile ever did.
   */
  it('replaces unverifiable market statistics with a sourced figure', () => {
    const { container } = render(<HomePage />)
    expect(container.textContent).not.toContain('~80,000')
    expect(screen.getByText(REGULATED_SHARE_GENAI.value)).toBeTruthy()
  })

  /**
   * The 89% tile is the GENERATIVE-AI slice. The all-violations figure is 81%,
   * and the two shipped on the same site with no denominators, reading as a
   * contradiction to any buyer who checked both. The tile must therefore carry
   * its scope, not just its number.
   */
  it('states the denominator alongside the 89% figure', () => {
    const { container } = render(<HomePage />)
    expect(container.textContent).toMatch(/healthcare genAI/i)
    expect(container.textContent).toContain(CROSS_INDUSTRY_GENAI.value)
  })

  it('never shows the bare 81% figure on the homepage, which has a different denominator', () => {
    const { container } = render(<HomePage />)
    expect(container.textContent).not.toContain('81%')
  })

  // ── Compliance gate (deliberate addition to the demo) ────────────
  it('keeps the Mode-B deployment-boundary notice (hosted plane is never CUI-safe)', () => {
    render(<HomePage />)
    expect(screen.getByTestId('mode-b-notice')).toBeTruthy()
  })

  // ── Evidence readiness path ───────────────────────────────────────
  it('renders the illustrative Route, Verify, and Evidence workflow', () => {
    render(<HomePage />)
    expect(screen.getByText('Evidence readiness path')).toBeTruthy()
    expect(screen.getByText('Choose the boundary deliberately')).toBeTruthy()
    expect(screen.getByText('Keep a human in the decision loop')).toBeTruthy()
    expect(screen.getByText('Build a reviewable record')).toBeTruthy()
  })

  // ── Asymmetric advantage ─────────────────────────────────────────
  it('renders the evidence-first deployment-boundary headline', () => {
    render(<HomePage />)
    expect(screen.getByText(/Start with the boundary your assessor will ask about/i)).toBeTruthy()
  })

  it('renders the demo 3-card comparison (Nightfall & Strac / Purview / HoundShield)', () => {
    render(<HomePage />)
    expect(screen.getByText(/Nightfall & Strac/i)).toBeTruthy()
    expect(screen.getByText('Microsoft Purview')).toBeTruthy()
    expect(screen.getByText('HoundShield')).toBeTruthy()
  })

  // ── One platform ─────────────────────────────────────────────────
  it('renders the evidence-oriented platform section', () => {
    render(<HomePage />)
    expect(screen.getByText('A clearer path from assessment to evidence')).toBeTruthy()
  })

  it('renders all six demo platform cards', () => {
    render(<HomePage />)
    for (const title of [
      'CMMC Self-Assessment',
      'AI-Powered Gap Analysis',
      'SSP & POA&M Export',
      'Configured AI Gateway',
      `${ENGINE_COUNT} Detection Engines`,
      'Decision Dashboard',
    ]) {
      expect(screen.getByText(title)).toBeTruthy()
    }
  })

  it('renders the platform card chips without certification framing', () => {
    render(<HomePage />)
    expect(screen.getByText('110 controls')).toBeTruthy()
    expect(screen.getByText('Prioritized')).toBeTruthy()
    expect(screen.getByText('Reviewable')).toBeTruthy()
  })

  // ── CTA band ─────────────────────────────────────────────────────
  it('final CTA invites visitors to validate a defined control boundary', () => {
    render(<HomePage />)
    expect(screen.getByText(/Ready to validate your AI control boundary\?/i)).toBeTruthy()
    expect(screen.getByText(/deployment path, compatible traffic, and evidence workflow/i)).toBeTruthy()
  })

  it('hero CTAs drive to the self-serve proof and the paid report, not a dead free tier', () => {
    render(<HomePage />)
    // The in-browser snapshot is the strongest proof we own: a buyer can
    // verify the local-scan claim in 30s with zero trust required.
    expect(document.querySelector('a[href="/demo#snapshot"]')).toBeTruthy()
    // And the only thing we sell is reachable from the hero.
    expect(document.querySelector('a[href="/pricing"]')).toBeTruthy()
  })

  // ── Guardrails (NEVER-DO list) ───────────────────────────────────
  it('does not render a second pricing grid on the homepage (one-grid rule)', () => {
    render(<HomePage />)
    expect(screen.queryByText(/Pricing that scales with your team/i)).toBeNull()
    expect(screen.queryByText('Most popular')).toBeNull()
  })

  it('does not render fabricated metrics (Rule: real numbers only)', () => {
    const { container } = render(<HomePage />)
    expect(container.textContent).not.toMatch(/14,?\d{3}\s*intercepted/i)
    expect(container.textContent).not.toMatch(/500\+\s*teams|2M\+\s*scans/i)
  })

  it('keeps the conversion order: boundary hero → proof → comparison → platform → CTA', () => {
    const { container } = render(<HomePage />)
    const text = container.textContent ?? ''
    const order = [
      'Keep regulated data inside',
      'Detection engines',
      'From control boundary to reviewable evidence.',
      'Start with the boundary your assessor will ask about',
      'A clearer path from assessment to evidence',
      'Ready to validate your AI control boundary?',
    ].map((s) => text.indexOf(s))
    expect(order.every((i) => i >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })
})
