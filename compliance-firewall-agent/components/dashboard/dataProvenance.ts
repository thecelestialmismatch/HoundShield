/**
 * Data-provenance registry for the /console command center.
 *
 * The #205 honesty doctrine labeled every simulated surface; this registry is
 * the next step — clicking ANY number on the dashboard answers "where does
 * this come from?" in plain language: what the figure is, the exact origin of
 * the value on screen right now, how it refreshes, and what has to happen
 * before it becomes the operator's own data.
 *
 * One entry per clickable surface. LiveCommandCenter / OverviewCharts /
 * AssessSnapshot open entries by id; the ProvenancePanel dialog renders them.
 * Keeping this a pure data module makes the honesty claims unit-testable:
 * every simulated entry MUST say how it becomes live, and every entry that
 * changes meaning for a signed-in operator MUST carry the live variant.
 */

export type ProvenanceKind = 'simulated' | 'on-device' | 'account' | 'product'

export interface ProvenanceEntry {
  /** Human name of the surface, shown as the dialog title. */
  metric: string
  /** Source category for the value shown on the PUBLIC DEMO. */
  kind: ProvenanceKind
  /** Source category for a signed-in operator, when it differs from the demo. */
  kindLive?: ProvenanceKind
  /** What the figure means — one sentence a first-time buyer understands. */
  what: string
  /** Where the on-screen value comes from right now (demo path). */
  source: string
  /** Where the value comes from for a signed-in operator, when different. */
  sourceLive?: string
  /** How and when the value refreshes (demo path). */
  updates: string
  /** Refresh mechanics for a signed-in operator, when different. */
  updatesLive?: string
  /** What turns this into the operator's own data. Required for `simulated`. */
  liveWhen?: string
}

export const KIND_META: Record<ProvenanceKind, { label: string; blurb: string }> = {
  simulated: {
    label: 'Simulated demo data',
    blurb:
      'Generated in your browser for this preview — not a measurement from any real deployment. HoundShield never presents simulated numbers as a customer’s own.',
  },
  'on-device': {
    label: 'Your data · this device',
    blurb:
      'Computed in your browser from data saved on this device. It never leaves your machine and is never uploaded to HoundShield.',
  },
  account: {
    label: 'Your account',
    blurb:
      'Read from your real subscription plan and this session — actual entitlements and consumption, never sample numbers.',
  },
  product: {
    label: 'Product fact',
    blurb: 'A property of how HoundShield is built, not a live measurement.',
  },
}

/** The universal path from simulated preview to the operator's own telemetry. */
const PROXY_LIVE =
  'Point your AI traffic at the local proxy (Settings → Proxy URL). From then on this reads from your own gateway’s hash-chained audit log, computed on your hardware — never in our cloud.'

export const PROVENANCE = {
  'scans-24h': {
    metric: 'Prompts scanned (24h)',
    kind: 'simulated',
    what: 'Total AI prompts inspected by the gateway in the last 24 hours.',
    source:
      'The demo seed SCANS_24H (142,690) in OverviewCharts — the same constant the hourly-activity chart and destination bars sum to, so every total on this page agrees (contract-tested).',
    updates: 'Ticks upward every ~1.2 s with a small random increment, in your browser only.',
    liveWhen: PROXY_LIVE,
  },
  'blocked-today': {
    metric: 'Blocked today',
    kind: 'simulated',
    what: 'Prompts containing CUI, secrets, PII or PHI that the gateway stopped before they left the network today.',
    source:
      'The demo seed BLOCKED_TODAY (2,233) in OverviewCharts — shared with the risk-mix chart and the detection donut so the counts never disagree.',
    updates: 'Increments whenever the simulated threat feed emits a blocked event (~every few seconds).',
    liveWhen: PROXY_LIVE,
  },
  'sprs-score': {
    metric: 'SPRS score',
    kind: 'simulated',
    what: 'The DoD Supplier Performance Risk System self-assessment score (NIST 800-171 methodology, −203 to +110).',
    source:
      'The sample org’s fixed posture (+78) — demo data, not yours. Your real score is computed on this device from your own answers on the CMMC Assessment tab.',
    updates: 'Static for the sample org; the count-up on load is presentation only.',
    liveWhen:
      'Answer controls on the CMMC Assessment tab. Your score is computed in this browser from answers saved on this device — HoundShield never sees them.',
  },
  quarantine: {
    metric: 'Quarantine queue',
    kind: 'simulated',
    what: 'Intercepted prompts held for human review instead of being passed or hard-blocked.',
    source: 'The demo seed QUAR_SEED (15) in LiveCommandCenter — the feed simulation and this tile share it.',
    updates: 'Increments when the simulated feed emits a quarantine event.',
    liveWhen: PROXY_LIVE,
  },
  'product-stats': {
    metric: 'Engines · Scan p50 · Regions',
    kind: 'product',
    what: 'The three capability chips on the hero band.',
    source:
      '16 engines = the 16 detection pattern families shipped in the proxy (CUI, CMMC, secrets, PII, PHI, ITAR and more). <10 ms scan p50 = the local-scan design target the proxy is built and benchmarked against. 4 regions = the demo deployment footprint.',
    updates: 'Product facts — they change only when the product does.',
  },
  'system-status': {
    metric: 'System status line',
    kind: 'simulated',
    what: 'The operational summary strip — engines online, regions, incidents, seconds since the last block.',
    source: 'Simulated status for the demo gateway; the "last block" timer follows the simulated feed.',
    updates: 'The last-block counter ticks every second and resets when the simulated feed blocks.',
    liveWhen: PROXY_LIVE,
  },
  'audit-chain': {
    metric: 'Evidence chain (spine)',
    kind: 'simulated',
    what: 'The SHA-256 hash-chained audit log — every intercepted event appended and signed so evidence is tamper-evident for a C3PAO.',
    source:
      'A simulated block counter and randomly generated hash head, produced in your browser for the preview.',
    updates: 'Advances whenever the simulated feed emits a blocked event.',
    liveWhen:
      'In a real deployment every intercepted prompt appends a SHA-256 hash-chained entry to the audit log on your own hardware, and the Reports tab exports it as the signed evidence pack. ' +
      PROXY_LIVE,
  },
  throughput: {
    metric: 'Gateway throughput',
    kind: 'simulated',
    what: 'Prompts per second flowing through the gateway over the last 60 seconds.',
    source: 'A random-walk series generated in your browser — pure demo motion.',
    updates: 'A new point is appended and the chart redrawn every second.',
    liveWhen: PROXY_LIVE,
  },
  'detection-mix': {
    metric: 'Detection mix · today',
    kind: 'simulated',
    what: 'What kinds of sensitive data today’s blocks contained (CUI, secrets, PII, PHI).',
    source:
      'Simulated proportions; the centre total is the same BLOCKED_TODAY seed the KPI tile shows, so the two never disagree.',
    updates: 'Proportions drift slightly every 3 s; the total advances with the simulated feed.',
    liveWhen: PROXY_LIVE,
  },
  'threat-feed': {
    metric: 'Live threat feed',
    kind: 'simulated',
    what: 'The stream of intercepted prompts — blocked, quarantined or passed — with the engine that caught each and the scan latency.',
    source:
      'Rows are drawn from a fixed pool of 16 illustrative events in LiveCommandCenter — none of them are real prompts.',
    updates: 'A new simulated row arrives roughly every 2 s.',
    liveWhen: PROXY_LIVE,
  },
  'sprs-posture': {
    metric: 'SPRS posture ring',
    kind: 'simulated',
    what: 'How many of the 110 NIST 800-171 controls are implemented, and the gap to a conditional CMMC Level 2.',
    source: 'The sample org’s fixed 78/110 posture — demo data, not computed from your answers.',
    updates: 'Static; the ring fill animates once on load.',
    liveWhen:
      'Your real posture lives on the CMMC Assessment tab — computed on this device from your saved answers, recomputed the moment an answer changes.',
  },
  'engine-bars': {
    metric: 'Detections by engine · last hour',
    kind: 'simulated',
    what: 'How many catches each detection engine made in the last hour.',
    source: 'Fixed demo baselines per engine with random jitter applied in your browser.',
    updates: 'Bars re-jitter around their baselines every 1.5 s.',
    liveWhen: PROXY_LIVE,
  },
  'hourly-activity': {
    metric: 'Activity by hour · last 24h',
    kind: 'simulated',
    what: 'Prompts sent to AI tools each hour, with the blocked share highlighted.',
    source:
      'The static HOURLY_SCANS / HOURLY_BLOCKED series in OverviewCharts — deterministic demo data whose sums exactly equal the SCANS_24H and BLOCKED_TODAY KPI seeds (contract-tested).',
    updates: 'Static — the same deterministic series on every load, so nothing drifts between charts.',
    liveWhen: PROXY_LIVE,
  },
  destinations: {
    metric: 'Where prompts go',
    kind: 'simulated',
    what: 'Which AI tools (ChatGPT, Copilot, Claude, other) the scanned prompts were headed to.',
    source:
      'The static DESTINATIONS counts in OverviewCharts — demo data summing exactly to the SCANS_24H seed.',
    updates: 'Static — deterministic on every load.',
    liveWhen: PROXY_LIVE,
  },
  'sprs-trend': {
    metric: 'SPRS score · 30 days',
    kind: 'simulated',
    what: 'The sample org’s SPRS score over the last 30 days against the CMMC L2 target line.',
    source:
      'The static SPRS_TREND series in OverviewCharts — demo data ending at the same +78 the SPRS tile shows.',
    updates: 'Static — deterministic on every load.',
    liveWhen:
      'Your real score lives on the CMMC Assessment tab, computed on this device from your saved answers.',
  },
  'risk-mix': {
    metric: 'Risk mix · today’s blocks',
    kind: 'simulated',
    what: 'How serious today’s blocked prompts were, from Critical (CUI/ITAR) down to Low (policy flags).',
    source:
      'The static RISK_MIX counts in OverviewCharts — demo data summing exactly to the BLOCKED_TODAY seed.',
    updates: 'Static — deterministic on every load.',
    liveWhen: PROXY_LIVE,
  },
  assessment: {
    metric: 'CMMC assessment snapshot',
    kind: 'simulated',
    kindLive: 'on-device',
    what: 'Your SPRS score ring and the fastest-win controls, summarising the 110-control board below it.',
    source: 'The sample org’s lived-in numbers — labeled sample on the public demo.',
    sourceLive:
      'Your own answers on the 110-control board, saved in this browser’s local storage. The ring and fastest wins recompute from them the moment an answer lands — nothing is uploaded.',
    updates: 'Static sample numbers.',
    updatesLive: 'Recomputes instantly on every answer (assessment-updated event).',
    liveWhen: 'Answer controls on the board below — the snapshot switches to your data immediately.',
  },
  'usage-scans': {
    metric: 'AI gateway scans (billing cycle)',
    kind: 'simulated',
    kindLive: 'account',
    what: 'How much of your plan’s monthly gateway-scan allotment has been used.',
    source: 'A lived-in demo seed (~57% of the sample org’s Pro cap) that ticks upward for effect.',
    sourceLive:
      'Your plan’s real cap from your subscription entitlements. Usage stays at 0 until your proxy reports scans — nothing is simulated for your account.',
    updates: 'Demo meter ticks upward every ~1.2 s.',
    updatesLive: 'Fills only from your own proxy traffic once connected.',
    liveWhen: PROXY_LIVE,
  },
  'usage-brain': {
    metric: 'Brain AI queries',
    kind: 'account',
    what: 'How many Brain AI questions you’ve asked against your plan’s monthly allotment.',
    source:
      'Counted in this session as you ask, against the real query cap of the plan you’re signed in with (subscription entitlements). Nothing is pre-filled.',
    updates: 'Increments by one per question, the moment you ask.',
  },
  'usage-seats': {
    metric: 'Team seats',
    kind: 'simulated',
    kindLive: 'account',
    what: 'Seats in use against your plan’s seat allowance.',
    source: 'A lived-in demo seed (~70% of the sample org’s seats).',
    sourceLive: 'Your real seat count — one (you) until teammates are invited — against your plan’s real cap.',
    updates: 'Static demo seed.',
    updatesLive: 'Changes only when seats are actually added or removed.',
    liveWhen:
      'Sign in to your workspace — the meter then reads your real team (one seat until teammates are invited) against your plan’s actual seat cap.',
  },
} as const satisfies Record<string, ProvenanceEntry>

export type ProvenanceId = keyof typeof PROVENANCE

/** Every registered id — handy for exhaustive tests. */
export const PROVENANCE_IDS = Object.keys(PROVENANCE) as ProvenanceId[]

/** The entry as it applies to the current viewer (demo vs signed-in). */
export interface ResolvedProvenance {
  metric: string
  kind: ProvenanceKind
  what: string
  source: string
  updates: string
  liveWhen?: string
}

/**
 * Resolve an entry for the surface the operator is actually looking at:
 * signed-in viewers get the live variants (their account / their device),
 * the public demo gets the simulated descriptions.
 */
export function resolveProvenance(id: ProvenanceId, live: boolean): ResolvedProvenance {
  const e: ProvenanceEntry = PROVENANCE[id]
  const kind = live && e.kindLive ? e.kindLive : e.kind
  return {
    metric: e.metric,
    kind,
    what: e.what,
    source: live && e.sourceLive ? e.sourceLive : e.source,
    updates: live && e.updatesLive ? e.updatesLive : e.updates,
    // Once the surface shows the operator's own data, the "how it becomes
    // yours" step is done — only still-simulated surfaces carry it.
    liveWhen: kind === 'simulated' ? e.liveWhen : undefined,
  }
}
