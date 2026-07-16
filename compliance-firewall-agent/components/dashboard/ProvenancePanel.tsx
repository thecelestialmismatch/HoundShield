'use client'

/**
 * ProvenancePanel — the "where does this number come from?" dialog for the
 * /console command center, plus the SourceChip affordance that opens it.
 *
 * Honesty contract (extends #205): every figure on the dashboard is clickable
 * and answers, in plain language, what it is, the exact origin of the value on
 * screen, how it refreshes, and what has to happen before it becomes the
 * operator's own data. Signed-in viewers get the live variants (their account
 * / their device) via resolveProvenance.
 *
 * A SourceChip rendered WITHOUT a handler degrades to the plain label span —
 * never a button that does nothing (the fake-affordance anti-pattern,
 * tasks/lessons.md 2026-07-12).
 */
import { useEffect, useRef } from 'react'
import { Database, X, ArrowRight } from 'lucide-react'
import {
  resolveProvenance, KIND_META, type ProvenanceId,
} from './dataProvenance'

export function SourceChip({
  id, onSource, className, children,
}: {
  id: ProvenanceId
  onSource?: (id: ProvenanceId) => void
  className?: string
  children: React.ReactNode
}) {
  if (!onSource) return <span className={className}>{children}</span>
  return (
    <button
      type="button"
      className={`${className ? `${className} ` : ''}src-chip`}
      aria-haspopup="dialog"
      title="See where this data comes from"
      onClick={() => onSource(id)}
    >
      {children}
    </button>
  )
}

export function ProvenancePanel({
  id, live, onClose, onOpenSettings,
}: {
  id: ProvenanceId | null
  live: boolean
  onClose: () => void
  onOpenSettings?: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const returnRef = useRef<HTMLElement | null>(null)

  // Focus management: remember the opener, focus the dialog's close button,
  // hand focus back on dismiss. Escape closes from anywhere.
  useEffect(() => {
    if (!id) return
    returnRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      returnRef.current?.focus()
    }
  }, [id, onClose])

  if (!id) return null
  const p = resolveProvenance(id, live)
  const meta = KIND_META[p.kind]

  return (
    <div className="prov-overlay" onClick={onClose}>
      <div
        className="prov-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prov-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="prov-head">
          <Database className="prov-ic" aria-hidden />
          <div className="prov-head-txt">
            <h2 id="prov-title">{p.metric}</h2>
            <span className={`prov-kind k-${p.kind}`}>{meta.label}</span>
          </div>
          <button ref={closeRef} type="button" className="prov-close" aria-label="Close data source details" onClick={onClose}>
            <X aria-hidden />
          </button>
        </div>

        <p className="prov-blurb">{meta.blurb}</p>

        <div className="prov-rows">
          <div className="prov-row">
            <h3>What this is</h3>
            <p>{p.what}</p>
          </div>
          <div className="prov-row">
            <h3>Where it comes from</h3>
            <p>{p.source}</p>
          </div>
          <div className="prov-row">
            <h3>How it updates</h3>
            <p>{p.updates}</p>
          </div>
          {p.liveWhen && (
            <div className="prov-row prov-live">
              <h3>How it becomes your data</h3>
              <p>{p.liveWhen}</p>
              {onOpenSettings && (
                <button
                  type="button"
                  className="btn btn-p btn-sm"
                  onClick={() => { onOpenSettings(); onClose() }}
                >
                  Open Settings · Proxy URL <ArrowRight aria-hidden />
                </button>
              )}
            </div>
          )}
        </div>

        <p className="prov-foot">
          Every simulated number on this console is labeled — real customer
          surfaces never show fabricated data as their own.
        </p>
      </div>
    </div>
  )
}
