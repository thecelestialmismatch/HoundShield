'use client'

import Link from 'next/link'
import type { OverviewTelemetry, RecentEvent } from '@/lib/dashboard/overview-telemetry'

/**
 * The gateway as a terminal — what is happening right now, in the register an
 * engineer already reads.
 *
 * Founder direction 2026-08-07: "a nice thing stuff like what's going on in the
 * terminal". The other panels aggregate; this one narrates. It is the surface
 * that makes the proxy feel alive rather than like a report.
 *
 * It renders `tel.recent` — the same rows the Live Events table uses, so there
 * is one source and no chance of the two disagreeing. Nothing is synthesised:
 * with no events it prints the connect instruction instead of a fake stream,
 * which is the whole point of a console that claims to show your traffic.
 *
 * Prompt CONTENT never appears here, and cannot: `TelemetryEventRow` does not
 * select it. Every line is metadata — timestamp, provider, verdict, what the
 * engines matched, scan time. That is the same boundary the product sells.
 *
 * ponytail: renders the last page of events on each poll rather than holding an
 * open stream. The dashboard already refreshes telemetry on an interval, so a
 * websocket would be a second transport for data that is arriving anyway.
 * Upgrade path if "live" ever has to mean sub-second: the proxy already emits
 * webhooks, so SSE off that is the cheap next step.
 */

const VERB: Record<string, { word: string; cls: string }> = {
  blocked: { word: 'BLOCK', cls: 'is-block' },
  warning: { word: 'HOLD ', cls: 'is-hold' },
  passed: { word: 'PASS ', cls: 'is-pass' },
}

function ts(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? '--:--:--'
    : d.toISOString().slice(11, 19)
}

export function GatewayTerminal({ tel, recent }: { tel: OverviewTelemetry; recent: RecentEvent[] }) {
  const lines = recent.slice(0, 14)

  return (
    <div className="panel op-term-panel">
      <div className="ph">
        <h3>Gateway console</h3>
        <span className="mono">
          {tel.connected ? `${tel.totals.events} inspected · ${tel.totals.blocked} stopped` : 'awaiting first event'}
        </span>
      </div>

      <div className="op-term" role="log" aria-label="Gateway activity">
        <div className="op-term-bar" aria-hidden>
          <i className="d r" /><i className="d y" /><i className="d g" />
          <span>houndshield-proxy — local</span>
        </div>

        <pre className="op-term-body">
{tel.connected ? (
  <>
    <span className="op-term-l is-dim">$ houndshield tail --local --no-content</span>
    {lines.map((e) => (
      <Link key={e.ref} href={`/command-center/events?ref=${encodeURIComponent(e.ref)}`} className={`op-term-l ${VERB[e.outcome]?.cls ?? ''}`}>
        <span className="t">{ts(e.createdAt)}</span>
        <span className="v">{VERB[e.outcome]?.word ?? '     '}</span>
        <span className="p">{e.provider}</span>
        <span className="d">{e.detected || '—'}</span>
        <span className="m">{e.scanMs == null ? '' : `${e.scanMs}ms`}</span>
      </Link>
    ))}
    <span className="op-term-l is-dim">
      {'  '}↑ metadata only — prompt text never leaves your network, so it is not here to print
    </span>
  </>
) : (
  <>
    <span className="op-term-l is-dim">$ houndshield tail --local</span>
    <span className="op-term-l is-warn">  waiting for the first event…</span>
    <span className="op-term-l is-dim">  point your AI client at the local proxy and this fills from your own traffic</span>
  </>
)}
        </pre>
      </div>
    </div>
  )
}
