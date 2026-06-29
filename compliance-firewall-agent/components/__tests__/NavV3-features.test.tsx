import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt, ...p }: { src: string; alt: string; [k: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...(p as object)} />
  ),
}))
vi.mock('next/link', () => ({
  default: ({ children, href, ...p }: { children: React.ReactNode; href: string; [k: string]: unknown }) => <a href={href} {...(p as object)}>{children}</a>,
}))

import { NavV3 } from '../layout/NavV3'

describe('NavV3 — exact-copy of the Direction-A demo nav', () => {
  it('renders all five hover mega-menu headers', () => {
    render(<NavV3 />)
    expect(screen.getByText('Products by Industry')).toBeTruthy()
    expect(screen.getByText('Core Capabilities')).toBeTruthy()
    expect(screen.getByText('Partner Program')).toBeTruthy()
    expect(screen.getByText('Documentation')).toBeTruthy()
    // "Pricing" appears as both a trigger and a dropdown eyebrow.
    expect(screen.getAllByText('Pricing').length).toBeGreaterThanOrEqual(1)
  })

  it('lists the six industry verticals in the Products mega-menu', () => {
    render(<NavV3 />)
    for (const v of ['Technology', 'Healthcare', 'Defense', 'Legal & Finance', 'Five Eyes', 'Government']) {
      expect(screen.getAllByText(new RegExp(v.replace(/[.*+?^${}()|[\]\\&]/g, '\\$&'))).length).toBeGreaterThanOrEqual(1)
    }
  })

  it('wires every industry to its public /products route (no authed deep-links)', () => {
    render(<NavV3 />)
    for (const slug of ['technology', 'healthcare', 'defense', 'legal', 'global', 'government']) {
      expect(document.querySelector(`a[href="/products/${slug}"]`)).toBeTruthy()
    }
    // The C4 regression must never return: no public nav link into an authed route.
    expect(document.querySelector('a[href^="/command-center/shield"]')).toBeNull()
  })

  it('exposes the demo pricing ladder in the Pricing flyout', () => {
    render(<NavV3 />)
    expect(screen.getByText('$199')).toBeTruthy()
    expect(screen.getByText('$499')).toBeTruthy()
    expect(screen.getByText('$999')).toBeTruthy()
  })

  it('renders the truthful product trust badge (not a fabricated counter)', () => {
    render(<NavV3 />)
    // The old client-incrementing "14,672 intercepted" counter was a fictional
    // metric; it is replaced by a verifiable product fact.
    expect(screen.getByText(/engines · <10ms scan/i)).toBeTruthy()
    expect(screen.queryByText(/intercepted/i)).toBeNull()
  })

  it('renders the logo with the cursor-reactive transform hook', () => {
    render(<NavV3 />)
    const logo = document.querySelector('img[alt="HoundShield"]')
    expect(logo).toBeTruthy()
    expect(logo!.closest('a')!.className).toContain('group/brand')
  })

  it('still renders the Start free CTA and nav landmark', () => {
    render(<NavV3 />)
    expect(screen.getByRole('navigation')).toBeTruthy()
    expect(screen.getAllByText(/Start free/i).length).toBeGreaterThanOrEqual(1)
  })
})
