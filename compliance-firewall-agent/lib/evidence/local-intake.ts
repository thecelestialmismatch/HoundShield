'use client'

/**
 * Browser-local Evidence Intake primitives.
 *
 * Privacy boundary: every function in this module runs in the browser against a
 * user-selected File. It contains no endpoint, persistence adapter, fetch call,
 * XHR transport, analytics call, or SDK integration. The raw file and extracted
 * text remain in memory until the tab is closed or the operator clears the review.
 */

export const LOCAL_EVIDENCE_POLICY = {
  transport: 'none' as const,
  persistence: 'memory-only' as const,
  maxBytes: 15 * 1024 * 1024,
  maxPages: 80,
  acceptedExtensions: ['.pdf'] as const,
}

export type EvidenceKind = 'access-review' | 'policy' | 'control-evidence' | 'system-export' | 'questionnaire' | 'unknown'
export type FieldDecision = 'pending' | 'accepted' | 'rejected'

export type EvidenceField = {
  id: string
  label: string
  value: string
  sourcePage: number | null
  confidence: 'high' | 'medium' | 'review'
  decision: FieldDecision
}

export type LocalEvidenceReview = {
  fileName: string
  mimeType: string
  byteSize: number
  sha256: string
  pageCount: number
  kind: EvidenceKind
  extractedAt: string
  fields: EvidenceField[]
  pageText: string[]
}

export type LocalEvidenceManifest = Omit<LocalEvidenceReview, 'pageText'> & {
  policy: typeof LOCAL_EVIDENCE_POLICY
  acceptedAt: string | null
  rawDocumentIncluded: false
  extractedTextIncluded: false
}

const KIND_LABELS: Record<EvidenceKind, string> = {
  'access-review': 'Access review',
  policy: 'Policy or procedure',
  'control-evidence': 'Control evidence',
  'system-export': 'System export',
  questionnaire: 'Security questionnaire',
  unknown: 'Needs classification',
}

function hasPdfExtension(file: File) {
  return file.name.toLowerCase().endsWith('.pdf')
}

export function validateEvidenceFile(file: File): string[] {
  const errors: string[] = []
  if (!hasPdfExtension(file)) errors.push('Choose a PDF file. Other formats are intentionally blocked in the local-first launch.')
  if (file.size === 0) errors.push('The selected file is empty.')
  if (file.size > LOCAL_EVIDENCE_POLICY.maxBytes) errors.push(`The selected file exceeds the ${LOCAL_EVIDENCE_POLICY.maxBytes / (1024 * 1024)} MB local-processing limit.`)
  // Browsers often leave File.type blank for files dragged from a disk. Extension
  // validation is the compatibility check; the PDF parser is the actual verifier.
  if (file.type && file.type !== 'application/pdf') errors.push('The file MIME type is not application/pdf.')
  return errors
}

export async function sha256Hex(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function pageTextFromItems(items: unknown[]): string {
  return items
    .map((item) => {
      if (typeof item === 'object' && item !== null && 'str' in item) {
        const value = (item as { str?: unknown }).str
        return typeof value === 'string' ? value : ''
      }
      return ''
    })
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Extract selectable PDF text in the browser only. OCR is intentionally absent:
 * turning scanned pages into text requires a separate customer-controlled local
 * worker, not an invisible cloud fallback. */
export async function extractLocalPdfText(file: File): Promise<{ pageCount: number; pageText: string[] }> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  // `isEvalSupported: false` was dropped with pdfjs-dist v6: the eval-based
  // rendering path it disabled is gone from the build, so there is nothing left
  // to opt out of and the option is no longer a valid parameter.
  const loadingTask = pdfjs.getDocument({
    data: bytes,
    useSystemFonts: true,
    stopAtErrors: true,
  })
  const document = await loadingTask.promise
  try {
    if (document.numPages > LOCAL_EVIDENCE_POLICY.maxPages) {
      throw new Error(`This PDF has ${document.numPages} pages. The local-processing limit is ${LOCAL_EVIDENCE_POLICY.maxPages} pages.`)
    }
    const pageText: string[] = []
    for (let pageNo = 1; pageNo <= document.numPages; pageNo += 1) {
      const page = await document.getPage(pageNo)
      const content = await page.getTextContent()
      pageText.push(pageTextFromItems(content.items as unknown[]))
      page.cleanup()
    }
    if (!pageText.some(Boolean)) {
      throw new Error('No selectable text was found. This browser-local launch does not silently send scanned pages to cloud OCR; use a text PDF or add a customer-operated OCR worker.')
    }
    return { pageCount: document.numPages, pageText }
  } finally {
    // v6 moved teardown to the loading task; PDFDocumentProxy no longer has destroy().
    await loadingTask.destroy()
  }
}

export function inferEvidenceKind(pageText: string[]): EvidenceKind {
  const source = pageText.join(' ').toLowerCase()
  if (/access review|user access|privileged access|account owner|user list/.test(source)) return 'access-review'
  if (/policy|procedure|purpose|scope|revision|approved by/.test(source)) return 'policy'
  if (/questionnaire|security question|vendor response|yes\/no/.test(source)) return 'questionnaire'
  if (/control|evidence|implementation|configuration|audit log/.test(source)) return 'control-evidence'
  if (/export|system report|generated on|reporting period/.test(source)) return 'system-export'
  return 'unknown'
}

function firstSourcePage(pageText: string[], pattern: RegExp): number | null {
  const index = pageText.findIndex((page) => pattern.test(page.toLowerCase()))
  return index < 0 ? null : index + 1
}

/** Deterministic review cues—not a compliance judgment and never an automatic
 * control mapping. Values deliberately avoid copying raw document content into a
 * second system of record. */
export function makeReviewFields(pageText: string[], kind: EvidenceKind): EvidenceField[] {
  const source = pageText.join(' ').toLowerCase()
  const pageFor = (pattern: RegExp) => firstSourcePage(pageText, pattern)
  const fields: EvidenceField[] = [
    { id: 'kind', label: 'Proposed evidence type', value: KIND_LABELS[kind], sourcePage: null, confidence: kind === 'unknown' ? 'review' : 'medium', decision: 'pending' },
    { id: 'review', label: 'Human verification required', value: 'Review every proposed field before using this document as evidence.', sourcePage: null, confidence: 'high', decision: 'pending' },
  ]
  if (/date|period|as of|effective/.test(source)) fields.push({ id: 'period', label: 'Date or evidence period appears present', value: 'Confirm the document date or reporting period.', sourcePage: pageFor(/date|period|as of|effective/), confidence: 'review', decision: 'pending' })
  if (/owner|approver|manager|reviewer/.test(source)) fields.push({ id: 'owner', label: 'Owner or reviewer appears present', value: 'Confirm the accountable owner or reviewer.', sourcePage: pageFor(/owner|approver|manager|reviewer/), confidence: 'review', decision: 'pending' })
  if (/access|role|permission|privilege/.test(source)) fields.push({ id: 'access', label: 'Access or privilege evidence appears present', value: 'Verify identities, roles, and review outcomes in the source document.', sourcePage: pageFor(/access|role|permission|privilege/), confidence: 'review', decision: 'pending' })
  if (/approved|signature|sign-off|attest/.test(source)) fields.push({ id: 'approval', label: 'Approval or attestation appears present', value: 'Verify the sign-off, authority, and date before acceptance.', sourcePage: pageFor(/approved|signature|sign-off|attest/), confidence: 'review', decision: 'pending' })
  return fields
}

export async function analyzeLocalEvidence(file: File): Promise<LocalEvidenceReview> {
  const errors = validateEvidenceFile(file)
  if (errors.length) throw new Error(errors.join(' '))
  const [{ pageCount, pageText }, sha256] = await Promise.all([extractLocalPdfText(file), sha256Hex(file)])
  const kind = inferEvidenceKind(pageText)
  return {
    fileName: file.name,
    mimeType: file.type || 'application/pdf',
    byteSize: file.size,
    sha256,
    pageCount,
    kind,
    extractedAt: new Date().toISOString(),
    fields: makeReviewFields(pageText, kind),
    pageText,
  }
}

export function toLocalManifest(review: LocalEvidenceReview): LocalEvidenceManifest {
  const accepted = review.fields.length > 0 && review.fields.every((field) => field.decision === 'accepted')
  return {
    fileName: review.fileName,
    mimeType: review.mimeType,
    byteSize: review.byteSize,
    sha256: review.sha256,
    pageCount: review.pageCount,
    kind: review.kind,
    extractedAt: review.extractedAt,
    fields: review.fields,
    policy: LOCAL_EVIDENCE_POLICY,
    acceptedAt: accepted ? new Date().toISOString() : null,
    rawDocumentIncluded: false,
    extractedTextIncluded: false,
  }
}

export function downloadLocalManifest(review: LocalEvidenceReview) {
  const manifest = toLocalManifest(review)
  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${review.fileName.replace(/\.pdf$/i, '') || 'evidence'}-local-review-manifest.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
