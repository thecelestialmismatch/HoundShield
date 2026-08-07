'use client'

import Link from 'next/link'
import type { OverviewTelemetry } from '@/lib/dashboard/overview-telemetry'
import type { SprsPosture } from '@/lib/dashboard/sprs-posture'

/**
 * Every area of the product, its live number, and the way in.
 *
 * Founder direction 2026-08-07: the dashboard should "show all the details …
 * and if they need detail information they can go to that particular section of
 * that data". The panels above answer "what is happening"; this answers "where
 * do I go next", which nothing on the page did before — the only outbound links
 * were the four in QuickActions.
 *
 * HONESTY RULES, same as every other panel here:
 *
 *  - A row's value comes from telemetry the operator's own gateway produced, or
 *    from their own on-device assessment. There are no constants.
 *  - When a source has nothing yet the row still renders — with a muted dash and
 *    the reason — because hiding the destination would hide the feature. What it
 *    never does is show a zero styled as if it were a real reading.
 *  - The status dot is derived from the number beside it, never set by hand.
 *
 * Hrefs are duplicated from `_shell/nav.ts` rather than imported: that module is
 * a client component's data source inside the (tools) route group, and
 * `operator-dashboard-honesty.test.ts` already walks every href in this repo and
 * fails on one that has no page, so a rotted link here cannot ship.
 */

type Tone = 'ok' | 'warn' | 'act' | 'idle'

const DOT: Record<Tone, string> = {
  ok: 'var(--ok)',
  warn: '#d4a250',
  act: 'var(--bad)',
  idle: 'var(--mut2)',
}

type Row = {
  href: string
  label: string
  hint: string
  /** null = nothing recorded yet; the row shows a dash, not a zero. */
  value: string | null
  tone: Tone
}

function group(title: string, rows: Row[]) {
  return { title, rows }
}

export function SectionIndex({
  tel,
  posture,
  quarantine,
}: {
  tel: OverviewTelemetry
  posture: SprsPosture
  /** Live count from the shell's quarantine read; null while loading or on error. */
  quarantine: number | null
}) {
  const events = tel.totals?.events ?? 0
  const blocked = tel.totals?.blocked ?? 0
  const warned = tel.totals?.warning ?? 0
  const seen = events > 0
  const providers = tel.providers?.length ?? 0
  // `assessed` is the type's own flag: until at least one control is answered
  // every axis is 0 by definition, which is honest but meaningless to show as a
  // reading. Rows fall back to a dash rather than a zero.
  const assessed = posture?.assessed ?? false
  const met = posture?.metCount ?? 0
  const total = posture?.totalControls ?? 110
  const gaps = assessed ? posture.unmetCount + posture.partialCount : null

  const groups = [
    group('Firewall', [
      {
        href: '/command-center/realtime', label: 'Real-Time Feed',
        hint: seen ? 'Gateway reporting' : 'No events yet — connect the proxy',
        value: seen ? events.toLocaleString('en-US') : null, tone: seen ? 'ok' : 'idle',
      },
      {
        href: '/command-center/timeline', label: 'Threat Timeline',
        hint: seen ? `${blocked} blocked · ${warned} held` : 'Nothing to plot yet',
        value: seen ? String(blocked) : null, tone: blocked > 0 ? 'warn' : seen ? 'ok' : 'idle',
      },
      {
        href: '/command-center/scanner', label: 'Live Scanner',
        hint: tel.scanP50Ms != null ? 'Median, on your hardware' : 'No timings recorded yet',
        value: tel.scanP50Ms != null ? `${tel.scanP50Ms}ms` : null,
        tone: tel.scanP50Ms != null ? 'ok' : 'idle',
      },
      {
        href: '/command-center/events', label: 'Audit Log',
        hint: seen ? 'SHA-256 hash-chained' : 'Empty until the gateway runs',
        value: seen ? events.toLocaleString('en-US') : null, tone: seen ? 'ok' : 'idle',
      },
      {
        href: '/command-center/rules', label: 'Firewall Rules',
        hint: 'CUI · PHI · PII · IP · ITAR', value: '16', tone: 'ok',
      },
      {
        href: '/command-center/security', label: 'Security Dashboard',
        hint: providers ? 'Providers seen in this window' : 'No provider traffic yet',
        value: providers ? String(providers) : null, tone: providers ? 'ok' : 'idle',
      },
    ]),

    group('CMMC Shield', [
      {
        href: '/command-center/shield', label: 'SPRS Dashboard',
        hint: assessed ? `${met} of ${total} controls met` : 'Answer the assessment to score',
        value: assessed ? String(posture.score) : null, tone: assessed ? 'warn' : 'idle',
      },
      {
        href: '/command-center/shield/assessment', label: 'Assessment',
        hint: assessed ? `${Math.round(posture.completionPercent)}% complete` : 'Not started',
        value: assessed ? `${met}/${total}` : null, tone: assessed ? 'warn' : 'idle',
      },
      {
        href: '/command-center/shield/gaps', label: 'Gap Analysis',
        hint: gaps != null ? 'Controls not yet met' : 'Assess first to find gaps',
        value: gaps != null ? String(gaps) : null, tone: gaps ? 'act' : 'idle',
      },
      {
        href: '/command-center/shield/coverage', label: 'Coverage Map',
        hint: 'NIST 800-171 control families', value: assessed ? '14' : null,
        tone: assessed ? 'ok' : 'idle',
      },
      {
        href: '/command-center/shield/reports', label: 'Reports',
        hint: 'Generate a C3PAO-ready PDF', value: null, tone: 'idle',
      },
      {
        href: '/command-center/audit-export', label: 'Export Audit Log',
        hint: seen ? 'Signed evidence export' : 'Nothing to export yet',
        value: null, tone: seen ? 'ok' : 'idle',
      },
    ]),

    group('Response', [
      {
        href: '/command-center/quarantine', label: 'Quarantine',
        // Deliberately NOT the same number as the "Held for review" KPI above.
        // That tile counts events the gateway held in the selected window; this
        // is the live review queue, which shrinks as an operator works it. Two
        // sources, two meanings — so the wording has to say which is which, or
        // the pair reads as the dashboard contradicting itself.
        hint: quarantine === null
          ? 'Review queue'
          : quarantine > 0 ? 'In the review queue now' : 'Review queue empty',
        value: quarantine === null ? null : String(quarantine),
        tone: quarantine ? 'act' : quarantine === 0 ? 'ok' : 'idle',
      },
      {
        href: '/command-center/chat', label: 'Compliance AI',
        hint: 'Ask about your own posture', value: null, tone: 'idle',
      },
      {
        href: '/command-center/tasks', label: 'Remediation Tasks',
        hint: 'Work the gaps down', value: null, tone: 'idle',
      },
      {
        href: '/command-center/plan', label: 'Plan & Unlocks',
        hint: 'What your tier includes', value: null, tone: 'idle',
      },
    ]),
  ]

  return (
    <div className="panel">
      <div className="ph">
        <h3>Everything else</h3>
        <span className="mono">{groups.reduce((n, g) => n + g.rows.length, 0)} destinations</span>
      </div>
      <p className="ph-sub">
        Every part of the product, the number it is reporting right now, and the way in. A dash
        means that source has nothing recorded yet — never a zero dressed up as a reading.
      </p>

      {groups.map((g) => (
        <div key={g.title}>
          <div className="op-ix-grp">{g.title}</div>
          <div className="op-index">
            {g.rows.map((r) => (
              <Link key={r.href} href={r.href} className="op-ix">
                <span className="op-ix-dot" style={{ background: DOT[r.tone] }} aria-hidden />
                <span className="op-ix-t">
                  <b>{r.label}</b>
                  <span>{r.hint}</span>
                </span>
                <span className={`op-ix-v${r.value === null ? ' is-mut' : ''}`}>
                  {r.value ?? '—'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
