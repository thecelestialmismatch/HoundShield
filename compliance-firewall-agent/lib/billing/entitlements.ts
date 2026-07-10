/**
 * Subscription entitlements — the single source of truth for "what does this
 * plan get?" across the post-login dashboard.
 *
 * This is the tiered-usage model the app bills against: every plan gets the full
 * product surface, but the *volume* it can consume (AI gateway scans, on-device
 * Brain AI queries, team seats, audit-log retention) scales with the tier — the
 * same shape as a metered consumer plan (Pro is capped, the tier above is ~20×,
 * the top tier is effectively unlimited). Feature *availability* (PDF reports,
 * C3PAO coordination, SSO/RBAC, on-prem, white-label) is gated on top of the
 * volume ladder.
 *
 * Pure and fully unit-tested so the dashboard, the pricing page, and any future
 * server-side enforcement all read one coherent grid — numbers can never drift
 * between the marketing site and the console again.
 *
 * Numbers are aligned to app/pricing/page.tsx (Pro 50k scans / 10 seats,
 * Growth unlimited / 25 seats, Enterprise unlimited / unlimited).
 */

export type TierSlug = 'free' | 'pro' | 'growth' | 'enterprise' | 'agency';

/** Gated capabilities layered on top of the volume ladder. */
export type FeatureKey =
  | 'aiGateway'
  | 'slackAlerts'
  | 'apiAccess'
  | 'pdfReports'
  | 'c3paoCoordination'
  | 'ssoRbac'
  | 'auditExport'
  | 'hitlQuarantine'
  | 'onPrem'
  | 'whiteLabel'
  | 'prioritySupport';

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  aiGateway: 'AI prompt gateway',
  slackAlerts: 'Email & Slack alerts',
  apiAccess: 'API + JSON reports',
  pdfReports: 'PDF compliance reports',
  c3paoCoordination: 'C3PAO coordination',
  ssoRbac: 'SSO & RBAC',
  auditExport: 'Audit-trail export',
  hitlQuarantine: 'Human-in-the-loop quarantine',
  onPrem: 'On-prem / air-gapped deploy',
  whiteLabel: 'White-label reports',
  prioritySupport: 'Priority support & CSM',
};

/** Sentinel for "no cap" — rendered as "Unlimited". */
export const UNLIMITED = Infinity;

export interface Entitlements {
  tier: TierSlug;
  /** Human plan name for the UI ("Pro", "Growth", …). */
  name: string;
  /** One-line who-it's-for, shown under the plan name. */
  tagline: string;
  /** Monthly list price in USD. null = "custom / contact sales". */
  priceMonthly: number | null;
  /** Monthly AI gateway scan allotment. UNLIMITED for the top tiers. */
  gatewayScans: number;
  /** Monthly on-device Brain AI query allotment. */
  brainQueries: number;
  /** Included team seats. */
  seats: number;
  /** Audit-log / evidence retention window in days. */
  retentionDays: number;
  /** Availability of each gated capability. */
  features: Record<FeatureKey, boolean>;
  /** The tier to upsell into (drives the dashboard "Upgrade" CTA). null at top. */
  nextTier: TierSlug | null;
}

const F = (on: FeatureKey[]): Record<FeatureKey, boolean> => {
  const base = Object.fromEntries(
    (Object.keys(FEATURE_LABELS) as FeatureKey[]).map((k) => [k, false]),
  ) as Record<FeatureKey, boolean>;
  for (const k of on) base[k] = true;
  return base;
};

/**
 * The grid. Order = the upgrade ladder. Each tier is a strict superset of the
 * one below in both volume and capability, which is what makes "Upgrade to X"
 * always a truthful "you get strictly more".
 */
export const ENTITLEMENTS: Record<TierSlug, Entitlements> = {
  free: {
    tier: 'free',
    name: 'Free',
    tagline: 'Self-assessment for a single team',
    priceMonthly: 0,
    gatewayScans: 1_000,
    brainQueries: 25,
    seats: 1,
    retentionDays: 7,
    features: F(['aiGateway']),
    nextTier: 'pro',
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    tagline: 'AI gateway + full CMMC suite for defense contractors',
    priceMonthly: 199,
    gatewayScans: 50_000,
    brainQueries: 500,
    seats: 10,
    retentionDays: 90,
    features: F(['aiGateway', 'slackAlerts', 'apiAccess', 'auditExport']),
    nextTier: 'growth',
  },
  growth: {
    tier: 'growth',
    name: 'Growth',
    tagline: 'PDF reports + C3PAO coordination for growing primes',
    priceMonthly: 499,
    gatewayScans: UNLIMITED,
    // ~20× the Pro Brain allotment — the "next tier gets a lot more" jump.
    brainQueries: 10_000,
    seats: 25,
    retentionDays: 365,
    features: F([
      'aiGateway',
      'slackAlerts',
      'apiAccess',
      'auditExport',
      'pdfReports',
      'c3paoCoordination',
      'ssoRbac',
      'prioritySupport',
    ]),
    nextTier: 'enterprise',
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    tagline: 'On-prem & air-gapped for large primes',
    priceMonthly: 999,
    gatewayScans: UNLIMITED,
    brainQueries: UNLIMITED,
    seats: UNLIMITED,
    retentionDays: 2555, // 7 years
    features: F([
      'aiGateway',
      'slackAlerts',
      'apiAccess',
      'auditExport',
      'pdfReports',
      'c3paoCoordination',
      'ssoRbac',
      'prioritySupport',
      'hitlQuarantine',
      'onPrem',
      'whiteLabel',
    ]),
    nextTier: 'agency',
  },
  agency: {
    tier: 'agency',
    name: 'Agency',
    tagline: 'Multi-tenant white-label for RPOs & MSPs',
    priceMonthly: 2499,
    gatewayScans: UNLIMITED,
    brainQueries: UNLIMITED,
    seats: UNLIMITED,
    retentionDays: 2555,
    features: F([
      'aiGateway',
      'slackAlerts',
      'apiAccess',
      'auditExport',
      'pdfReports',
      'c3paoCoordination',
      'ssoRbac',
      'prioritySupport',
      'hitlQuarantine',
      'onPrem',
      'whiteLabel',
    ]),
    nextTier: null,
  },
};

/**
 * Aliases so friendlier / marketing names resolve to a canonical tier. Lets the
 * dashboard accept whatever slug a profile carries (e.g. a "max" plan) without
 * silently degrading anyone to Free.
 */
const TIER_ALIASES: Record<string, TierSlug> = {
  starter: 'pro',
  team: 'growth',
  business: 'growth',
  scale: 'growth',
  max: 'growth',
  plus: 'growth',
  ent: 'enterprise',
  partner: 'agency',
  reseller: 'agency',
  msp: 'agency',
  rpo: 'agency',
};

/** Normalize any tier string (case/alias-insensitive) to a canonical slug. */
export function normalizeTier(tier: string | null | undefined): TierSlug {
  const t = (tier ?? '').trim().toLowerCase();
  if (t in ENTITLEMENTS) return t as TierSlug;
  if (t in TIER_ALIASES) return TIER_ALIASES[t];
  return 'free';
}

/** Resolve a tier string to its full entitlement grid. Never throws. */
export function getEntitlements(tier: string | null | undefined): Entitlements {
  return ENTITLEMENTS[normalizeTier(tier)];
}

/** Format a numeric cap for display — "Unlimited" for the sentinel. */
export function formatLimit(n: number): string {
  return n === UNLIMITED ? 'Unlimited' : n.toLocaleString('en-US');
}

/**
 * Percent of an allotment consumed, clamped to 0–100. An unlimited cap always
 * reads as a small, non-alarming fill so the meter looks healthy, not "full".
 */
export function usagePercent(used: number, cap: number): number {
  if (cap === UNLIMITED) return 4;
  if (cap <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((used / cap) * 100)));
}

/** True once usage crosses the "you should think about upgrading" line (85%). */
export function isNearingLimit(used: number, cap: number): boolean {
  if (cap === UNLIMITED) return false;
  return usagePercent(used, cap) >= 85;
}

/** Does this plan include a capability? */
export function hasFeature(ent: Entitlements, key: FeatureKey): boolean {
  return ent.features[key] === true;
}

/**
 * The lowest tier that unlocks a given feature — for a truthful "available on X"
 * label next to a locked capability. Returns null if no tier offers it.
 */
export function tierThatUnlocks(key: FeatureKey): Entitlements | null {
  const ladder: TierSlug[] = ['free', 'pro', 'growth', 'enterprise', 'agency'];
  for (const slug of ladder) {
    if (ENTITLEMENTS[slug].features[key]) return ENTITLEMENTS[slug];
  }
  return null;
}
