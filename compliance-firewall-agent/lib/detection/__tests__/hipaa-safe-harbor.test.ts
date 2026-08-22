import { describe, it, expect } from 'vitest'
import { BUILTIN_PATTERNS } from '@/lib/classifier/patterns'

/* ──────────────────────────────────────────────────────────────────
 * All 18 HIPAA Safe Harbor identifiers — 45 CFR §164.514(b)(2).
 *
 * `public/llms.txt` publishes this claim to every AI crawler, and the
 * healthcare pages lean on it: Rachel's whole reason to buy is that a
 * prompt containing PHI gets caught before it reaches ChatGPT. It is the
 * most consequential detection claim on the site.
 *
 * It was also unverified. `engine-backing.test.ts` was written the same
 * day after three of the sixteen advertised engines turned out to detect
 * nothing at all, so "the names are all present in the registry" is not
 * evidence any more. Each identifier below is exercised with realistic
 * clinical text, and a fixture that fires on nothing fails the build.
 *
 * Scanned against BUILTIN_PATTERNS — the COMPLETE registry, which already
 * contains every HIPAA and CMMC pattern — rather than the HIPAA sub-array.
 * That is what `snapshot-from-scan.ts` and the gateway actually run, and the
 * distinction is load-bearing: a private EHR workstation IP is caught by the
 * general IPv4 pattern, not by a HIPAA-specific one. Testing the sub-array
 * would report a coverage hole the product does not have.
 *
 * ponytail: one representative phrasing per identifier, not a corpus.
 * These are recall spot-checks on the claim, not a measure of it — a
 * pattern that catches this sample and misses three other phrasings still
 * passes. Upgrade path: a labelled PHI corpus with a measured recall
 * floor, if a customer ever disputes a miss.
 * ────────────────────────────────────────────────────────────────── */

/** The eighteen categories, in the order the regulation lists them. */
const SAFE_HARBOR: [string, string][] = [
  ['1. Names', 'patient name: Sarah Whitfield, seen today'],
  ['2. Geographic subdivisions', 'lives at 412 Maple Street, ZIP 02139'],
  ['3. Dates', 'date of birth 04/12/1971, admitted 03/02/2026'],
  ['4. Telephone numbers', 'patient phone 617-555-0184 for follow-up'],
  ['5. Fax numbers', 'fax: 617-555-0199 to the referring clinic'],
  ['6. Email addresses', 'patient email s.whitfield@example.com on file'],
  ['7. Social Security numbers', 'patient SSN 123-45-6789 for billing'],
  ['8. Medical record numbers', 'MRN 4429871 pulled from the chart'],
  ['9. Health plan beneficiary numbers', 'Medicare ID: 1EG4TE5MK73'],
  ['10. Account numbers', 'patient account number 88213345 in billing'],
  ['11. Certificate / license numbers', 'medical license number MD449201'],
  ['12. Vehicle identifiers', 'VIN 1HGBH41JXMN109186 on the transport form'],
  ['13. Device identifiers', 'device serial number PM-88213-B implanted'],
  ['14. URLs', 'patient portal https://mychart.example.org/p/44821'],
  ['15. IP addresses', 'EHR workstation at 10.4.22.19'],
  ['16. Biometric identifiers', 'fingerprint biometric template stored'],
  ['17. Full-face photographs', 'patient photo attached to the chart'],
  ['18. Any other unique identifier', 'encounter ID 4429871A for this visit'],
]

function hits(text: string): string[] {
  return BUILTIN_PATTERNS.filter((p) => {
    p.regex.lastIndex = 0
    return p.regex.test(text)
  }).map((p) => p.name)
}

describe('HIPAA Safe Harbor coverage', () => {
  it('exercises exactly eighteen identifiers', () => {
    // The regulation names 18. A fixture list that quietly loses one would
    // turn this whole file into a weaker claim than the site publishes.
    expect(SAFE_HARBOR.length).toBe(18)
  })

  it.each(SAFE_HARBOR)('%s is detected', (_identifier, sample) => {
    expect(hits(sample), `nothing matched: "${sample}"`).not.toEqual([])
  })

  it('reports every uncovered identifier at once', () => {
    const uncovered = SAFE_HARBOR.filter(([, sample]) => hits(sample).length === 0).map(([id]) => id)
    expect(
      uncovered,
      'public/llms.txt claims all 18 Safe Harbor identifiers are covered',
    ).toEqual([])
  })

  it('still has teeth — ordinary clinical prose with no identifier stays clean', () => {
    expect(hits('The patient reports feeling much better since the last visit.')).toEqual([])
  })
})
