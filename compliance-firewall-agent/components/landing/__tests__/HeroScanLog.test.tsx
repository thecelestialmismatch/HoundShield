import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HeroScanLog } from '../HeroScanLog'

describe('HeroScanLog', () => {
  it('renders the proxy-config terminal header', () => {
    render(<HeroScanLog />)
    expect(screen.getByText('proxy-config.env')).toBeTruthy()
  })

  it('shows the before/after URL swap (the value prop)', () => {
    render(<HeroScanLog />)
    expect(screen.getByText('https://api.openai.com/v1')).toBeTruthy()
    expect(screen.getByText('https://proxy.houndshield.com/v1')).toBeTruthy()
  })

  it('renders initial scan-log rows with Blocked + Passed verdicts', () => {
    render(<HeroScanLog />)
    expect(screen.getAllByText('Blocked').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Passed').length).toBeGreaterThanOrEqual(1)
  })

  it('exposes an accessible label', () => {
    render(<HeroScanLog />)
    expect(screen.getByLabelText(/HoundShield live scan/i)).toBeTruthy()
  })

  it('does not crash when window.matchMedia is unavailable (jsdom)', () => {
    // The reduced-motion guard must tolerate a missing matchMedia.
    const { container } = render(<HeroScanLog />)
    expect(container.firstChild).toBeTruthy()
  })
})
