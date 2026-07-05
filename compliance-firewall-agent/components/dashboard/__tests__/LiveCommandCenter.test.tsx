import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt, ...p }: { src: string; alt: string; [k: string]: unknown }) => <img src={src} alt={alt} {...(p as object)} />,
}))
vi.mock('next/link', () => ({
  default: ({ children, href, ...p }: { children: React.ReactNode; href: string; [k: string]: unknown }) => <a href={href} {...(p as object)}>{children}</a>,
}))

import { LiveCommandCenter, brainAnswer } from '../LiveCommandCenter'
import { LCC_CSS } from '../lccStyles'

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
  it('answers HIPAA / PHI questions', () => {
    const [html, src] = brainAnswer('is this HIPAA safe for patient data?')
    expect(html).toMatch(/PHI|HIPAA/)
    expect(src).toMatch(/hipaa/)
  })
  it('answers the fastest-wins / next-step question', () => {
    const [html, src] = brainAnswer('how do I raise my score fastest?')
    expect(html).toMatch(/3\.8\.3|3\.13\.11/)
    expect(src).toMatch(/next-step/)
  })
  it('answers setup / install', () => {
    expect(brainAnswer('how do I install the proxy?')[1]).toMatch(/setup/)
  })
  it('answers pricing with the $499 report as the lead', () => {
    expect(brainAnswer('how much does it cost?')[0]).toMatch(/\$499/)
  })
  it('answers audit / evidence', () => {
    expect(brainAnswer('export the audit log as a pdf')[1]).toMatch(/audit/)
  })
  it('greets on hello', () => {
    expect(brainAnswer('hello there')[1]).toMatch(/greeting/)
  })
  it('falls back gracefully on an unmatched query', () => {
    expect(brainAnswer('zxcv qwerty asdf')[1]).toBe('brain-core')
  })
  it('never emits a raw HTML tag from a canned answer (safe markup)', () => {
    for (const q of ['who are you', 'sprs', 'am i ready', 'hipaa', 'pricing', 'audit']) {
      // Only our own <b> emphasis tags are allowed; no script/img/on* handlers.
      expect(brainAnswer(q)[0]).not.toMatch(/<script|onerror|onload|<img/i)
    }
  })
})

describe('LiveCommandCenter — after-login dashboard', () => {
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
    // org appears on the hero band AND the sidebar footer
    expect(screen.getAllByText('Acme Defense').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Who are you?')).toBeTruthy()
  })

  it('respects a signed-in viewer identity', () => {
    render(<LiveCommandCenter viewer={{ company: 'Vanguard Aero', plan: 'Growth · 25 seats', initials: 'VA' }} />)
    expect(screen.getAllByText('Vanguard Aero').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Growth · 25 seats')).toBeTruthy()
  })

  it('switches tabs — clicking Settings activates the Settings panel', () => {
    const { container } = render(<LiveCommandCenter />)
    const settingsBtn = screen.getAllByText('Settings').find((el) => el.closest('.slink'))!.closest('button')!
    fireEvent.click(settingsBtn)
    const settingsTab = Array.from(container.querySelectorAll('.atab')).find((t) => t.textContent?.includes('Plan & usage'))
    expect(settingsTab?.className).toContain('on')
  })

  it('toggles the mobile sidebar + backdrop from the burger', () => {
    const { container } = render(<LiveCommandCenter />)
    const backdrop = container.querySelector('.side-backdrop')!
    expect(backdrop.className).not.toContain('show')
    const burger = container.querySelector('.burger') as HTMLButtonElement
    fireEvent.click(burger)
    expect(container.querySelector('.side')!.className).toContain('open')
    expect(container.querySelector('.side-backdrop')!.className).toContain('show')
    // tapping the backdrop closes it again
    fireEvent.click(container.querySelector('.side-backdrop')!)
    expect(container.querySelector('.side')!.className).not.toContain('open')
  })

  it('shows a typing indicator immediately when asking Brain AI', () => {
    const { container } = render(<LiveCommandCenter />)
    const input = document.getElementById('lcc-bi') as HTMLInputElement
    const send = document.getElementById('lcc-bsend')!
    input.value = 'what is my sprs score'
    fireEvent.click(send)
    expect(container.querySelector('.blog .bub.typing')).toBeTruthy()
  })

  it('escapes operator input before it reaches the Brain transcript (no XSS)', () => {
    const { container } = render(<LiveCommandCenter />)
    const input = document.getElementById('lcc-bi') as HTMLInputElement
    const send = document.getElementById('lcc-bsend')!
    input.value = '<img src=x onerror=alert(1)>'
    fireEvent.click(send)
    // The user's injected tag must never become a live element: no img inside a
    // user bubble, and no onerror handler anywhere in the transcript.
    expect(container.querySelector('.blog .bub.u img')).toBeNull()
    expect(container.querySelector('.blog img[onerror]')).toBeNull()
    // The raw payload survives as escaped text in the user bubble.
    expect(container.querySelector('.blog .bub.u')?.textContent).toContain('<img')
  })

  it('shows the HoundShield logo on every dashboard surface (sidebar, topbar, hero, Brain)', () => {
    const { container } = render(<LiveCommandCenter />)
    const marks = container.querySelectorAll('img[src="/houndshield-logo.png"]')
    // sidebar brand + topbar + hero band + Brain header chip + Brain intro avatar
    expect(marks.length).toBeGreaterThanOrEqual(5)
  })
})

describe('LCC_CSS — font + responsiveness contract (regression guards)', () => {
  it('renders in the real brand families via next/font CSS variables, not literal names', () => {
    // next/font hashes 'Fraunces'/'DM Sans', so a literal reference silently
    // falls back to serif / system-ui. The dashboard MUST use the app vars.
    expect(LCC_CSS).toMatch(/--f-disp:\s*var\(--font-display/)
    expect(LCC_CSS).toMatch(/--f:\s*var\(--font-body/)
    expect(LCC_CSS).toMatch(/--f-mono:\s*var\(--font-mono/)
  })

  it('ships phone + tablet breakpoints and dvh sizing for mobile', () => {
    expect(LCC_CSS).toMatch(/@media\(max-width:1000px\)/)
    expect(LCC_CSS).toMatch(/@media\(max-width:640px\)/)
    expect(LCC_CSS).toMatch(/100dvh/)
    expect(LCC_CSS).toMatch(/env\(safe-area-inset/)
  })

  it('keeps CustomerStatusPanel on the light surface (no dark-theme translucent bg)', () => {
    // Guard against re-introducing the white-on-white bug: the panel used to be
    // dark-themed (bg-white/[0.03] + border-white/[0.08] + text-white body) and
    // mounted on the LIGHT /console page — rendering effectively invisible.
    const here = dirname(fileURLToPath(import.meta.url))
    const panel = readFileSync(join(here, '..', 'CustomerStatusPanel.tsx'), 'utf8')
    expect(panel).toMatch(/--hs-ink/) // proves it uses the light ink token
    expect(panel).not.toMatch(/bg-white\/\[0\.0[0-9]\]/) // translucent dark surfaces
    expect(panel).not.toMatch(/border-white\/\[0\.0[0-9]\]/)
  })
})
