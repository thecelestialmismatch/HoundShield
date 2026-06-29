import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Content contract for the HERMES Direction-A exact-match port.
 * Reads page source directly so it stays fast and dependency-free, and locks in:
 *  1. the demo's verbatim copy on each ported view, and
 *  2. the legal/strategy guardrails that must NEVER regress to the demo's literal text.
 * See docs/DIRECTION-A-PORT.md.
 */
const root = process.cwd()
const read = (p: string) => readFileSync(join(root, p), 'utf8')

describe('Direction-A port — demo copy present', () => {
  it('home: comparison, features and CTA use the demo headlines', () => {
    const home = read('app/page.tsx')
    expect(home).toContain("Cloud DLP scans your CUI in their cloud")
    expect(home).toContain('Everything you need for CMMC Level 2')
    expect(home).toContain('Ready to protect your CUI?')
    // demo comparison cards
    expect(home).toContain('Nightfall')
    expect(home).toContain('Microsoft Purview')
  })

  it('how-it-works: the demo 4-step sequence', () => {
    const how = read('app/how-it-works/page.tsx')
    expect(how).toContain('Local-first compliance.')
    expect(how).toContain('Zero data exposure.')
    expect(how).toContain('Change one URL')
    expect(how).toContain('Every prompt scanned locally')
    expect(how).toContain('Block, quarantine or pass')
    expect(how).toContain('Sign the evidence')
  })

  it('features: demo headline + the 16 detection engines panel', () => {
    const feat = read('app/features/page.tsx')
    expect(feat).toContain('Everything inside the firewall engine')
    expect(feat).toContain('The 16 detection engines')
    expect(feat).toContain('CAGE codes')
  })

  it('hero terminal: demo scan-log rows', () => {
    const hero = read('components/landing/HeroScanLog.tsx')
    expect(hero).toContain('CUI · CAGE 1ABC2')
    expect(hero).toMatch(/BLOCKED|PASSED/)
  })

  it('footer: demo columns + badges', () => {
    const footer = read('components/layout/FooterV3.tsx')
    expect(footer).toContain('Compliance')
    expect(footer).toContain('DFARS 7012')
  })
})

describe('Direction-A port — legal/strategy guardrails (must NOT regress)', () => {
  it('partners never ships the prohibited C3PAO referral language', () => {
    const partners = read('app/partners/page.tsx')
    expect(partners).not.toContain('C3PAO Referral Partner')
    expect(partners).not.toContain('co-branded C3PAO-ready')
    // and the legally-correct channel is present
    expect(partners.toLowerCase()).toContain('rpo')
  })

  it('home does not introduce C3PAO referral copy', () => {
    const home = read('app/page.tsx')
    expect(home).not.toContain('C3PAO Referral Partner')
  })

  it('pricing keeps the strategic $499 report front-and-centre', () => {
    const pricing = read('app/pricing/page.tsx')
    expect(pricing).toContain('$499')
  })
})
