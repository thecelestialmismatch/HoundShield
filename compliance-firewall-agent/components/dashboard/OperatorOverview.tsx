'use client'

/**
 * OperatorOverview — the Overview a SIGNED-IN customer sees.
 *
 * Founder direction 2026-07-31: the rich Command Center overview (KPI row, SPRS
 * trend, risk radar, provider breakdown, live events, 24h activity, quick
 * actions) is what should be on screen the moment you log in — "with the correct
 * data, not the fake data".
 *
 * Both halves of that sentence are load-bearing, and this component exists to
 * satisfy them at the same time. The layout is the one the founder asked for.
 * Every number in it comes from the operator's own gateway events, their own
 * on-device assessment, or their own recorded posture history — see
 * `useOperatorTelemetry`. Where a source is empty the panel says so and points
 * at the action that fills it; nothing is ever seeded to make a chart look
 * populated.
 *
 * Why this is a separate component from the demo Overview in
 * LiveCommandCenter: the anonymous, logged-out preview at the same route is a
 * marketing surface, and its simulated panels are correct there (they are
 * labelled "sample" and exist to show a buyer what the product does). Trying to
 * make one set of panels serve both audiences is how a seeded number ends up in
 * front of a paying customer. The two are kept apart on purpose.
 *
 * REVERSAL NOTE — this supersedes founder direction 2026-07-23 ("strip it way
 * down"), which is why `SIGNED_IN_STRIPPED_HIDDEN` is now empty. That direction
 * was the right call when every signed-in panel was simulated: hiding invented
 * numbers beat showing them. Now that the panels are real, there is nothing
 * dishonest left to hide. Do not "restore" the stripped set without also
 * restoring simulated data — the two changes only make sense together.
 */

import { useState } from 'react'
import { RefreshCw, Calendar, AlertTriangle } from 'lucide-react'
import { Section } from './OverviewSection'
import type { DashboardPrefs } from '@/lib/dashboard/use-dashboard-prefs'
import { DashboardDownload } from './operator/DashboardDownload'
import { AgentOversight } from './operator/AgentOversight'
import { SectionIndex } from './operator/SectionIndex'
import { ActivityHeatmap } from './operator/ActivityHeatmap'
import { OutcomeMix, BlockedSeverity } from './operator/OutcomeDonuts'
import { ExposurePrevented } from './operator/ExposurePrevented'
import { DailyTrend, LatencyProfile, SprsGauge } from './operator/TrendCharts'
import { BlockRateTrend, HourOfDayProfile, CumulativeInspected } from './operator/RiskWindows'
import { GatewayTerminal } from './operator/GatewayTerminal'
import { useQuarantineCount } from '@/app/command-center/(tools)/_shell/useQuarantineCount'
import { dashboardLabel } from '@/app/command-center/(tools)/_shell/useViewer'
import type { ProvenanceId } from './dataProvenance'
import type { EventOutcome } from '@/lib/dashboard/overview-telemetry'
import { useOperatorTelemetry, type TelemetryWindow } from './operator/useOperatorTelemetry'
import {
  OperatorKpis, ActivityByHour, ProviderBreakdown, RiskRadar, FamilyMatrix,
  SprsTrend, LiveEvents, QuickActions, DetectionsByEngine,
} from './operator/OperatorPanels'

const WINDOWS: { value: TelemetryWindow; label: string }[] = [
  { value: 1, label: 'Last 24 hours' },
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
]

export function OperatorOverview({ prefs, editing, onSource, onTab, brainSlot, checklistSlot, name }: {
  prefs: DashboardPrefs
  editing: boolean
  onSource: (id: ProvenanceId) => void
  onTab: (tab: 'assess' | 'settings' | 'feed' | 'reports') => void
  /**
   * The operator's first name, when the session has one.
   *
   * Display only, and deliberately optional: the page already resolves this for
   * the Brain AI card, so greeting the person who just signed in costs one
   * prop rather than a second lookup. Absent — no profile, no name set, a failed
   * read — the heading falls back to the page's own name. A stand-in ("there",
   * "Operator") would be a fabricated identity on the customer's own dashboard,
   * which is the same rule the company slot in the header follows.
   */
  name?: string | null
  /** The Brain AI quick-ask card, owned by LiveCommandCenter (it wires the live
   *  analyst). Passed in rather than duplicated so there is one implementation. */
  brainSlot: React.ReactNode
  /** Likewise the first-run checklist, which drives activation to the PDF. */
  checklistSlot: React.ReactNode
}) {
  const t = useOperatorTelemetry()
  const [filter, setFilter] = useState<'all' | EventOutcome>('all')
  // Same live read the sidebar badge uses — null while loading, on error, or in
  // demo mode, and null renders a dash rather than an invented zero.
  const quarantine = useQuarantineCount()

  const openSettings = () => onTab('settings')
  const openAssess = () => onTab('assess')

  return (
    <>
      {/* Toolbar — the founder's "Dashboard Overview / Live / Last update"
          header, with the window picker and refresh made functional rather
          than decorative (they were inert buttons in the mockup). */}
      <div className="op-toolbar">
        <div className="op-toolbar-l">
          {/* "Sam's Dashboard", matching the single merged sidebar entry.
              Falls back to the neutral label with no session name — never an
              invented stand-in. Same helper the sidebar uses, so the two can
              never disagree. */}
          <h2>
            {dashboardLabel(name ?? null, 'Your Dashboard')}
            {/* Seeded data says so, on screen, next to the title — not in a
                tooltip and not only in the API response. This dashboard is sold
                as audit evidence, so an unlabelled screenshot of generated
                numbers would be a fabricated metric (CLAUDE.md NEVER-DO). The
                flag is set by the aggregator from the rows themselves, so it
                cannot be switched off from the UI. */}
            {t.tel.synthetic && (
              <span className="op-demo-tag" title="Seeded demo telemetry — not measured traffic">
                Demo data
              </span>
            )}
          </h2>
          <div className="op-toolbar-sub">
            <span className={`op-live${t.error ? ' is-err' : ''}`}>
              <span className="dot" /> {t.error ? 'Offline' : 'Live'}
            </span>
            <span className="sep">·</span>
            <span className="mono">
              {t.loading
                ? 'Refreshing…'
                : t.lastUpdated
                  ? `Last update: ${new Date(t.lastUpdated).toLocaleTimeString()}`
                  : 'Not yet loaded'}
            </span>
          </div>
        </div>
        <div className="op-toolbar-r">
          <label className="op-select">
            <Calendar aria-hidden />
            <span className="sr-only">Time window</span>
            <select
              value={t.windowDays}
              onChange={(e) => t.setWindowDays(Number(e.target.value) as TelemetryWindow)}
            >
              {WINDOWS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
            </select>
          </label>
          <button type="button" className="btn btn-g btn-sm" onClick={t.refresh} disabled={t.loading}>
            <RefreshCw aria-hidden /> Refresh
          </button>
          {/* Top-right download — founder direction 2026-08-07. Hands the
              operator's selected window straight to the existing report
              endpoint so the file always covers what they are looking at. */}
          <DashboardDownload windowDays={t.windowDays} />
        </div>
      </div>

      {/* Two conditions the operator must never have to guess at. */}
      {t.error && (
        <div className="op-banner is-err" role="status">
          <AlertTriangle aria-hidden /> {t.error} Showing the last successful read.
        </div>
      )}
      {t.truncated && (
        <div className="op-banner" role="status">
          <AlertTriangle aria-hidden /> This window exceeds the 5,000-event
          aggregation cap — figures below cover the most recent 5,000 events.
          The full record is in your audit log.
        </div>
      )}

      <div className={`ovsections${editing ? ' editing' : ''}`}>
        <Section id="kpis" prefs={prefs} editing={editing}>
          <OperatorKpis tel={t.tel} posture={t.posture} onSource={onSource} />
        </Section>

        {/* Why this product exists, in this tenant's own numbers. Sits directly
            under the KPIs because it is the answer to "so what". */}
        <Section id="saved" prefs={prefs} editing={editing}>
          <ExposurePrevented tel={t.tel} />
        </Section>

        <Section id="brain" prefs={prefs} editing={editing}>
          {brainSlot}
        </Section>

        <Section id="charts" prefs={prefs} editing={editing}>
          <div className="row r-3-2">
            <ActivityByHour tel={t.tel} onSettings={openSettings} />
            <ProviderBreakdown tel={t.tel} onSettings={openSettings} />
          </div>
        </Section>

        <Section id="mix" prefs={prefs} editing={editing}>
          <div className="row r-3-2">
            <OutcomeMix tel={t.tel} />
            <BlockedSeverity tel={t.tel} />
          </div>
        </Section>

        {/* What is happening right now, in the register an engineer reads. */}
        <Section id="terminal" prefs={prefs} editing={editing}>
          <GatewayTerminal tel={t.tel} recent={t.recent} />
        </Section>

        {/* Who/what is sending. Sits next to the live console because the two
            answer the same operator question from opposite ends: what just
            happened, and what keeps making it happen. */}
        <Section id="actors" prefs={prefs} editing={editing}>
          <AgentOversight tel={t.tel} />
        </Section>

        <Section id="trend" prefs={prefs} editing={editing}>
          <div className="row r-3-2">
            <DailyTrend tel={t.tel} />
            <LatencyProfile tel={t.tel} />
          </div>
        </Section>

        <Section id="rate" prefs={prefs} editing={editing}>
          <div className="row r-3-2">
            <BlockRateTrend tel={t.tel} />
            <CumulativeInspected tel={t.tel} />
          </div>
        </Section>

        <Section id="gauge" prefs={prefs} editing={editing}>
          <div className="row r-3-2">
            <SprsGauge posture={t.posture} />
            <HourOfDayProfile tel={t.tel} />
          </div>
        </Section>

        <Section id="heatmap" prefs={prefs} editing={editing}>
          <ActivityHeatmap tel={t.tel} />
        </Section>

        <Section id="posture" prefs={prefs} editing={editing}>
          <div className="row r-3-2">
            <SprsTrend points={t.history} onAssess={openAssess} />
            <RiskRadar posture={t.posture} onAssess={openAssess} />
          </div>
          {/* The numbers behind the radar, full width — inside the radar's
              column its 14 rows stretched the trend chart into dead space.
              Renders nothing until there is an assessment to break down. */}
          <FamilyMatrix posture={t.posture} />
        </Section>

        <Section id="feed" prefs={prefs} editing={editing}>
          <LiveEvents recent={t.recent} filter={filter} onFilter={setFilter} onSettings={openSettings} />
        </Section>

        <Section id="engines" prefs={prefs} editing={editing}>
          <DetectionsByEngine tel={t.tel} onSettings={openSettings} />
        </Section>

        <Section id="checklist" prefs={prefs} editing={editing}>
          {checklistSlot}
        </Section>

        <Section id="actions" prefs={prefs} editing={editing}>
          <QuickActions />
        </Section>

        {/* Where to go next. The panels above say what is happening; nothing on
            this page said where to look for more until 2026-08-07. */}
        <Section id="index" prefs={prefs} editing={editing}>
          <SectionIndex tel={t.tel} posture={t.posture} quarantine={quarantine} />
        </Section>
      </div>
    </>
  )
}
