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

vi.mock('@/components/layout/NavV3',    () => ({ NavV3:    () => <nav>Nav</nav> }))
vi.mock('@/components/layout/FooterV3', () => ({ FooterV3: () => <footer>Footer</footer> }))
vi.mock('@/components/ModeBNotice',     () => ({
  ModeBNotice: () => <aside data-testid="mode-b-notice">Mode B notice</aside>,
}))

import HomePage from '../page'

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
  it('H1 uses the demo copy: Stop your team from leaking CUI to ChatGPT', () => {
    render(<HomePage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toMatch(/Stop your team from leaking/i)
    expect(h1.textContent).toContain('CUI')
    expect(h1.textContent).toContain('ChatGPT')
  })

  it('hero pill carries the demo framework line', () => {
    render(<HomePage />)
    expect(screen.getByText(/Local-only · CMMC Level 2 · HIPAA · SOC 2/i)).toBeTruthy()
  })

  it('hero sub ends on the demo emphasis "on your hardware"', () => {
    const { container } = render(<HomePage />)
    expect(container.textContent).toMatch(/scanned on your hardware/i)
  })

  it('renders the live demo dashboard in the hero', () => {
    render(<HomePage />)
    expect(screen.getByText('Live demo')).toBeTruthy()
    expect(screen.getByText('Live prompt scans')).toBeTruthy()
  })

  it('hero trust row lists the four demo checks', () => {
    const { container } = render(<HomePage />)
    for (const t of ['One URL change', 'Local-only', 'Free to start', 'C3PAO-ready']) {
      expect(container.textContent).toContain(t)
    }
  })

  // ── Stat row ─────────────────────────────────────────────────────
  it('stat row renders the four demo stats', () => {
    render(<HomePage />)
    expect(screen.getByText('16')).toBeTruthy()
    expect(screen.getByText('~80,000')).toBeTruthy()
    expect(screen.getByText('110')).toBeTruthy()
    expect(screen.getByText('<10ms')).toBeTruthy()
    expect(screen.getByText('NIST 800-171 controls')).toBeTruthy()
  })

  // ── Compliance gate (deliberate addition to the demo) ────────────
  it('keeps the Mode-B deployment-boundary notice (hosted plane is never CUI-safe)', () => {
    render(<HomePage />)
    expect(screen.getByTestId('mode-b-notice')).toBeTruthy()
  })

  // ── Asymmetric advantage ─────────────────────────────────────────
  it('renders the asymmetric-advantage headline (demo copy)', () => {
    render(<HomePage />)
    expect(screen.getByText(/Cloud DLP scans your CUI in their cloud/i)).toBeTruthy()
  })

  it('renders the demo 3-card comparison (Nightfall & Strac / Purview / HoundShield)', () => {
    render(<HomePage />)
    expect(screen.getByText(/Nightfall & Strac/i)).toBeTruthy()
    expect(screen.getByText('Microsoft Purview')).toBeTruthy()
    expect(screen.getByText('HoundShield')).toBeTruthy()
  })

  // ── One platform ─────────────────────────────────────────────────
  it('renders the demo features section "Everything you need for CMMC Level 2"', () => {
    render(<HomePage />)
    expect(screen.getByText('Everything you need for CMMC Level 2')).toBeTruthy()
  })

  it('renders all six demo platform cards', () => {
    render(<HomePage />)
    for (const title of [
      'CMMC Self-Assessment',
      'AI-Powered Gap Analysis',
      'SSP & POA&M Export',
      'AI Prompt Interception',
      '16 Detection Engines',
      'Live Threat Dashboard',
    ]) {
      expect(screen.getByText(title)).toBeTruthy()
    }
  })

  it('renders the demo card chips (110 controls / Prioritized / 1-click)', () => {
    render(<HomePage />)
    expect(screen.getByText('110 controls')).toBeTruthy()
    expect(screen.getByText('Prioritized')).toBeTruthy()
    expect(screen.getByText('1-click')).toBeTruthy()
  })

  // ── CTA band ─────────────────────────────────────────────────────
  it('final CTA band uses the demo copy "Ready to protect your CUI?"', () => {
    render(<HomePage />)
    expect(screen.getByText(/Ready to protect your CUI\?/i)).toBeTruthy()
    expect(screen.getByText(/see your SPRS score in under 30 minutes/i)).toBeTruthy()
  })

  it('primary CTAs link to /signup', () => {
    render(<HomePage />)
    const signupLinks = Array.from(document.querySelectorAll('a[href="/signup"]'))
    expect(signupLinks.length).toBeGreaterThanOrEqual(2) // hero + CTA band
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

  it('matches the demo section order: hero → stats → asymmetric → platform → CTA', () => {
    const { container } = render(<HomePage />)
    const text = container.textContent ?? ''
    const order = [
      'Stop your team from leaking',
      'Detection engines',
      'Cloud DLP scans your CUI in their cloud',
      'Everything you need for CMMC Level 2',
      'Ready to protect your CUI?',
    ].map((s) => text.indexOf(s))
    expect(order.every((i) => i >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })
})
