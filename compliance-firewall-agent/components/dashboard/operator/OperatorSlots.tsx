'use client'

/**
 * The two Overview panels that are neither telemetry nor posture: the Brain AI
 * quick-ask card and the first-run activation checklist.
 *
 * They live here because there are now TWO shells that mount the Overview —
 * `LiveCommandCenter` (its own `hs-lcc` shell, in-page tabs) and
 * `OperatorDashboard` (inside the `(tools)` sidebar, real routes) — and these
 * two panels are the only pieces whose behaviour differs between them: one
 * navigates by setting a tab, the other by pushing a URL.
 *
 * Both take their destinations as callbacks rather than deciding for
 * themselves. That is the whole point: a copy-paste into the second shell would
 * have drifted the moment either was edited, and the drift would be invisible
 * because each shell is only ever rendered on its own route.
 */

import Image from 'next/image'
import { ArrowRight, Sparkles } from 'lucide-react'

/** Starter questions. Ordered by how often an operator actually needs them. */
export const BRAIN_QUICK: string[] = [
  'What changed in my SPRS score this week?',
  'Am I CMMC ready?',
  'Draft my incident summary',
  'What is a DFARS 7012 spill?',
]

/**
 * Brain AI quick-ask.
 *
 * The CUI warning in the body copy is MANDATORY and must not be trimmed for
 * space: Brain AI can route to a commercial cloud endpoint, which is a spillage
 * path, so the caveat travels with the entry point rather than living one click
 * away. See CLAUDE.md, "Brain AI restriction".
 */
export function BrainQuickAsk({ name, onAsk }: {
  name?: string | null
  /** Ask the analyst. The shell decides whether that opens a tab or a route. */
  onAsk: (question: string) => void
}) {
  return (
    <div className="panel">
      <div className="braincard">
        <Image className="brain-mark" src="/houndshield-logo.png" alt="HoundShield Brain AI" width={38} height={48} />
        <div className="bc-copy">
          <h3>
            <Sparkles style={{ width: 15, height: 15, verticalAlign: -2, display: 'inline', marginRight: 4 }} />
            {name ? `${name}, ask Brain AI` : 'Ask Brain AI'}
          </h3>
          <p>On-device CMMC analyst, grounded in your own assessment &amp; audit chain. No CUI — it can route to a commercial cloud endpoint.</p>
        </div>
        <div className="bchips">
          {BRAIN_QUICK.map((q) => (
            <button key={q} type="button" onClick={() => onAsk(q)}>{q}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function StepRow({ n, title, detail, cta, onClick, done }: {
  n: string; title: string; detail: string; cta: string; onClick: () => void; done?: boolean
}) {
  return (
    <div className={`steprow${done ? ' done' : ''}`}>
      <div className="step-n">{done ? '✓' : n}</div>
      <div className="step-body"><b>{title}</b><span>{detail}</span></div>
      <button type="button" className="btn btn-g btn-sm" onClick={onClick}>{cta} <ArrowRight /></button>
    </div>
  )
}

/**
 * The activation path to the thing the customer actually bought: a
 * C3PAO-ready PDF.
 *
 * `connected` is deliberately a real signal (does this operator's gateway have
 * any events?) rather than a constant. Ticking steps 1 and 2 for someone who has
 * never sent a prompt through the proxy would be a fabricated completion state
 * on the one surface whose job is to tell them what is left to do.
 */
export function FirstRunChecklist({ connected, onStep }: {
  connected: boolean
  onStep: (step: 'settings' | 'feed' | 'reports') => void
}) {
  return (
    <div className="panel">
      <div className="ph"><h3>Get to your first C3PAO-ready PDF</h3><span className="mono">3 steps</span></div>
      <div className="pad steps">
        <StepRow
          n="1" done={connected}
          title="Point your AI traffic at the proxy"
          detail="OpenAI-compatible endpoint — one URL change."
          onClick={() => onStep('settings')} cta="View proxy URL"
        />
        <StepRow
          n="2" done={connected}
          title="See your first live scan"
          detail="Every prompt inspected on your hardware in <10ms."
          onClick={() => onStep('feed')} cta="Open live feed"
        />
        <StepRow
          n="3"
          title="Generate a sample audit PDF"
          detail="SSP + POA&M + evidence pack, SHA-256 signed."
          onClick={() => onStep('reports')} cta="Generate PDF"
        />
      </div>
    </div>
  )
}
