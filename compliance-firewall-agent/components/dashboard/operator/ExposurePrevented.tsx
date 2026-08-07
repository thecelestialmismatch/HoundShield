'use client'

import Link from 'next/link'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import type { OverviewTelemetry } from '@/lib/dashboard/overview-telemetry'
import { fmt } from './panelPrimitives'

/**
 * What the gateway saved you — the before/after the founder asked for.
 *
 * The rest of the dashboard reports activity. This one panel answers "why does
 * this product exist", and it is the only place the local-only architecture is
 * stated as a fact about THIS tenant rather than marketing copy.
 *
 * HONESTY BOUNDARY, and it is the whole design of this panel:
 *
 *  - "Would have reached <provider>" is not a projection. Every counted prompt
 *    was addressed to that provider and was stopped by policy — the counterfactual
 *    is simply "the proxy was not in the path", which is exactly what the product
 *    replaces.
 *  - NO dollar figures. Not fine exposure, not breach cost, not "$X saved". Those
 *    numbers would be invented, this repo has caught invented metrics twice, and a
 *    buyer who checks one and finds it fabricated is gone. If a number is ever
 *    wanted here it has to come from the customer's own contract value, entered by
 *    them.
 *  - The zero-egress line is an architectural fact, not a measurement, and it is
 *    worded as one. It is true in every deployment mode: scanning happens in the
 *    proxy, on the customer's hardware, before any upstream call.
 */
export function ExposurePrevented({ tel }: { tel: OverviewTelemetry }) {
  const stopped = tel.totals.blocked
  const held = tel.totals.warning
  const inspected = tel.totals.events
  const top = tel.providers[0]?.provider ?? 'an external model'
  const kinds = tel.detections.slice(0, 3).map((d) => d.name)

  return (
    <div className="panel op-saved">
      <div className="ph">
        <h3><ShieldCheck aria-hidden /> What this stopped</h3>
        <span className="mono">last {tel.windowDays}d</span>
      </div>

      {!tel.connected ? (
        <p className="ph-sub">
          Once your gateway is running, this panel shows exactly what it kept inside your network.
          Nothing here is estimated — every figure is an event your own proxy recorded.
        </p>
      ) : (
        <div className="pad">
          <div className="op-saved-ba">
            <div className="op-saved-col is-before">
              <span className="op-saved-k">Without the gateway</span>
              <b className="op-saved-v">{fmt(stopped + held)}</b>
              <span className="op-saved-s">
                prompts carrying {kinds.length ? kinds.join(', ') : 'regulated data'} would have
                reached {top}
              </span>
            </div>

            <div className="op-saved-arrow" aria-hidden>→</div>

            <div className="op-saved-col is-after">
              <span className="op-saved-k">What actually left</span>
              <b className="op-saved-v is-good">0</b>
              <span className="op-saved-s">
                {fmt(stopped)} blocked outright, {fmt(held)} held for your review
              </span>
            </div>
          </div>

          <p className="op-saved-note">
            All {fmt(inspected)} prompts were inspected <b>on your own hardware</b>. Prompt content
            never left your network to be scanned — not to us, not to anyone. That is the difference
            between this and every cloud-routed DLP tool, and it is what an assessor is asking about
            when they ask where your data goes.
          </p>

          <Link href="/command-center/events?outcome=blocked" className="op-saved-cta">
            See every prompt it stopped <ArrowRight aria-hidden />
          </Link>
        </div>
      )}
    </div>
  )
}
