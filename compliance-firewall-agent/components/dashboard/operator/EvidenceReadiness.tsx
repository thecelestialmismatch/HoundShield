'use client'

import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import {
  Check, ChevronRight, Download, FileSearch, FileText, LockKeyhole,
  RefreshCw, ShieldCheck, Trash2, TriangleAlert, Upload, X,
} from 'lucide-react'
import {
  analyzeLocalEvidence,
  downloadLocalManifest,
  LOCAL_EVIDENCE_POLICY,
  type EvidenceField,
  type FieldDecision,
  type LocalEvidenceReview,
} from '@/lib/evidence/local-intake'

/**
 * Authenticated, browser-local evidence intake.
 *
 * This component intentionally imports no server action and makes no network
 * document-data request. Raw document bytes and page text are never handed to a route, storage
 * bucket, telemetry SDK, or model provider.
 */
export function EvidenceReadiness({ onOpenSettings }: { onOpenSettings: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const jobRef = useRef(0)
  const [review, setReview] = useState<LocalEvidenceReview | null>(null)
  const [processing, setProcessing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearReview = useCallback(() => {
    jobRef.current += 1
    setReview(null)
    setError(null)
    setProcessing(false)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const startReview = useCallback(async (file: File | undefined) => {
    if (!file) return
    const job = ++jobRef.current
    setError(null)
    setProcessing(true)
    setReview(null)
    try {
      const next = await analyzeLocalEvidence(file)
      if (job === jobRef.current) setReview(next)
    } catch (reason) {
      if (job === jobRef.current) setError(reason instanceof Error ? reason.message : 'Local document analysis could not be completed.')
    } finally {
      if (job === jobRef.current) setProcessing(false)
    }
  }, [])

  const onChoose = (event: ChangeEvent<HTMLInputElement>) => void startReview(event.target.files?.[0])
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    void startReview(event.dataTransfer.files?.[0])
  }

  const updateDecision = (id: string, decision: FieldDecision) => {
    setReview((current) => current
      ? { ...current, fields: current.fields.map((field) => field.id === id ? { ...field, decision } : field) }
      : current)
  }

  const accepted = review?.fields.filter((field) => field.decision === 'accepted').length ?? 0
  const pending = review?.fields.filter((field) => field.decision === 'pending').length ?? 0
  const rejected = review?.fields.filter((field) => field.decision === 'rejected').length ?? 0
  const allReviewed = Boolean(review && pending === 0)

  return (
    <div className="panel evidence-intake" data-testid="evidence-intake">
      <div className="ph evidence-intake-head">
        <div>
          <h3><FileSearch style={{ width: 16, height: 16, verticalAlign: -3, marginRight: 6 }} />Evidence intake &amp; verification</h3>
          <p className="mono" style={{ marginTop: 5 }}>Browser-local PDF review · human approval required · no document upload</p>
        </div>
        <span className="chip evidence-local-chip"><LockKeyhole aria-hidden /> Local-only</span>
      </div>

      <div className="pad evidence-proof" role="status">
        <LockKeyhole aria-hidden />
        <div>
          <strong>Nothing leaves this browser session.</strong>
          <span>Raw PDF bytes, extracted page text, and review decisions stay in this tab&apos;s memory. This panel has no upload route, cloud OCR fallback, document analytics call, or external AI/model call.</span>
        </div>
      </div>

      {!review && !processing && (
        <div className="pad">
          <div
            className={`evidence-drop${dragging ? ' is-dragging' : ''}`}
            onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <Upload aria-hidden />
            <strong>Drop a text-based PDF here</strong>
            <span>Access reviews, policies, system exports, control evidence, and questionnaires.</span>
            <span className="mono">PDF only · ≤ {LOCAL_EVIDENCE_POLICY.maxBytes / (1024 * 1024)} MB · ≤ {LOCAL_EVIDENCE_POLICY.maxPages} pages · local text extraction</span>
            <button type="button" className="btn btn-g btn-sm" onClick={() => inputRef.current?.click()}>
              <FileText aria-hidden /> Choose a local PDF
            </button>
            <input ref={inputRef} className="sr-only" type="file" accept="application/pdf,.pdf" onChange={onChoose} />
          </div>
        </div>
      )}

      {processing && (
        <div className="pad evidence-processing" role="status">
          <RefreshCw className="evidence-spin" aria-hidden />
          <div><strong>Analyzing on this device…</strong><span>Validating the PDF, extracting selectable text, creating a SHA-256 digest, and preparing review cues. No document data is uploaded.</span></div>
        </div>
      )}

      {error && (
        <div className="pad" role="alert">
          <div className="op-banner is-err"><TriangleAlert aria-hidden /> {error}</div>
          <div className="evidence-actions"><button type="button" className="btn btn-g btn-sm" onClick={clearReview}>Try another local PDF</button></div>
        </div>
      )}

      {review && (
        <>
          <div className="pad evidence-summary">
            <div className="evidence-file"><FileText aria-hidden /><div><strong>{review.fileName}</strong><span className="mono">{review.pageCount} page{review.pageCount === 1 ? '' : 's'} · {(review.byteSize / 1024).toFixed(1)} KB · {review.kind.replace(/-/g, ' ')}</span></div></div>
            <div className="evidence-digest"><span className="mono">SHA-256</span><code title={review.sha256}>{review.sha256.slice(0, 16)}…{review.sha256.slice(-12)}</code></div>
          </div>

          <div className="pad evidence-stage" aria-label="Local review progress">
            <EvidenceStep done label="1. Local parse" detail={`${review.pageCount} page${review.pageCount === 1 ? '' : 's'} read in this browser`} />
            <EvidenceStep done={allReviewed} label="2. Human verify" detail={allReviewed ? 'Every proposed field has a reviewer decision' : `${pending} decision${pending === 1 ? '' : 's'} still required`} />
            <EvidenceStep done={allReviewed && accepted > 0} label="3. Export review record" detail="Optional local manifest excludes the document and extracted text" />
          </div>

          <div className="pad evidence-review-head">
            <div><strong>Review queue</strong><span className="mono">{accepted} accepted · {pending} pending · {rejected} rejected · suggestions are not evidence until you approve them</span></div>
            <span className={`chip${allReviewed ? '' : ' warn'}`}>{allReviewed ? 'Review complete' : 'Decision required'}</span>
          </div>

          <div className="evidence-fields" aria-live="polite">
            {review.fields.map((field) => (
              <EvidenceFieldRow
                key={field.id}
                field={field}
                snippet={field.sourcePage ? review.pageText[field.sourcePage - 1] : ''}
                onDecision={updateDecision}
              />
            ))}
          </div>

          <div className="pad evidence-actions">
            <button type="button" className="btn btn-g btn-sm" onClick={() => downloadLocalManifest(review)}>
              <Download aria-hidden /> Download local review manifest
            </button>
            <button type="button" className="btn btn-g btn-sm" onClick={clearReview}>
              <Trash2 aria-hidden /> Clear from this session
            </button>
            <button type="button" className="btn btn-g btn-sm" onClick={onOpenSettings}>
              Privacy settings <ChevronRight aria-hidden />
            </button>
          </div>
          <div className="pad evidence-footnote">
            <ShieldCheck aria-hidden /> The downloaded manifest contains only review metadata, field decisions, and the source hash. It never includes the original PDF or extracted page text.
          </div>
        </>
      )}
    </div>
  )
}

function EvidenceStep({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return <div className={`evidence-step${done ? ' is-done' : ''}`}><span>{done ? <Check aria-hidden /> : <div className="evidence-step-dot" />}</span><div><strong>{label}</strong><small>{detail}</small></div></div>
}

function EvidenceFieldRow({ field, snippet, onDecision }: { field: EvidenceField; snippet: string; onDecision: (id: string, decision: FieldDecision) => void }) {
  return (
    <article className="evidence-field" data-decision={field.decision}>
      <div className="evidence-field-main">
        <div className="evidence-field-title"><strong>{field.label}</strong><span className={`chip evidence-confidence ${field.confidence}`}>{field.confidence} confidence</span></div>
        <p>{field.value}</p>
        {field.sourcePage && <span className="mono">Source: page {field.sourcePage}</span>}
        {snippet && <details><summary>Inspect local source excerpt</summary><p className="evidence-snippet">{snippet.slice(0, 500)}{snippet.length > 500 ? '…' : ''}</p></details>}
      </div>
      <div className="evidence-field-actions" aria-label={`Decision for ${field.label}`}>
        <button type="button" className={`btn btn-g btn-sm${field.decision === 'accepted' ? ' is-selected' : ''}`} onClick={() => onDecision(field.id, 'accepted')}><Check aria-hidden /> Accept</button>
        <button type="button" className={`btn btn-g btn-sm${field.decision === 'rejected' ? ' is-rejected' : ''}`} onClick={() => onDecision(field.id, 'rejected')}><X aria-hidden /> Reject</button>
      </div>
    </article>
  )
}
