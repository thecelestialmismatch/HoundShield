'use client'

import Link from 'next/link'
import type { OverviewTelemetry } from '@/lib/dashboard/overview-telemetry'
import { STEEL, ORANGE, VIOLET, fmt, NoTelemetry } from './panelPrimitives'

/**
 * Who — or what — is sending prompts.
 *
 * Every other panel on this dashboard answers "what was in the prompt". This
 * one answers "was a person even involved", and it is the question that gets
 * harder every month.
 *
 * An engineer sends maybe twenty prompts a day. An autonomous coding agent
 * sends hundreds per task, unattended, and keeps going overnight. For a
 * regulated customer that is not just volume: NIST 800-171 3.1.1/3.1.2 limit
 * access to authorized users and permitted transactions, and AU.2.041 requires
 * actions to be traceable to individual users. A stream of agent calls has no
 * individual attached to any one of them.
 *
 * The data comes from headers the client already sends, recorded by the gateway
 * (lib/gateway/actor.ts) — descriptive evidence, never identity. Events written
 * before that shipped carry no actor and are excluded rather than guessed at,
 * which is why the totals here can be lower than the KPI row. That gap is
 * disclosed below instead of being papered over.
 */

const KIND_COLOR: Record<string, string> = {
  agent: ORANGE,
  sdk: VIOLET,
  browser: STEEL,
  unknown: '#7C8AA0',
}

const KIND_NOTE: Record<string, string> = {
  agent: 'autonomous — no human reviews each prompt',
  sdk: 'script or backend job',
  browser: 'a person, at a keyboard',
  unknown: 'client did not identify itself',
}

export function AgentOversight({ tel }: { tel: OverviewTelemetry }) {
  const actors = tel.actors ?? []
  const attributed = actors.reduce((n, a) => n + a.count, 0)
  const autonomous = tel.autonomousEvents ?? 0
  const max = Math.max(1, ...actors.map((a) => a.count))
  // Events with no actor recorded at all. Stated, never hidden.
  const unattributed = Math.max(0, tel.totals.events - attributed)
  const autonomousPct = attributed ? Math.round((autonomous / attributed) * 1000) / 10 : 0

  return (
    <div className="panel">
      <div className="ph">
        <h3>Who sent it</h3>
        <span className="mono">people vs agents, {tel.windowDays}d</span>
      </div>
      <p className="ph-sub">
        A person sends ~20 prompts a day. An agent sends hundreds, unattended. NIST 800-171 AU.2.041
        wants every action traceable to an individual — this is the panel that shows where that
        breaks down.
      </p>

      {!tel.connected ? (
        <NoTelemetry what="a sender breakdown" />
      ) : attributed === 0 ? (
        <div className="pad">
          <p className="op-act-none">
            No sender recorded yet in this window. The gateway began attributing traffic on
            2026-08-07 — events older than that were not captured, and are not guessed at here.
          </p>
          <Link href="/docs" className="op-gauge-cta">
            How attribution works →
          </Link>
        </div>
      ) : (
        <div className="pad">
          <div className="op-rate-hd">
            <b>{fmt(autonomous)}</b>
            <span>
              {autonomousPct}% of attributed prompts were sent by an agent, not a person
            </span>
          </div>

          <ul className="op-act-list">
            {actors.map((a) => (
              <li key={`${a.kind}:${a.name}`}>
                <Link
                  href={`/command-center/events?actor=${encodeURIComponent(a.name)}`}
                  className="op-act-row"
                  title={`${a.name} — ${fmt(a.count)} prompts, ${fmt(a.blocked)} blocked (${KIND_NOTE[a.kind]})`}
                >
                  <span className="op-act-name">
                    <i className="op-act-dot" style={{ background: KIND_COLOR[a.kind] }} />
                    {a.name}
                    {a.kind === 'agent' && <em className="op-act-tag">agent</em>}
                  </span>
                  <span className="op-act-bar">
                    <i style={{ width: `${(a.count / max) * 100}%`, background: KIND_COLOR[a.kind] }} />
                  </span>
                  <span className="op-act-n mono">
                    {fmt(a.count)}
                    {a.blocked > 0 && <b> · {fmt(a.blocked)} blocked</b>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {unattributed > 0 && (
            <p className="op-act-none">
              {fmt(unattributed)} event{unattributed === 1 ? '' : 's'} in this window carry no sender
              — recorded before attribution shipped. Counted in your totals, excluded here rather
              than assigned to a bucket we cannot evidence.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
