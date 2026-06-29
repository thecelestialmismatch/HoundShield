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
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

import { NavV3 } from '../layout/NavV3'

describe('NavV3 demo-delight', () => {
  it('renders the "Products by industry" mega-menu', () => {
    render(<NavV3 />)
    expect(screen.getByText('Products by industry')).toBeTruthy()
  })

  it('lists the key industry verticals in the mega-menu', () => {
    render(<NavV3 />)
    expect(screen.getByText('Defense')).toBeTruthy()
    expect(screen.getByText('Healthcare')).toBeTruthy()
    expect(screen.getByText('Technology')).toBeTruthy()
  })

  it('does not render a fabricated intercepted counter (Rule 7: real numbers only)', () => {
    render(<NavV3 />)
    expect(screen.queryByText(/intercepted/i)).toBeNull()
  })

  it('still renders the Start free CTA and nav landmark', () => {
    render(<NavV3 />)
    expect(screen.getByRole('navigation')).toBeTruthy()
    expect(screen.getAllByText(/Start free/i).length).toBeGreaterThanOrEqual(1)
  })
})
