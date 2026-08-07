'use client'

import Link from 'next/link'
import { UPCOMING, headlineUpcoming } from '@/lib/product/upcoming'

/**
 * "What's coming" — the retention panel.
 *
 * A customer who can see the next thing being built has a reason to still be
 * here for it. This is the cheapest retention surface in the product and it did
 * not exist: the roadmap lived on a marketing page nobody signed in reads.
 *
 * Two rules keep it from becoming a liability:
 *
 *  1. NO DATES. Every item carries a loose window phrase, never a month or a
 *     quarter — see lib/product/upcoming.ts. A roadmap date is a promise a
 *     small team cannot keep, and missing one costs more trust than the
 *     announcement ever bought.
 *  2. IT IS LABELLED AS UNBUILT, clearly, at the top. Everything else on this
 *     dashboard is a measurement of the customer's own traffic. A preview
 *     sitting among real panels without a label would read as a feature they
 *     already have and cannot find — which generates support mail, not loyalty.
 *
 * The before/after pair is the "brief demo": two lines, what it looks like now
 * against what it will look like. Enough to make it concrete, short enough that
 * nobody has to decide whether to read it.
 */
export function ComingSoon() {
  const lead = headlineUpcoming()
  if (!lead) return null

  const rest = UPCOMING.filter((f) => f.id !== lead.id)

  return (
    <div className="panel">
      <div className="ph">
        <h3>Coming to your gateway</h3>
        <span className="mono">in build now</span>
      </div>
      <p className="ph-sub">
        Not built yet — a preview of what lands next, so you know where this is going. Everything
        else on this page is your own measured traffic.
      </p>

      <div className="pad">
        <div className="op-soon-lead">
          <div className="op-soon-hd">
            <b>{lead.title}</b>
            <span className="op-soon-when">{lead.window}</span>
          </div>
          <p className="op-soon-blurb">{lead.blurb}</p>

          {/* The brief demo. Two lines, deliberately. */}
          <div className="op-soon-demo">
            <div className="op-soon-row is-before">
              <span className="op-soon-tag">today</span>
              <code>{lead.demo.before}</code>
            </div>
            <div className="op-soon-row is-after">
              <span className="op-soon-tag">next</span>
              <code>{lead.demo.after}</code>
            </div>
          </div>

          <p className="op-soon-why">{lead.why}</p>
        </div>

        {rest.length > 0 && (
          <ul className="op-soon-list">
            {rest.map((f) => (
              <li key={f.id}>
                <b>{f.title}</b>
                <span>{f.blurb}</span>
                <em>{f.window}</em>
              </li>
            ))}
          </ul>
        )}

        <Link href="/changelog" className="op-gauge-cta">
          Full changelog and what&apos;s next →
        </Link>
      </div>
    </div>
  )
}
