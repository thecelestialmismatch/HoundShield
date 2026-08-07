import { describe, it, expect } from 'vitest'
import { linkify, type LinkSegment } from '../linkify'

/**
 * Two halves to this suite, and the second is the important one.
 *
 * The first proves destinations become links. The second proves the compliance
 * vocabulary Brain AI uses all day does NOT — "and/or", "24/7", "NIST 800-171",
 * "$30K/month". A greedy matcher that links those is strictly worse than the
 * dead grey text we started with, because it puts confident-looking 404s inside
 * a compliance answer.
 */

const links = (s: string) => linkify(s).filter((x): x is Extract<LinkSegment, { kind: 'link' }> => x.kind === 'link')
const hrefs = (s: string) => links(s).map((l) => l.href)

/** Nothing may be dropped or reworded — segments must rebuild the input byte for byte. */
const rebuild = (s: string) => linkify(s).map((x) => x.text).join('')

describe('linkify — destinations become links', () => {
  it('links the site-relative path Brain AI actually sends people to', () => {
    // Verbatim from the screenshot the founder sent on 2026-08-07.
    const answer =
      "No account yet? Try the free scan at /demo#snapshot — it runs in your browser, needs no sign-up, and never transmits your prompt text."
    expect(hrefs(answer)).toEqual(['/demo#snapshot'])
  })

  it('links an absolute URL', () => {
    expect(hrefs('Read https://csrc.nist.gov/pubs/sp/800/171/r2/upd1/final for the control text')).toEqual([
      'https://csrc.nist.gov/pubs/sp/800/171/r2/upd1/final',
    ])
    expect(links('See https://example.com/a')[0].external).toBe(true)
  })

  it('links our own domain written without a scheme, as an internal path', () => {
    const [link] = links('Docs: houndshield.com/docs')
    expect(link.href).toBe('/docs')
    // Internal, so it must not open a new tab or leave the app.
    expect(link.external).toBe(false)
    expect(link.text).toBe('houndshield.com/docs')
  })

  it('handles www. and a bare domain with no path', () => {
    expect(hrefs('Visit www.houndshield.com/pricing today')).toEqual(['/pricing'])
    expect(hrefs('Visit houndshield.com for more')).toEqual(['/'])
  })

  it('turns an email into a mailto', () => {
    expect(hrefs('Contact info@houndshield.com and we will help')).toEqual([
      'mailto:info@houndshield.com',
    ])
  })

  it('links several destinations in one answer', () => {
    expect(
      hrefs('Start at /demo#snapshot, price at /pricing, or email info@houndshield.com.'),
    ).toEqual(['/demo#snapshot', '/pricing', 'mailto:info@houndshield.com'])
  })

  it('links the gateway URL the product tells you to paste', () => {
    expect(hrefs('Point your SDK at https://www.houndshield.com/api/v1 and you are done.')).toEqual([
      '/api/v1',
    ])
  })
})

describe('linkify — punctuation belongs to the sentence, not the link', () => {
  it('does not swallow a full stop', () => {
    const [link] = links('See /security.')
    expect(link.href).toBe('/security')
    expect(rebuild('See /security.')).toBe('See /security.')
  })

  it('does not swallow a comma or a closing paren', () => {
    expect(hrefs('Try /demo, then /pricing.')).toEqual(['/demo', '/pricing'])
    expect(hrefs('(see /security) for details')).toEqual(['/security'])
  })

  it('keeps a balanced paren that is genuinely part of a URL', () => {
    expect(hrefs('https://en.wikipedia.org/wiki/Rust_(programming_language) is the page')).toEqual([
      'https://en.wikipedia.org/wiki/Rust_(programming_language)',
    ])
  })

  it('does not swallow a trailing em dash sentence', () => {
    expect(hrefs('at /demo#snapshot — it runs locally')).toEqual(['/demo#snapshot'])
  })
})

describe('linkify — compliance prose is NOT a link', () => {
  const NOT_LINKS = [
    'HoundShield enforces SOC 2, HIPAA and/or CMMC Level 2 simultaneously.',
    'Monitoring runs 24/7 across every prompt.',
    'That control is N/A for your environment.',
    'NIST 800-171 Rev 2 defines 110 controls, scored -203 to +110.',
    'A C3PAO assessment costs $30K-$150K, or roughly $2K/month amortised.',
    'HIPAA 164.312(d) requires person or entity authentication.',
    'Scan latency is under 10ms (p99 0.49ms measured).',
    'Ratio was 3/4 of the total.',
  ]

  it.each(NOT_LINKS)('leaves %s entirely as text', (line) => {
    expect(linkify(line)).toEqual([{ kind: 'text', text: line }])
  })
})

describe('linkify — the no-data-loss invariant', () => {
  const SAMPLES = [
    '',
    'plain text with no links at all',
    'Try /demo#snapshot, read houndshield.com/docs, email info@houndshield.com.',
    'Mixed https://example.com/x and /pricing and 24/7 and and/or.',
    '/leading-path at the very start',
    'trailing path /at-the-end',
  ]

  it.each(SAMPLES)('rebuilds %s byte for byte', (s) => {
    expect(rebuild(s)).toBe(s)
  })

  it('is stable across repeated calls (the regex is stateful — lastIndex must reset)', () => {
    const s = 'Go to /demo and /pricing.'
    const first = linkify(s)
    const second = linkify(s)
    const third = linkify(s)
    expect(second).toEqual(first)
    expect(third).toEqual(first)
  })

  it('never emits an empty text segment', () => {
    const segs = linkify('/demo /pricing')
    expect(segs.every((s) => s.text.length > 0)).toBe(true)
  })
})
