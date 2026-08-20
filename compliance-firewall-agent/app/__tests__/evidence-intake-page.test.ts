import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const read = (relative: string) => readFileSync(resolve(process.cwd(), relative), 'utf8')

describe('permanent Evidence Intake public page', () => {
  it('uses the shared HoundShield navigation and footer instead of preview-only chrome', () => {
    const page = read('app/evidence-intake/page.tsx')
    expect(page).toContain("import { NavV3 }")
    expect(page).toContain("import { FooterV3 }")
    expect(page).toContain('<NavV3 />')
    expect(page).toContain('<FooterV3 />')
    expect(page).toContain("canonical: '/evidence-intake'")
  })

  it('states the browser-local, human-review boundary without automatic compliance claims', () => {
    const publicExperience = read('components/landing/EvidenceIntakePublic.tsx')
    expect(publicExperience).toContain('human approval required')
    expect(publicExperience).toContain('never uploaded by this page')
    expect(publicExperience).toContain('not autonomous compliance scoring or an assessor decision')
    expect(publicExperience).toContain('no hidden cloud OCR fallback')
    expect(publicExperience).not.toMatch(/certified|C3PAO-ready|automatic compliance/i)
  })

  it('is discoverable from the shared product navigation and footer', () => {
    const nav = read('components/layout/NavV3.tsx')
    const footer = read('components/layout/FooterV3.tsx')
    expect(nav).toContain("label: 'Evidence Intake'")
    expect(nav).toContain("href: '/evidence-intake'")
    expect(footer).toContain("label: 'Evidence Intake'")
    expect(footer).toContain("href: '/evidence-intake'")
  })
})
