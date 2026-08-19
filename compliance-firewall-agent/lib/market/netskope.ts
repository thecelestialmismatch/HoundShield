/**
 * Single source of truth for the Netskope market statistics used in copy.
 *
 * Why this file exists — the same doctrine as lib/detection/engines.ts, applied
 * to the market instead of the product: a marketing claim must carry its own
 * source, and it must be impossible to restate it without its denominator.
 *
 * The failure this prevents actually happened. Two Netskope figures were in
 * circulation across eight files — 89% and 81% — with no scope attached to
 * either, so they read as a contradiction on our own site:
 *
 *   app/page.tsx + app/hipaa/page.tsx  ->  "89%"
 *   app/answers/_answers.ts + blog     ->  "81%"
 *
 * They are not a contradiction. They are different denominators from the same
 * report, and BOTH are correct:
 *
 *   81%  of ALL healthcare data policy violations involve regulated data
 *   89%  of healthcare data policy violations TIED TO GENERATIVE AI do
 *
 * A third figure was simply wrong. "43% of healthcare staff use personal genAI
 * accounts at work" appeared in the homepage chat context, the Brain AI
 * knowledge graph, and — worst — the cold outreach email. 43% is Netskope's
 * figure for organisations EXPERIMENTING WITH RUNNING GENAI INFRASTRUCTURE
 * LOCALLY. It has nothing to do with personal accounts. The real personal-
 * account numbers are PERSONAL_GENAI_ACCOUNTS and PERSONAL_ACCOUNT_SENSITIVE.
 *
 * Sending a prospect a statistic that misstates its own source is the fastest
 * way to lose a compliance buyer, who verifies everything by profession. Hence
 * this module: every figure below carries its scope, its source and its date,
 * and `stat()` refuses to render a number without them.
 *
 * Locked by lib/market/__tests__/netskope.test.ts.
 */

/** A market statistic that cannot be quoted without its denominator. */
export interface MarketStat {
  /** The figure exactly as it should appear in copy, e.g. "89%". */
  readonly value: string;
  /** What the figure is a share OF. Never omit this in copy. */
  readonly scope: string;
  /** Publication the figure comes from. */
  readonly source: string;
  /** Canonical URL for the publication. */
  readonly url: string;
  /** Publication date, ISO. */
  readonly published: string;
}

const NETSKOPE_HEALTHCARE_2025 = {
  source: 'Netskope Threat Labs Report: Healthcare 2025',
  url: 'https://www.netskope.com/resources/threat-labs-reports/threat-labs-report-healthcare-2025',
  published: '2025-05',
} as const;

/**
 * 89% — regulated data as a share of healthcare data policy violations tied to
 * GENERATIVE AI specifically. This is the headline stat for the AI-risk pitch,
 * because it is the genAI-scoped one. Cross-industry comparison:
 * {@link CROSS_INDUSTRY_GENAI}.
 */
export const REGULATED_SHARE_GENAI: MarketStat = {
  value: '89%',
  scope: 'of healthcare data policy violations tied to generative AI involve regulated data',
  ...NETSKOPE_HEALTHCARE_2025,
};

/**
 * 81% — regulated data as a share of ALL healthcare data policy violations,
 * across every channel, not just genAI. The remaining 19% is passwords, source
 * code and intellectual property. Use this when the claim is about healthcare
 * data handling generally; use {@link REGULATED_SHARE_GENAI} when it is about AI.
 */
export const REGULATED_SHARE_ALL: MarketStat = {
  value: '81%',
  scope: 'of all healthcare data policy violations involve regulated data',
  ...NETSKOPE_HEALTHCARE_2025,
};

/** 31% — the same genAI measure as {@link REGULATED_SHARE_GENAI}, across all industries. */
export const CROSS_INDUSTRY_GENAI: MarketStat = {
  value: '31%',
  scope: 'of data policy violations tied to generative AI involve regulated data, across all industries',
  ...NETSKOPE_HEALTHCARE_2025,
};

/**
 * 71% — healthcare genAI users using PERSONAL genAI accounts, down from 87% the
 * prior year. This is the figure the copy meant when it said "43%".
 */
export const PERSONAL_GENAI_ACCOUNTS: MarketStat = {
  value: '71%',
  scope: 'of healthcare genAI users use personal genAI accounts (down from 87% a year earlier)',
  ...NETSKOPE_HEALTHCARE_2025,
};

/**
 * More than two-thirds — healthcare genAI users who send SENSITIVE DATA through
 * a personal AI account at work. The sharpest number for the Rachel pitch:
 * personal accounts are precisely the ones a security team cannot see.
 */
export const PERSONAL_ACCOUNT_SENSITIVE: MarketStat = {
  value: 'more than two-thirds',
  scope: 'of healthcare genAI users send sensitive data through a personal AI account at work',
  ...NETSKOPE_HEALTHCARE_2025,
};

/**
 * 43% — what this number ACTUALLY measures. Kept here, correctly scoped, so the
 * misuse it replaced cannot quietly return: anyone reaching for "43%" now finds
 * the real denominator attached to it.
 */
export const LOCAL_GENAI_INFRA: MarketStat = {
  value: '43%',
  scope: 'of healthcare organisations are experimenting with running some genAI infrastructure locally',
  ...NETSKOPE_HEALTHCARE_2025,
};

/** Every stat in this module, for exhaustive tests and audit rendering. */
export const ALL_MARKET_STATS: readonly MarketStat[] = [
  REGULATED_SHARE_GENAI,
  REGULATED_SHARE_ALL,
  CROSS_INDUSTRY_GENAI,
  PERSONAL_GENAI_ACCOUNTS,
  PERSONAL_ACCOUNT_SENSITIVE,
  LOCAL_GENAI_INFRA,
];

/**
 * Render a stat as a single sentence that carries its own denominator and
 * source. Use this anywhere a figure is stated in prose — email, chat context,
 * knowledge base — so a number can never travel without its scope.
 */
export function stat(s: MarketStat): string {
  return `${s.value} ${s.scope} (${s.source}, ${s.published})`;
}

/**
 * Render a stat without the source suffix, for UI where attribution is shown
 * separately (a tile with its own caption). Still carries the scope.
 */
export function statPlain(s: MarketStat): string {
  return `${s.value} ${s.scope}`;
}
