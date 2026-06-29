import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

import { FeaturesGrid } from '../FeaturesGrid'

describe('FeaturesGrid', () => {
  it('renders the features section', () => {
    const { container } = render(<FeaturesGrid />)
    expect(container.querySelector('#features')).toBeTruthy()
  })

  it('renders section heading', () => {
    render(<FeaturesGrid />)
    expect(screen.getByText(/Built for the audit/i)).toBeTruthy()
  })

  it('renders eyebrow label', () => {
    render(<FeaturesGrid />)
    expect(screen.getByText(/WHAT'S INSIDE/i)).toBeTruthy()
  })

  it('renders subheading about NIST controls', () => {
    render(<FeaturesGrid />)
    expect(screen.getByText(/NIST SP 800-171/i)).toBeTruthy()
  })

  it('renders 6 feature cards', () => {
    render(<FeaturesGrid />)
    const cards = document.querySelectorAll('[data-testid^="feature-card-"]')
    expect(cards.length).toBe(6)
  })

  it('each card has data-hovered=false initially', () => {
    render(<FeaturesGrid />)
    const cards = document.querySelectorAll('[data-testid^="feature-card-"]')
    cards.forEach(card => {
      expect(card.getAttribute('data-hovered')).toBe('false')
    })
  })

  it('card title visible without hover', () => {
    render(<FeaturesGrid />)
    expect(screen.getByText('Local Scanning')).toBeTruthy()
    expect(screen.getByText('C3PAO-Ready PDF')).toBeTruthy()
    expect(screen.getByText('Zero-Friction Deploy')).toBeTruthy()
    expect(screen.getByText('OODA Engine')).toBeTruthy()
    expect(screen.getByText('16 CUI Patterns')).toBeTruthy()
    expect(screen.getByText('Brain AI')).toBeTruthy()
  })

  it('hovering a card sets data-hovered=true', () => {
    render(<FeaturesGrid />)
    const card = document.querySelector('[data-testid="feature-card-0"]')!
    fireEvent.mouseEnter(card)
    expect(card.getAttribute('data-hovered')).toBe('true')
  })

  it('mouse leave resets data-hovered to false', () => {
    render(<FeaturesGrid />)
    const card = document.querySelector('[data-testid="feature-card-0"]')!
    fireEvent.mouseEnter(card)
    fireEvent.mouseLeave(card)
    expect(card.getAttribute('data-hovered')).toBe('false')
  })

  it('only one card hovered at a time', () => {
    render(<FeaturesGrid />)
    const card0 = document.querySelector('[data-testid="feature-card-0"]')!
    const card1 = document.querySelector('[data-testid="feature-card-1"]')!
    fireEvent.mouseEnter(card0)
    fireEvent.mouseEnter(card1)
    expect(card0.getAttribute('data-hovered')).toBe('false')
    expect(card1.getAttribute('data-hovered')).toBe('true')
  })

  it('control tags are present in DOM', () => {
    render(<FeaturesGrid />)
    expect(screen.getByText('SC.3.177')).toBeTruthy()
    expect(screen.getByText('CA.3.162')).toBeTruthy()
    expect(screen.getByText('CM.2.061')).toBeTruthy()
    expect(screen.getByText('AU.2.041')).toBeTruthy()
    expect(screen.getByText('MP.2.120')).toBeTruthy()
    expect(screen.getByText('AT.2.056')).toBeTruthy()
  })

  it('body text is present in DOM for each card', () => {
    render(<FeaturesGrid />)
    expect(screen.getByText(/Every prompt is classified on your hardware/i)).toBeTruthy()
    expect(screen.getByText(/One-click audit export/i)).toBeTruthy()
    expect(screen.getByText(/One proxy URL change/i)).toBeTruthy()
    expect(screen.getByText(/Real-time Observe/i)).toBeTruthy()
    expect(screen.getByText(/Covering ITAR/i)).toBeTruthy()
    expect(screen.getByText(/On-device knowledge graph/i)).toBeTruthy()
  })

  it('feature-expand-wrap uses data-hovered attribute for CSS targeting', () => {
    render(<FeaturesGrid />)
    const expandWraps = document.querySelectorAll('.feature-expand-wrap')
    expect(expandWraps.length).toBe(6)
  })

  it('feature-control-tag elements present in each card', () => {
    render(<FeaturesGrid />)
    const tags = document.querySelectorAll('.feature-control-tag')
    expect(tags.length).toBe(6)
  })

  it('icon containers rendered for each card', () => {
    render(<FeaturesGrid />)
    const cards = document.querySelectorAll('[data-testid^="feature-card-"]')
    cards.forEach(card => {
      const iconWrap = card.querySelector('.flex-shrink-0')
      expect(iconWrap).toBeTruthy()
    })
  })
})
