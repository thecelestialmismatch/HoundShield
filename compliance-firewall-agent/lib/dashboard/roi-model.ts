/**
 * Compliance ROI — the dollars-saved data model.
 *
 * Powers the "Compliance ROI" dashboard (route: /roi): the surface that turns
 * HoundShield's blocked-incident count into a defensible dollar figure. This is
 * the ROI argument a buyer (Rachel/Jordan/Marcus) needs to justify the $499
 * report → subscription, and the number an RPO/MSP partner puts in front of
 * their client — HoundShield's #1 channel.
 *
 * INTEGRITY (matches lib/dashboard/control-map-data.ts):
 *  - Every headline figure is a REAL aggregation computed by a pure function
 *    here and asserted in lib/dashboard/__tests__/roi-model.test.ts. No magic
 *    constants rendered straight to the screen.
 *  - This is a MODELED ESTIMATE for a SAMPLE org, clearly labeled as such on
 *    the page. The per-incident remediation costs are transparent, conservative
 *    modeling assumptions (visible in the "cost model" note), NOT fabricated
 *    live telemetry — and never surfaced as a marketing metric.
 *  - Source of truth is COST_PER_INCIDENT + per-category incident counts; the
 *    period scaling, trend series, and ROI multiple all derive from them.
 */

export type RoiPeriod = '90d' | '6m' | '12m';

export type CategoryId = 'cui' | 'phi' | 'pii' | 'secrets' | 'ip';

/** A detection category HoundShield blocks, with its modeled remediation cost. */
export interface RoiCategory {
  id: CategoryId;
  /** Full label, e.g. 'CUI / DFARS spillage'. */
  label: string;
  /** Short label for tight UI, e.g. 'CUI'. */
  short: string;
  /** Prevented incidents over a trailing 12 months (sample org). */
  incidents12m: number;
  /**
   * Modeled remediation cost avoided per prevented incident, in USD. A
   * conservative, transparent assumption (IR hours + notification + exposure),
   * shown on the page — not a claimed measured value.
   */
  costPerIncident: number;
  /**
   * Modeled annual exposure ceiling for this category, in USD. The savings bar
   * reads current-avoided against this, so the bar means "share of this year's
   * modeled exposure already neutralized".
   */
  annualExposureTarget: number;
}

/* ── Cost model (the transparent assumptions) ─────────────────────────────
 * Conservative per-incident remediation costs. Rationale surfaced on the page:
 * CUI/PHI carry mandated breach-notification + reporting overhead; a leaked
 * secret carries credential-rotation + potential-compromise cost. */
export const CATEGORIES: readonly RoiCategory[] = [
  {
    id: 'cui',
    label: 'CUI / DFARS spillage',
    short: 'CUI',
    incidents12m: 12,
    costPerIncident: 9600,
    annualExposureTarget: 128000,
  },
  {
    id: 'phi',
    label: 'PHI / HIPAA exposure',
    short: 'PHI',
    incidents12m: 8,
    costPerIncident: 12400,
    annualExposureTarget: 124000,
  },
  {
    id: 'pii',
    label: 'PII leak',
    short: 'PII',
    incidents12m: 27,
    costPerIncident: 4200,
    annualExposureTarget: 126000,
  },
  {
    id: 'secrets',
    label: 'Secret / credential',
    short: 'Secrets',
    incidents12m: 5,
    costPerIncident: 18500,
    annualExposureTarget: 130000,
  },
  {
    id: 'ip',
    label: 'Source & IP',
    short: 'Source/IP',
    incidents12m: 6,
    costPerIncident: 6800,
    annualExposureTarget: 68000,
  },
];

/** HoundShield Pro list price — the ROI denominator. $799/mo × 12. */
export const PRO_MONTHLY = 799;
export const PRO_ANNUAL = PRO_MONTHLY * 12; // 9,588

/** Fraction of a trailing 12 months each period represents. */
export const PERIOD_FRACTION: Record<RoiPeriod, number> = {
  '90d': 0.25,
  '6m': 0.5,
  '12m': 1,
};

export const PERIOD_LABEL: Record<RoiPeriod, string> = {
  '90d': 'Last 90 days',
  '6m': 'Last 6 months',
  '12m': 'Last 12 months',
};

/** Number of trend points to plot for each period (one per month). */
export const PERIOD_MONTHS: Record<RoiPeriod, number> = {
  '90d': 3,
  '6m': 6,
  '12m': 12,
};

/* ── A resolved per-category line for a period ────────────────────────── */
export interface CategoryLine {
  id: CategoryId;
  label: string;
  short: string;
  /** Prevented incidents in the period (rounded from the 12m figure). */
  incidents: number;
  /** Dollars of remediation avoided in the period. */
  costAvoided: number;
  /** 0–100: avoided vs the modeled annual exposure ceiling. */
  coveragePct: number;
}

/* ── A fully-resolved snapshot for one period ─────────────────────────── */
export interface RoiSnapshot {
  period: RoiPeriod;
  periodLabel: string;
  /** Total dollars of remediation avoided in the period. */
  totalAvoided: number;
  /** Total prevented incidents in the period. */
  totalIncidents: number;
  /** Average dollars protected per month across the period. */
  monthlyAverage: number;
  /** Whole-number ROI multiple vs the HoundShield Pro cost for the period. */
  roiMultiple: number;
  /** HoundShield Pro cost for the period, in USD. */
  toolCost: number;
  categories: CategoryLine[];
  /** Cumulative savings, one point per month (monotonic non-decreasing). */
  trend: number[];
}

/* ── Pure aggregation helpers (all unit-tested) ───────────────────────── */

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/** Prevented incidents for a category in a period. */
export function incidentsForPeriod(cat: RoiCategory, period: RoiPeriod): number {
  return Math.round(cat.incidents12m * PERIOD_FRACTION[period]);
}

/** Dollars avoided for a category in a period. */
export function costAvoidedForPeriod(cat: RoiCategory, period: RoiPeriod): number {
  return incidentsForPeriod(cat, period) * cat.costPerIncident;
}

/** Resolve every category into a period line. */
export function categoryLines(period: RoiPeriod): CategoryLine[] {
  return CATEGORIES.map((c) => {
    const costAvoided = costAvoidedForPeriod(c, period);
    // Coverage reads full-year avoided against the annual ceiling, so the bar
    // is stable across periods (it's a "this year" gauge, not a period gauge).
    const annualAvoided = c.incidents12m * c.costPerIncident;
    return {
      id: c.id,
      label: c.label,
      short: c.short,
      incidents: incidentsForPeriod(c, period),
      costAvoided,
      coveragePct: clampPct(Math.round((annualAvoided / c.annualExposureTarget) * 100)),
    };
  });
}

/** Total dollars avoided across all categories in a period. */
export function totalAvoided(period: RoiPeriod): number {
  return CATEGORIES.reduce((acc, c) => acc + costAvoidedForPeriod(c, period), 0);
}

/** Total prevented incidents across all categories in a period. */
export function totalIncidents(period: RoiPeriod): number {
  return CATEGORIES.reduce((acc, c) => acc + incidentsForPeriod(c, period), 0);
}

/** HoundShield Pro cost for the period. */
export function toolCost(period: RoiPeriod): number {
  return Math.round(PRO_ANNUAL * PERIOD_FRACTION[period]);
}

/** Whole-number ROI multiple: dollars avoided per dollar of HoundShield. */
export function roiMultiple(period: RoiPeriod): number {
  const cost = toolCost(period);
  if (cost <= 0) return 0;
  return Math.round(totalAvoided(period) / cost);
}

/* ── Trend series ──────────────────────────────────────────────────────
 * A gentle S-curve ramp (adoption → steady state) normalized to sum to 1, so
 * the cumulative series always ends exactly at the period total. Deterministic:
 * no randomness, SSR-safe, test-stable. */
function rampWeights(n: number): number[] {
  // Logistic-ish increasing marginal weights, then normalized.
  const raw = Array.from({ length: n }, (_, i) => 1 + Math.sin((i / Math.max(1, n - 1)) * (Math.PI / 2)));
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((w) => w / sum);
}

/** Cumulative-savings series for a period, one point per month. */
export function savingsTrend(period: RoiPeriod): number[] {
  const n = PERIOD_MONTHS[period];
  const total = totalAvoided(period);
  const weights = rampWeights(n);
  const out: number[] = [];
  let running = 0;
  for (let i = 0; i < n; i += 1) {
    running += weights[i] * total;
    out.push(Math.round(running));
  }
  // Force the final point to the exact total (kill float/rounding drift).
  if (out.length > 0) out[out.length - 1] = total;
  return out;
}

/** Resolve the full snapshot for a period. */
export function getRoiSnapshot(period: RoiPeriod = '12m'): RoiSnapshot {
  const months = PERIOD_MONTHS[period];
  const total = totalAvoided(period);
  return {
    period,
    periodLabel: PERIOD_LABEL[period],
    totalAvoided: total,
    totalIncidents: totalIncidents(period),
    monthlyAverage: Math.round(total / months),
    roiMultiple: roiMultiple(period),
    toolCost: toolCost(period),
    categories: categoryLines(period),
    trend: savingsTrend(period),
  };
}

/* ── Formatting helpers ───────────────────────────────────────────────── */

/** Full USD, e.g. 461100 → "$461,100". */
export function formatUsd(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

/** Compact USD, e.g. 461100 → "$461K", 1113600 → "$1.1M". */
export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}
