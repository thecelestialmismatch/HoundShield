import { describe, expect, it } from 'vitest'
import {
  inferEvidenceKind,
  LOCAL_EVIDENCE_POLICY,
  makeReviewFields,
  toLocalManifest,
  validateEvidenceFile,
  type LocalEvidenceReview,
} from '../local-intake'

describe('browser-local Evidence Intake boundary', () => {
  it('allows only bounded PDFs before parsing', () => {
    const valid = new File(['pdf'], 'access-review.pdf', { type: 'application/pdf' })
    const wrongType = new File(['text'], 'notes.txt', { type: 'text/plain' })
    const oversized = new File([new Uint8Array(LOCAL_EVIDENCE_POLICY.maxBytes + 1)], 'large.pdf', { type: 'application/pdf' })

    expect(validateEvidenceFile(valid)).toEqual([])
    expect(validateEvidenceFile(wrongType).join(' ')).toMatch(/PDF file/)
    expect(validateEvidenceFile(oversized).join(' ')).toMatch(/exceeds/)
  })

  it('uses deterministic document cues and page references rather than automatic compliance judgments', () => {
    const pages = [
      'Quarterly user access review. Owner: Security Manager. Review period: 2026-08.',
      'Privileged access roles, approvals, and reviewer sign-off are listed below.',
    ]
    const kind = inferEvidenceKind(pages)
    const fields = makeReviewFields(pages, kind)

    expect(kind).toBe('access-review')
    expect(fields.every((field) => field.decision === 'pending')).toBe(true)
    expect(fields.some((field) => field.label.includes('Owner') && field.sourcePage === 1)).toBe(true)
    expect(fields.some((field) => field.label.includes('Access') && field.sourcePage === 1)).toBe(true)
    expect(fields.some((field) => field.value.toLowerCase().includes('automatic control mapping'))).toBe(false)
  })

  it('exports a review manifest without raw document bytes or extracted page text', () => {
    const review: LocalEvidenceReview = {
      fileName: 'control-evidence.pdf',
      mimeType: 'application/pdf',
      byteSize: 1200,
      sha256: 'a'.repeat(64),
      pageCount: 2,
      kind: 'control-evidence',
      extractedAt: '2026-08-20T00:00:00.000Z',
      pageText: ['sensitive source text', 'another source page'],
      fields: [
        { id: 'kind', label: 'Proposed evidence type', value: 'Control evidence', sourcePage: null, confidence: 'medium', decision: 'accepted' },
        { id: 'review', label: 'Human verification required', value: 'Reviewed', sourcePage: null, confidence: 'high', decision: 'accepted' },
      ],
    }

    const manifest = toLocalManifest(review)
    expect('pageText' in manifest).toBe(false)
    expect(manifest.rawDocumentIncluded).toBe(false)
    expect(manifest.extractedTextIncluded).toBe(false)
    expect(manifest.acceptedAt).not.toBeNull()
    expect(JSON.stringify(manifest)).not.toContain('sensitive source text')
  })

  it('does not mark a review accepted while any human decision remains pending', () => {
    const manifest = toLocalManifest({
      fileName: 'pending.pdf', mimeType: 'application/pdf', byteSize: 10, sha256: 'b'.repeat(64), pageCount: 1,
      kind: 'unknown', extractedAt: '2026-08-20T00:00:00.000Z', pageText: ['local only'],
      fields: [{ id: 'review', label: 'Human verification required', value: 'Review', sourcePage: null, confidence: 'high', decision: 'pending' }],
    })
    expect(manifest.acceptedAt).toBeNull()
  })
})
