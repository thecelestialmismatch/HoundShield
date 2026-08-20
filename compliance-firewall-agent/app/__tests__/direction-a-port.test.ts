import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Content contract for the HERMES Direction-A exact-match port.
 * Reads page source directly so it stays fast and dependency-free, and locks in:
 *  1. the demo's visual-information architecture on each ported view, and
 *  2. the legal/strategy guardrails that must NEVER regress to unsupported demo copy.
 * See docs/DIRECTION-A-PORT.md.
 */
const root = process.cwd()
const read = (p: string) => readFileSync(join(root, p), 'utf8')

describe('Direction-A port — information architecture present', () => {
  it('home: comparison, features and CTA retain the ported hierarchy without unsupported claims', () => {
    const home = read('app/page.tsx')
    expect(home).toContain('Start with the boundary your assessor will ask about')
    expect(home).not.toContain("Cloud DLP scans your CUI in their cloud")
    expect(home).toContain('A clearer path from assessment to evidence')
    expect(home).toContain('Ready to validate your AI control boundary?')
    // Comparison cards, named by CATEGORY rather than by competitor brand.
    expect(home).toContain('Cloud-routed DLP')
    expect(home).toContain('Productivity-suite governance')
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

  it('features: demo headline + the detection engines panel', () => {
    const feat = read('app/features/page.tsx')
    expect(feat).toContain('Everything inside the firewall engine')
    // The count is derived from lib/detection/engines (ENGINE_COUNT) rather
    // than typed as a literal, so the panel heading can never disagree with
    // the shipped engine list. Assert the derived form, not a stale number.
    expect(feat).toContain('{ENGINE_COUNT} detection engines')
    expect(feat).toContain("from '@/lib/detection/engines'")
    // The engine names themselves now live in that module.
    const engines = read('lib/detection/engines.ts')
    expect(engines).toContain('CAGE codes')
  })

  it('hero live demo dashboard: scan-feed rows', () => {
    const hero = read('components/landing/HeroDemoDashboard.tsx')
    expect(hero).toContain('CAGE 1ABC2')
    expect(hero).toMatch(/BLOCKED|PASSED/)
    expect(hero).toContain('Illustrative preview')
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
