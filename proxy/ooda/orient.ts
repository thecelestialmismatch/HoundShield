/**
 * Hound Shield OODA — Phase 2: Orient.
 *
 * Enriches the raw scan result with behavioral signals to compute an
 * effective_risk level. Risk can only go up — never down — in this phase.
 *
 * Delta contributions:
 *   velocity_spike        +0.30  (org req/min > 3× baseline avg/hr)
 *   anomalous_timing      +0.20  (hour not in baseline active_hours)
 *   first_seen_pattern    +0.20  (entities found but baseline is NONE)
 *   weekend_high_risk     +0.30  (weekend + effective risk HIGH/CRITICAL)
 *
 * Amplification:
 *   delta > 1.0  → upgrade 2 risk levels (max CRITICAL)
 *   delta > 0.5  → upgrade 1 risk level
 *   delta ≤ 0.5  → no change
 */

import type { ScanResult, RiskLevel } from "../patterns/index.js";
import type { PatternCategory } from "../patterns/index.js";
import type { Observation, Orientation, BehavioralBaseline } from "./types.js";

// ── Risk ordering ──────────────────────────────────────────────────────────

const RISK_LEVELS: RiskLevel[] = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

const RISK_INDEX: Record<RiskLevel, number> = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

/** Upgrade a risk level by `steps` (capped at CRITICAL). */
function upgradeRisk(base: RiskLevel, steps: number): RiskLevel {
  const idx = Math.min(RISK_INDEX[base] + steps, 4);
  return RISK_LEVELS[idx] as RiskLevel;
}

/** Amplify a raw risk level by a behavioral delta. */
export function amplifyRisk(base: RiskLevel, delta: number): RiskLevel {
  if (delta > 1.0) return upgradeRisk(base, 2);
  if (delta > 0.5) return upgradeRisk(base, 1);
  return base;
}

// ── Framework detection ────────────────────────────────────────────────────

type Framework = "CMMC" | "HIPAA" | "SOC2" | "ITAR";

const CATEGORY_TO_FRAMEWORK: Partial<Record<PatternCategory, Framework[]>> = {
  CUI: ["CMMC"],
  IP: ["CMMC", "ITAR"],
  PHI: ["HIPAA"],
  CREDENTIAL: ["SOC2"],
  PII: ["SOC2"],
};

export function detectFrameworks(
  entities: ScanResult["entities"]
): ReadonlyArray<Framework> {
  const found = new Set<Framework>();
  for (const entity of entities) {
    const frameworks = CATEGORY_TO_FRAMEWORK[entity.category] ?? [];
    for (const f of frameworks) found.add(f);
  }
  // ITAR requires explicit ITAR pattern match — not just IP category
  // (IP category covers both DoD IP and ITAR; ITAR pattern sets nist_control = "ITAR")
  const hasExplicitItar = entities.some(
    (e) => e.nist_controls?.includes("ITAR")
  );
  if (!hasExplicitItar) found.delete("ITAR");
  return Array.from(found);
}

// ── Velocity spike detection ────────────────────────────────────────────────

const VELOCITY_SPIKE_MULTIPLIER = 3;
const VELOCITY_MIN_BASELINE_RPH = 5; // only flag spike if baseline > 5 req/hr

/**
 * True if current org req/min × 60 is > 3× the baseline avg req/hr,
 * provided the baseline is established enough to be meaningful.
 */
function isVelocitySpike(
  orgReqPerMin: number,
  baseline: BehavioralBaseline
): boolean {
  if (baseline.avg_requests_per_hour < VELOCITY_MIN_BASELINE_RPH) return false;
  const currentRph = orgReqPerMin * 60;
  return currentRph > baseline.avg_requests_per_hour * VELOCITY_SPIKE_MULTIPLIER;
}

// ── Anomalous timing detection ─────────────────────────────────────────────

function isAnomalousTiming(
  hourOfDay: number,
  baseline: BehavioralBaseline
): boolean {
  // If baseline has < 5 samples, we don't have enough data to flag anomalies
  if (baseline.sample_count < 5) return false;
  if (baseline.active_hours.length === 0) return false;
  return !(baseline.active_hours as number[]).includes(hourOfDay);
}

// ── First-seen pattern detection ────────────────────────────────────────────

function isFirstSeenPattern(
  scanResult: ScanResult,
  baseline: BehavioralBaseline
): boolean {
  return (
    scanResult.entities.length > 0 &&
    baseline.typical_risk_level === "NONE" &&
    baseline.sample_count >= 3 // established baseline, but never saw risk before
  );
}

// ── Main orient function ───────────────────────────────────────────────────

export function orient(
  observation: Observation,
  scanResult: ScanResult,
  orgBaseline: BehavioralBaseline
): Orientation {
  const signals: string[] = [];
  let delta = 0;

  // Velocity spike
  const velocitySpike = isVelocitySpike(
    observation.org_requests_per_min,
    orgBaseline
  );
  if (velocitySpike) {
    delta += 0.3;
    signals.push("velocity_spike");
  }

  // Anomalous timing
  const anomalousTiming = isAnomalousTiming(
    observation.hour_of_day,
    orgBaseline
  );
  if (anomalousTiming) {
    delta += 0.2;
    signals.push("anomalous_timing");
  }

  // First seen pattern
  const firstSeenPattern = isFirstSeenPattern(scanResult, orgBaseline);
  if (firstSeenPattern) {
    delta += 0.2;
    signals.push("first_seen_pattern");
  }

  // Weekend + high risk
  const preAmplifiedRisk = amplifyRisk(scanResult.risk_level, delta);
  const isHighOnWeekend =
    observation.is_weekend &&
    (preAmplifiedRisk === "HIGH" || preAmplifiedRisk === "CRITICAL");
  if (isHighOnWeekend) {
    delta += 0.3;
    signals.push("weekend_high_risk");
  }

  const effectiveRisk = amplifyRisk(scanResult.risk_level, delta);
  const frameworks = detectFrameworks(scanResult.entities);

  return {
    scan_result: scanResult,
    behavioral_risk_delta: delta,
    is_anomalous_timing: anomalousTiming,
    is_velocity_spike: velocitySpike,
    is_first_seen_pattern: firstSeenPattern,
    effective_risk: effectiveRisk,
    threat_signals: signals,
    frameworks,
  };
}
