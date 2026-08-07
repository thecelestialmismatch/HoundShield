/**
 * Operator dashboard panels — the signed-in Command Center's charts, every one
 * of them drawn from the customer's OWN data.
 *
 * This file is now a barrel. It was 616 lines against this repo's 500-line
 * component rule (CLAUDE.md, DESIGN.md), so on 2026-08-07 it was split by
 * concern into the four modules below. Nothing about the panels changed, and
 * because every export still comes out of this path, no import anywhere in the
 * codebase moved — `OperatorOverview.tsx` imports the same nine names from the
 * same specifier it always did.
 *
 *   panelPrimitives.tsx  palette, number formatting, the shared empty state
 *   OperatorKpis.tsx     the six KPI tiles
 *   OperatorCharts.tsx   activity, providers, risk radar, SPRS trend,
 *                        NIST family matrix, detections by engine
 *   OperatorFeed.tsx     live event feed, deep-tool shortcuts
 *
 * These are the real-data counterparts to the demo overview charts (which stay
 * simulated on purpose — that module feeds the anonymous marketing preview and
 * is labelled "sample" throughout). The split is the whole point: a signed-in
 * operator must never be shown a seeded number, and a public visitor with no
 * account must never be shown a blank page.
 *
 * The two rules that survive the refactor, restated because they are the reason
 * this code looks the way it does:
 *
 *  1. NO FALLBACK DATA. When a series is empty the panel renders an empty state
 *     that says why and what to do about it. It never substitutes a plausible
 *     shape. On a product whose deliverable is C3PAO audit evidence, a chart
 *     that looks like a measurement but isn't is the worst possible bug.
 *  2. Charts are hand-rolled SVG. Recharts is avoided deliberately — it crashes
 *     on SSR (see CLAUDE.md on PlatformDashboard), and these panels render
 *     inside the server-rendered dashboard shell.
 */

export { NoTelemetry, STEEL, ORANGE, GREEN, VIOLET, RISK_COLOR, fmt } from './panelPrimitives'
export { OperatorKpis } from './OperatorKpis'
export {
  ActivityByHour,
  ProviderBreakdown,
  RiskRadar,
  SprsTrend,
  FamilyMatrix,
  DetectionsByEngine,
} from './OperatorCharts'
export { LiveEvents, QuickActions } from './OperatorFeed'
