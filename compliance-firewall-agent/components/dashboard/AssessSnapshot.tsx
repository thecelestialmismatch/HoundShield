'use client'

import { useEffect, useState } from 'react'
import { ASSESSMENT_UPDATED_EVENT } from '@/lib/shieldready/events'
import type { SprsInput } from '@/lib/customer/status'

/**
 * SPRS snapshot panels on the console's CMMC Assessment tab (score ring +
 * "Fastest wins"), rendered directly above the real 110-control board.
 *
 * These used to be hardcoded (ring stuck at +78, four fixed rows badged
 * "AI-ranked") — a fake summary contradicting the real board it sat on top of.
 * Now:
 *  - `live` (signed-in viewer): both panels compute from the operator's OWN
 *    locally-stored assessment via lib/customer/client-status, and recompute
 *    the moment an answer lands (ASSESSMENT_UPDATED_EVENT from the store) —
 *    "answer the controls below to update it" is finally true.
 *  - public demo: keeps the lived-in sample numbers, labeled as sample.
 *
 * The heavy scoring modules (110-control dataset) load only in live mode, via
 * dynamic import — the demo console never pays for them.
 */

/** DoD SPRS self-assessment floor/ceiling (NIST 800-171 methodology). */
const SPRS_MIN = -203
const SPRS_MAX = 110

/** Sample gaps for the public demo org — labeled as sample in the UI. */
const SAMPLE_WINS = [
  { id: '3.8.3', title: 'Media sanitization', gain: 3, cls: 'gap' },
  { id: '3.13.11', title: 'FIPS crypto', gain: 3, cls: 'gap' },
  { id: '3.4.2', title: 'Config baselines', gain: 2, cls: 'part' },
  { id: '3.1.12', title: 'Remote access', gain: 1, cls: 'part' },
] as const
const SAMPLE_SCORE = 78

function ringBackground(score: number | null): string {
  const frac =
    score === null || !Number.isFinite(score)
      ? 0
      : Math.min(1, Math.max(0, (score - SPRS_MIN) / (SPRS_MAX - SPRS_MIN)))
  return `conic-gradient(var(--brand) ${(frac * 100).toFixed(0)}%, rgba(15,30,46,.08) 0)`
}

const fmtScore = (n: number) => `${n >= 0 ? '+' : ''}${n}`

export function AssessSnapshot({ live }: { live: boolean }) {
  // undefined = computing (live mode only); null = no answers yet.
  const [sprs, setSprs] = useState<SprsInput | null | undefined>(live ? undefined : null)

  useEffect(() => {
    if (!live) return
    let active = true
    const compute = async () => {
      try {
        const m = await import('@/lib/customer/client-status')
        if (active) setSprs(m.computeSprsInput())
      } catch {
        if (active) setSprs(null)
      }
    }
    void compute()
    const onChange = () => void compute()
    window.addEventListener(ASSESSMENT_UPDATED_EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      active = false
      window.removeEventListener(ASSESSMENT_UPDATED_EVENT, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [live])

  const score = live ? (sprs?.score ?? null) : SAMPLE_SCORE

  return (
    <div className="row r-2-1">
      <div className="panel">
        <div className="ph">
          <h3>SPRS score</h3>
          <span className="mono">{live ? 'your assessment' : 'sample'}</span>
        </div>
        <div className="sprs">
          <div className="ring" style={{ background: ringBackground(score) }}>
            <b>{score === null ? '—' : fmtScore(score)}</b>
            <small>of +110</small>
          </div>
          <div className="cap">
            {!live ? (
              <>DoD self-assessment range −203 to +110. Sample posture for the demo org — your own answers below compute a real score.</>
            ) : sprs === undefined ? (
              <>Reading your assessment…</>
            ) : sprs === null ? (
              <>No controls answered yet. Answer below — your score computes on this device and updates instantly.</>
            ) : (
              <>
                <b>{sprs.metCount} met</b> · {sprs.partialCount} partial · {sprs.unmetCount} open ·{' '}
                {sprs.completionPercent}% assessed. Answers save locally; this updates as you go.
              </>
            )}
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="ph">
          <h3>Fastest wins</h3>
          <span className="mono">{live ? 'impact-ranked' : 'sample · impact-ranked'}</span>
        </div>
        {!live ? (
          SAMPLE_WINS.map((w) => (
            <div className="crow" key={w.id}>
              <span>{w.id} — {w.title}</span>
              <span className={`st ${w.cls}`}>+{w.gain} SPRS</span>
            </div>
          ))
        ) : sprs?.topGaps?.length ? (
          sprs.topGaps.slice(0, 4).map((gap) => (
            <div className="crow" key={gap.controlId}>
              <span>{gap.controlId} — {gap.title}</span>
              <span className={`st ${gap.status === 'PARTIAL' ? 'part' : 'gap'}`}>
                +{Math.abs(gap.deduction)} SPRS
              </span>
            </div>
          ))
        ) : (
          <div className="crow">
            <span style={{ color: 'var(--mut2)' }}>
              {sprs === undefined
                ? 'Ranking your highest-impact fixes…'
                : sprs === null
                  ? 'Answer controls below to see your highest-impact fixes, ranked by SPRS points.'
                  : 'No open gaps — every assessed control is met. Export your evidence from Reports.'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
