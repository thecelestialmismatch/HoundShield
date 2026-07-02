import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HeroScanLog } from '../HeroScanLog'

/* HeroScanLog is the verbatim port of the HERMES demo `.term` card —
   static markup, exact demo rows, no client JS. */

describe('HeroScanLog — demo .term card', () => {
  it('renders the proxy-config terminal header', () => {
    render(<HeroScanLog />)
    expect(screen.getByText('proxy-config.env')).toBeTruthy()
  })

  it('shows the before/after URL swap (the value prop)', () => {
    const { container } = render(<HeroScanLog />)
    expect(container.textContent).toContain('https://api.openai.com/v1')
    expect(container.textContent).toContain('https://proxy.houndshield.com/v1')
  })

  it('renders the five demo scan rows in order (UPPERCASE verdicts, label · ms)', () => {
    const { container } = render(<HeroScanLog />)
    const rows = Array.from(container.querySelectorAll('.term-row')).map((r) => r.textContent)
    expect(rows).toEqual([
      '● BLOCKEDCUI · CAGE 1ABC2 · 7ms',
      '● PASSEDclean · 11ms',
      '● BLOCKEDPHI · MRN · 6ms',
      '● BLOCKEDsecret · sk-… · 5ms',
      '● PASSEDclean · 13ms',
    ])
  })

  it('uses the demo verdict classes (tag-block / tag-pass)', () => {
    const { container } = render(<HeroScanLog />)
    expect(container.querySelectorAll('.tag-block').length).toBe(3)
    expect(container.querySelectorAll('.tag-pass').length).toBe(2)
  })

  it('exposes an accessible label', () => {
    render(<HeroScanLog />)
    expect(screen.getByLabelText(/HoundShield scan/i)).toBeTruthy()
  })
})
