"use client";

/**
 * Security Dashboard.
 *
 * WHAT THIS PAGE USED TO BE, and why none of it survived
 * Every number on it was invented. Two local factory functions used a
 * random-number generator to produce 24 hours of scan latency and eight
 * violations with arbitrary categories and risk levels, freshly on each load;
 * the risk donut and category bars were hardcoded arrays (18/34/48/62/438,
 * 42/31/28/17/12). The four stat cards carried fixed trend deltas measured
 * against nothing. "Refresh" was a timer that re-rendered the same constants.
 * The file's own docstring claimed "Data source: /api/audit/export (real
 * Supabase)"; there was no fetch anywhere in it.
 *
 * (The guard test alongside this file asserts those mechanisms are absent by
 * name, so this note deliberately describes them rather than spelling them.)
 *
 * A customer logging in saw a security posture that changed every time they
 * reloaded. That is worse than an empty page: an empty page tells the truth.
 *
 * WHAT IT IS NOW
 * The same telemetry the Overview runs on — `useOperatorTelemetry()`, scoped to
 * the session user — rendered through the same panels. Reusing the panels
 * rather than re-plotting the charts is what guarantees the two pages can never
 * disagree about the same tenant, and it inherits their honesty properties for
 * free: an unmeasured value renders as an em dash rather than zero, and an
 * empty state is an empty state rather than a flat-lined chart.
 *
 * Every panel here is a link to the rows behind it. The donut slices already
 * carried hrefs into /command-center/events with the outcome and risk
 * pre-filtered; the KPI tiles now do the same. Clicking a number goes to the
 * records that produced it.
 */

import { type CSSProperties } from "react";
import Link from "next/link";
import { RefreshCw, ShieldAlert, AlertTriangle, Clock, ScrollText } from "lucide-react";
import { LCC_CSS } from "@/components/dashboard/lccStyles";
import { useOperatorTelemetry } from "@/components/dashboard/operator/useOperatorTelemetry";
import { LatencyProfile } from "@/components/dashboard/operator/TrendCharts";
import { OutcomeMix, BlockedSeverity } from "@/components/dashboard/operator/OutcomeDonuts";
import { DetectionsByEngine, ActivityByHour } from "@/components/dashboard/operator/OperatorCharts";
import { getThemeById, consoleThemeVars } from "@/lib/dashboard/design-themes";
import { useDashboardPrefs } from "@/lib/dashboard/use-dashboard-prefs";

/**
 * A KPI tile that is also a link to its own evidence.
 *
 * `value` is `null` when the metric was not measured — rendered as an em dash,
 * never as 0, because "no events yet" and "zero blocked out of a million" are
 * different facts and a customer cannot tell them apart from a zero.
 */
function StatLink({
  label,
  value,
  href,
  icon: Icon,
  hint,
  accent,
  unit = "",
}: {
  label: string;
  value: number | null;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
  accent: string;
  unit?: string;
}) {
  return (
    // Reuses the Overview's `.kpi` classes rather than new ones, so the two
    // pages stay visually identical without a second stylesheet to maintain.
    // The Overview's tiles are buttons that open a provenance dialog; these are
    // links, because the ask here was "click the number, land on the records".
    <Link href={href} className={`kpi ${accent}`} aria-label={`${label} — open the underlying records`}>
      <div className="l">
        <Icon aria-hidden /> {label}
      </div>
      <div className="n">{value === null ? "—" : `${value.toLocaleString()}${unit}`}</div>
      <div className="d">{hint}</div>
    </Link>
  );
}

export default function SecurityDashboardPage() {
  const t = useOperatorTelemetry();
  const prefs = useDashboardPrefs();
  const theme = getThemeById(prefs.themeId);

  const totals = t.tel.totals;
  // `connected` is false when the tenant has no events at all. Distinguishing it
  // from a real zero is the whole point of the em dash — see StatLink.
  const measured = t.tel.connected;

  return (
    <div
      className="hs-lcc hs-embedded"
      data-theme={theme.id}
      data-mode={theme.mode}
      style={consoleThemeVars(theme) as CSSProperties}
    >
      <style dangerouslySetInnerHTML={{ __html: LCC_CSS }} />

      <div className="op-tools">
        <button type="button" className="btn btn-g btn-sm" onClick={t.refresh} disabled={t.loading}>
          <RefreshCw aria-hidden /> {t.loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* An error is not an empty dashboard. If we could not ask, say so —
          rendering zeros here would be indistinguishable from a clean tenant. */}
      {t.error && (
        <div className="op-banner" role="alert">
          <AlertTriangle aria-hidden /> {t.error} — these panels are showing the last
          successful read, not live data.
        </div>
      )}

      {/* The telemetry contract requires every surface rendering this data to
          disclose seeded rows on screen: an unlabelled screenshot of demo
          numbers is a fabricated metric. The flag is set by the aggregator from
          the rows themselves, so it cannot be switched off from the UI. */}
      {t.tel.synthetic && (
        <div className="op-banner" role="status">
          <AlertTriangle aria-hidden /> Demo data — some rows in this window were
          seeded, not measured from your gateway.
        </div>
      )}

      {t.truncated && (
        <div className="op-banner" role="status">
          <AlertTriangle aria-hidden /> This window exceeds the 5,000-event aggregation
          cap — figures below cover the most recent 5,000 events. The full record is in
          your audit log.
        </div>
      )}

      <div className="kpis k6">
        <StatLink
          label="Inspected"
          value={measured ? totals.events : null}
          href="/command-center/events"
          icon={ScrollText}
          accent="a-ok"
          hint={measured ? `last ${t.tel.windowDays}d · your gateway` : "no traffic yet"}
        />
        <StatLink
          label="Blocked"
          value={measured ? totals.blocked : null}
          href="/command-center/events?outcome=blocked"
          icon={ShieldAlert}
          accent="a-bad"
          hint={measured ? `${totals.blockRatePct}% of traffic` : "no traffic yet"}
        />
        <StatLink
          label="Held for review"
          value={measured ? totals.warning : null}
          href="/command-center/quarantine"
          icon={AlertTriangle}
          accent="a-orange"
          hint="awaiting a human decision"
        />
        <StatLink
          label="Scan latency p50"
          value={t.tel.scanP50Ms}
          unit="ms"
          href="/command-center/realtime"
          icon={Clock}
          accent="a-brand"
          hint="median, measured on your hardware"
        />
      </div>

      {/* Donut slices carry their own hrefs into the filtered audit log — that
          is the "click the graph, land on the rows" behaviour, inherited rather
          than reimplemented here. */}
      <div className="row r-3-2">
        <OutcomeMix tel={t.tel} />
        <BlockedSeverity tel={t.tel} />
      </div>

      <div className="row r-3-2">
        <ActivityByHour tel={t.tel} />
        <LatencyProfile tel={t.tel} />
      </div>

      <DetectionsByEngine tel={t.tel} />
    </div>
  );
}
