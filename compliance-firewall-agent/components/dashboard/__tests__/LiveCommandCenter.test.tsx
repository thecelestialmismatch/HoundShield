import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt, ...p }: { src: string; alt: string; [k: string]: unknown }) => <img src={src} alt={alt} {...(p as object)} />,
}))
vi.mock('next/link', () => ({
  default: ({ children, href, ...p }: { children: React.ReactNode; href: string; [k: string]: unknown }) => <a href={href} {...(p as object)}>{children}</a>,
}))

import { LiveCommandCenter, brainAnswer } from '../LiveCommandCenter'

describe('brainAnswer — on-device keyword analyst', () => {
  it('answers identity', () => {
    const [html, src] = brainAnswer('who are you?')
    expect(html).toMatch(/Brain AI/)
    expect(src).toMatch(/identity/)
  })
  it('answers SPRS', () => {
    expect(brainAnswer("what's my SPRS score?")[0]).toMatch(/\+78/)
  })
  it('answers DFARS 7012 spill', () => {
    const [html, src] = brainAnswer('what is a DFARS 7012 spill?')
    expect(html).toMatch(/252\.204-7012/)
    expect(src).toMatch(/dfars/)
  })
  it('answers what HoundShield is', () => {
    expect(brainAnswer('what is houndshield')[0]).toMatch(/local-only AI compliance firewall/)
  })
  it('falls back gracefully', () => {
    expect(brainAnswer('hello there')[1]).toBe('brain-core')
  })
})

describe('LiveCommandCenter — exact-copy after-login dashboard', () => {
  it('renders the standalone command-center shell', () => {
    const { container } = render(<LiveCommandCenter />)
    expect(container.querySelector('.hs-lcc')).toBeTruthy()
    expect(container.querySelector('.shell')).toBeTruthy()
  })

  it('renders all six sidebar sections', () => {
    render(<LiveCommandCenter />)
    for (const s of ['Overview', 'Live Threat Feed', 'CMMC Assessment', 'Reports', 'Brain AI', 'Settings']) {
      expect(screen.getAllByText(s).length).toBeGreaterThanOrEqual(1)
    }
  })

  it('renders the four KPI tiles', () => {
    render(<LiveCommandCenter />)
    expect(screen.getByText('Prompts scanned (24h)')).toBeTruthy()
    expect(screen.getByText('Blocked today')).toBeTruthy()
    expect(screen.getAllByText('SPRS score').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Quarantine queue')).toBeTruthy()
  })

  it('shows the Acme Defense org and Brain AI chips', () => {
    render(<LiveCommandCenter />)
    expect(screen.getByText('Acme Defense')).toBeTruthy()
    expect(screen.getByText('Who are you?')).toBeTruthy()
  })

  it('switches tabs — clicking Settings activates the Settings panel', () => {
    const { container } = render(<LiveCommandCenter />)
    const settingsBtn = screen.getAllByText('Settings').find((el) => el.closest('.slink'))!.closest('button')!
    fireEvent.click(settingsBtn)
    const settingsTab = Array.from(container.querySelectorAll('.atab')).find((t) => t.textContent?.includes('Plan & usage'))
    expect(settingsTab?.className).toContain('on')
  })

  it('escapes operator input before it reaches the Brain transcript (no XSS)', () => {
    render(<LiveCommandCenter />)
    const input = document.getElementById('lcc-bi') as HTMLInputElement
    const send = document.getElementById('lcc-bsend')!
    input.value = '<img src=x onerror=alert(1)>'
    fireEvent.click(send)
    // The raw tag must never become a real element in the transcript.
    expect(document.querySelector('.blog img')).toBeNull()
  })
})
