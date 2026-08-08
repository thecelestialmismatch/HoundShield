import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/about',
}))
vi.mock('@/components/layout/NavV3', () => ({ NavV3: () => <nav>Nav</nav> }))
vi.mock('@/components/layout/FooterV3', () => ({ FooterV3: () => <footer>Footer</footer> }))
vi.mock('@/components/scroll-effects', () => ({ ScrollProgressBar: () => null }))
vi.mock('@/components/landing/animated-section', () => ({
  AnimatedSection: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AnimatedCounter: ({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) => (
    <span>{`${prefix}${target}${suffix}`}</span>
  ),
}))

import AboutPage from '../page'

/*
 * Source with comments stripped.
 *
 * The page carries a comment documenting exactly which fabricated names and
 * claims were removed and why — that record is worth keeping, and the next
 * person to touch the file should see it. But it quotes the ghosts verbatim,
 * so a raw source scan would flag the very note explaining the fix. These
 * guards are about shipped code, not prose, so strip comments before matching.
 */
const SOURCE = readFileSync(join(__dirname, '..', 'page.tsx'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')

/* ──────────────────────────────────────────────────────────────────
 * /about honesty contract.
 *
 * This page shipped three testimonials attributed to named people at
 * named companies — "Sarah Mitchell, VP of Cybersecurity, Ridgeline
 * Defense Systems" and two others. None of them exist. It also claimed
 * "1,000+ Users — trusted by over a thousand defense contractors" and
 * "20 defense subcontractors" in the beta row.
 *
 * Why this is the highest-severity class of bug on the site: the buyer
 * is a defense or healthcare security officer whose job is verifying
 * claims. One search for a fake company ends the deal and impeaches
 * every real number next to it. Fabricated endorsements are also an
 * FTC exposure under 16 CFR Part 255.
 *
 * CLAUDE.md NEVER-DO: publish fictional metrics — buyers verify
 * everything. These tests make regressions fail the build rather than
 * relying on anyone remembering.
 * ────────────────────────────────────────────────────────────────── */

describe('/about — no fabricated social proof', () => {
  it('names none of the invented customers', () => {
    const { container } = render(<AboutPage />)
    const text = container.textContent ?? ''
    for (const ghost of [
      'Sarah Mitchell',
      'James Thornton',
      'Maria Chen',
      'Ridgeline Defense',
      'Apex Tactical',
      'Vanguard Aero',
    ]) {
      expect(text, `${ghost} is a fabricated customer`).not.toContain(ghost)
      expect(SOURCE, `${ghost} still present in source`).not.toContain(ghost)
    }
  })

  it('claims no customer or user count', () => {
    const { container } = render(<AboutPage />)
    const text = container.textContent ?? ''

    // "1,000+ Users", "over a thousand defense contractors", "20 defense
    // subcontractors" — any assertion that N parties are using this.
    expect(text).not.toMatch(/\d[\d,]*\+?\s*users/i)
    expect(text).not.toMatch(/(?:over|more than)\s+a?\s*thousand/i)
    expect(text).not.toMatch(/\d+\s+defense\s+subcontractors/i)
    expect(text).not.toMatch(/trusted by\s+(?:over\s+)?[\d,]/i)
  })

  it('does not headline unearned trust', () => {
    const { container } = render(<AboutPage />)
    expect(container.textContent).not.toMatch(/Trusted by Defense Contractors/i)
  })

  it('renders no attributed quotation block', () => {
    /*
     * The shape matters as much as the strings: a testimonial is a quote
     * plus a person plus a company. Guard the pattern so a *new* set of
     * invented names cannot pass the name check above.
     */
    expect(SOURCE).not.toMatch(/\bquote\s*:/i)
    expect(SOURCE).not.toMatch(/testimonial/i)
  })

  it('keeps the market-size figure, which is sourced and not a customer claim', () => {
    // 76,598 DIB orgs needing CMMC L2 is a published DoD figure. Guarding
    // against over-correction: honesty means removing false claims, not
    // stripping true ones.
    const { container } = render(<AboutPage />)
    expect(container.textContent).toMatch(/76598|76,598/)
  })
})

describe('/about — replacement proof is computed, not asserted', () => {
  it('derives detection counts from the shipped product', () => {
    // The proof cards interpolate ENGINE_COUNT/PATTERN_COUNT rather than
    // hardcoding, so they cannot drift from lib/detection/engines.
    expect(SOURCE).toContain('ENGINE_COUNT')
    expect(SOURCE).toContain('PATTERN_COUNT')
  })

  it('offers verification the reader can perform', () => {
    const { container } = render(<AboutPage />)
    const text = container.textContent ?? ''
    expect(text).toMatch(/verify|check|benchmark|recompute/i)
  })

  it('does not present the hosted plane as CUI-safe', () => {
    // CLAUDE.md NEVER-DO: the Vercel plane is not FedRAMP-authorized.
    // Any local-boundary claim on this page must be tied to Mode B.
    const { container } = render(<AboutPage />)
    const text = container.textContent ?? ''
    if (/never leaves your network/i.test(text)) {
      expect(text).toMatch(/Mode B|Docker/i)
    }
  })
})
