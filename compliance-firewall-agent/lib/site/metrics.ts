/**
 * Truthful, verifiable product metrics — the single source of truth for any
 * stat shown in chrome (nav, footer, badges).
 *
 * Why this exists: the nav used to show a fabricated, client-incrementing
 * "14,672 intercepted" counter — and a different "14,312 blocked" number in the
 * other nav. That violates the project's first rule of credibility ("buyers
 * verify everything; publish no fictional metrics") and looked inconsistent.
 *
 * Every value here is a real, defensible product fact. If a number can't be
 * substantiated, it does not belong in this file.
 */

export const PRODUCT_METRICS = {
  /** Detection engines in the classifier — count them in lib/classifier. */
  detectionEngines: 16,
  /** Median local scan latency target, enforced by the proxy benchmark. */
  scanLatencyMs: 10,
  /** NIST 800-171 Rev 2 controls covered by SPRS scoring. */
  nistControls: 110,
} as const;

/**
 * The compact, always-true badge shown in the top nav in place of the old fake
 * live counter. One string, one source — identical in every nav.
 */
export const NAV_TRUST_BADGE = `${PRODUCT_METRICS.detectionEngines} engines · <${PRODUCT_METRICS.scanLatencyMs}ms scan`;
