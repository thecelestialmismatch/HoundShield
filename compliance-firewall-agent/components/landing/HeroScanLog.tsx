'use client'

import { useEffect, useState } from 'react'

/**
 * Hero "terminal" card — replicates the brand-demo signature:
 *   1. the one-line proxy URL swap (api.openai.com -> proxy.houndshield.com)
 *   2. a live block/pass scan log
 *
 * SSR-safe: initial 3 rows are deterministic (server + first client render
 * match -> no hydration mismatch). The cycling starts only after mount in
 * useEffect, and bails to a static list under prefers-reduced-motion.
 * Uses existing globals.css primitives (--hs-* tokens, fadeSlideIn keyframe).
 */

type Row = { verdict: 'BLOCKED' | 'PASSED'; label: string; ms: string; kind: 'block' | 'pass' }

// Demo Direction-A scan-log rows — exact label · ms format, UPPERCASE verdicts.
const ROWS: readonly Row[] = [
  { verdict: 'BLOCKED', label: 'CUI · CAGE 1ABC2', ms: '7ms',  kind: 'block' },
  { verdict: 'PASSED',  label: 'clean',            ms: '11ms', kind: 'pass'  },
  { verdict: 'BLOCKED', label: 'PHI · MRN',        ms: '6ms',  kind: 'block' },
  { verdict: 'BLOCKED', label: 'secret · sk-…',    ms: '5ms',  kind: 'block' },
  { verdict: 'PASSED',  label: 'clean',            ms: '13ms', kind: 'pass'  },
]

const VISIBLE = 5
// First render shows the full demo set (deterministic, SSR-safe).
const INITIAL = ROWS.slice(0, VISIBLE)

export function HeroScanLog() {
  const [rows, setRows] = useState<readonly Row[]>(INITIAL)

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRows(ROWS.slice(0, VISIBLE))
      return
    }
    let i = INITIAL.length
    const id = setInterval(() => {
      setRows((prev) => [...prev, ROWS[i++ % ROWS.length]].slice(-VISIBLE))
    }, 2200)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-[var(--hs-border)] bg-[var(--hs-navy)] shadow-[var(--shadow-xl)]"
      style={{ fontFamily: 'var(--font-mono)' }}
      aria-label="HoundShield live scan demonstration"
    >
      {/* browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        <div className="flex-1 mx-3 flex items-center gap-2 px-2.5 py-1 rounded bg-white/[0.04] border border-white/[0.06]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--hs-steel)]" />
          <span className="text-[10px] text-[var(--hs-steel-light)]/70">proxy-config.env</span>
        </div>
      </div>

      {/* the one-line swap */}
      <div className="px-5 pt-5 text-[12.5px] leading-7 text-[var(--hs-steel-light)]">
        <div className="text-[var(--hs-ink-tertiary)]"># Before — sent straight to OpenAI</div>
        <div className="break-all">OPENAI_BASE_URL=<span className="text-[var(--hs-sky)]">https://api.openai.com/v1</span></div>
        <div className="mt-3 text-[var(--hs-ink-tertiary)]"># After — routed through HoundShield</div>
        <div className="break-all">OPENAI_BASE_URL=<span className="text-[var(--hs-sky)]">https://proxy.houndshield.com/v1</span></div>
      </div>

      {/* live scan log */}
      <div className="mt-4 mx-5 mb-5 pt-4 border-t border-white/10 space-y-1.5 min-h-[180px]">
        {rows.map((r, idx) => (
          <div
            key={`${r.label}-${idx}`}
            className="grid grid-cols-[78px_1fr_auto] items-center gap-3"
            style={{ animation: 'fadeSlideIn 0.4s ease' }}
          >
            <span
              className={`justify-self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                r.kind === 'block' ? 'bg-[var(--hs-danger)]/20 text-[#FF9090]' : 'bg-[var(--hs-success)]/20 text-[#86E0A6]'
              }`}
            >
              {r.verdict}
            </span>
            <span className="text-[12px] text-[var(--hs-steel-light)]/90 truncate">{r.label}</span>
            <span className="text-[11px] text-[var(--hs-ink-tertiary)] tabular-nums">{r.ms}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
