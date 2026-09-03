'use client'

/**
 * Shared vocabulary for the operator dashboard panels: the palette, the number
 * formatter, and the universal empty state.
 *
 * Split out of `OperatorPanels.tsx` on 2026-08-07, which had reached 616 lines
 * against this repo's own 500-line component rule (CLAUDE.md, DESIGN.md). The
 * panels themselves are unchanged — every export still comes out of
 * `OperatorPanels.tsx`, which is now a barrel, so no import anywhere in the
 * codebase moved.
 *
 * Two rules run through every panel that consumes this module:
 *
 *  1. NO FALLBACK DATA. When a series is empty the panel renders an empty state
 *     that says why and what to do about it. It never substitutes a plausible
 *     shape. On a product whose deliverable is C3PAO audit evidence, a chart
 *     that looks like a measurement but isn't is the worst possible bug.
 *  2. Charts are hand-rolled SVG, matching the demo panels. Recharts is avoided
 *     deliberately — it crashes on SSR (see the Recharts rule in CLAUDE.md), and
 *     these panels render inside the server-rendered dashboard shell.
 *
 * Colour system is inherited from the demo panels so the two never disagree.
 * Identity is never colour-alone: every mark carries a direct label and a
 * native <title> tooltip.
 */

import { ArrowRight, PlugZap } from 'lucide-react'

export const STEEL = '#3A6EA5'
export const ORANGE = '#C96A28'
export const GREEN = '#0E9F6E'
export const VIOLET = '#7C5CB8'

export const RISK_COLOR: Record<string, string> = {
  CRITICAL: '#C93A3F', HIGH: '#C96A28', MEDIUM: '#B08205', LOW: '#3A6EA5', NONE: '#7C8AA0',
}

export const fmt = (n: number) => n.toLocaleString('en-US')

/**
 * The universal "you have no telemetry yet" state.
 *
 * Deliberately actionable rather than apologetic: a new customer has an empty
 * dashboard because the proxy is not connected, and the single most valuable
 * thing the panel can do is say so and point at the setting.
 */
export function NoTelemetry({ what, onSettings }: { what: string; onSettings?: () => void }) {
  return (
    <div className="op-empty">
      <PlugZap className="op-empty-ic" aria-hidden />
      <div className="op-empty-txt">
        <b>No {what} yet</b>
        <span>
          Point your AI traffic at the local proxy and this fills from your own
          gateway&apos;s audit log — computed on your hardware, never in our cloud.
        </span>
      </div>
      {onSettings && (
        <button type="button" className="btn btn-p btn-sm" onClick={onSettings}>
          View proxy URL <ArrowRight aria-hidden />
        </button>
      )}
    </div>
  )
}
