/**
 * Hound Shield OODA — behavioral baseline cache.
 *
 * In-memory cache (60s TTL) backed by SQLite.
 * Tracks per-org and per-user behavior: request rate, typical risk,
 * active hours, block count, lockout status.
 *
 * The feedback loop: every completed request updates the baseline,
 * so Orient's risk amplification improves with each cycle.
 */

import {
  getBaselineRow,
  upsertBaselineRow,
  incrementBlockCountRow,
  setLockoutUntilRow,
  getOrgPolicyRow,
} from "./db.js";
import { DEFAULT_POLICY } from "./types.js";
import type { BehavioralBaseline, OrgPolicy } from "./types.js";
import type { RiskLevel } from "../patterns/index.js";

// ── Cache ──────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 60_000; // 60-second TTL

interface CacheEntry {
  baseline: BehavioralBaseline;
  loaded_at: number;
}

const baselineCache = new Map<string, CacheEntry>();
const policyCache = new Map<string, { policy: OrgPolicy; loaded_at: number }>();

// ── Defaults ───────────────────────────────────────────────────────────────

function emptyBaseline(
  entityId: string,
  entityType: "org" | "user"
): BehavioralBaseline {
  return {
    entity_id: entityId,
    entity_type: entityType,
    avg_requests_per_hour: 0,
    typical_risk_level: "NONE",
    active_hours: [],
    block_count: 0,
    lockout_until: null,
    last_updated: Date.now(),
    sample_count: 0,
  };
}

// ── Cache helpers ──────────────────────────────────────────────────────────

function getCached(entityId: string, now: number): BehavioralBaseline | null {
  const entry = baselineCache.get(entityId);
  if (!entry) return null;
  if (now - entry.loaded_at > CACHE_TTL_MS) {
    baselineCache.delete(entityId);
    return null;
  }
  return entry.baseline;
}

function setCached(baseline: BehavioralBaseline, now: number): void {
  baselineCache.set(baseline.entity_id, { baseline, loaded_at: now });
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Returns the behavioral baseline for an entity.
 * Cache-first; falls back to SQLite; creates empty record if not found.
 */
export function getBaseline(
  entityId: string,
  entityType: "org" | "user",
  now = Date.now()
): BehavioralBaseline {
  const cached = getCached(entityId, now);
  if (cached) return cached;

  const row = getBaselineRow(entityId);
  const baseline = row ?? emptyBaseline(entityId, entityType);

  if (!row) {
    // Persist the new empty baseline so atomic increments work
    upsertBaselineRow(baseline);
  }

  setCached(baseline, now);
  return baseline;
}

/**
 * Returns the org policy (60s cache), falling back to DEFAULT_POLICY.
 */
export function getOrgPolicy(orgId: string, now = Date.now()): OrgPolicy {
  const cached = policyCache.get(orgId);
  if (cached && now - cached.loaded_at < CACHE_TTL_MS) return cached.policy;

  const row = getOrgPolicyRow(orgId);
  const policy = row ?? { ...DEFAULT_POLICY, org_id: orgId };
  policyCache.set(orgId, { policy, loaded_at: now });
  return policy;
}

/**
 * Is this entity currently locked out?
 * Uses cached baseline; re-checks lockout_until against now.
 */
export function checkLockout(
  entityId: string,
  entityType: "org" | "user",
  now = Date.now()
): boolean {
  const baseline = getBaseline(entityId, entityType, now);
  return baseline.lockout_until !== null && baseline.lockout_until > now;
}

/**
 * Called after a BLOCK decision.
 * Atomically increments block_count in DB, then checks if lockout threshold
 * is reached — if so, sets lockout_until.
 * Invalidates cache so next request gets fresh data.
 */
export function recordBlockEvent(
  entityId: string,
  entityType: "org" | "user",
  policy: OrgPolicy,
  now = Date.now()
): void {
  // Atomic increment in DB (safe under concurrent requests)
  incrementBlockCountRow(entityId);
  baselineCache.delete(entityId); // invalidate cache

  // Re-read fresh block_count from DB
  const fresh = getBaselineRow(entityId);
  if (!fresh) return;

  const newBlockCount = fresh.block_count;

  if (newBlockCount >= policy.lockout_after_n_blocks) {
    const lockoutUntil = now + policy.lockout_duration_minutes * 60_000;
    setLockoutUntilRow(entityId, lockoutUntil);
    baselineCache.delete(entityId); // invalidate again
  }
}

/** RISK_ORDER for computing running max risk level */
const RISK_ORDER: Record<RiskLevel, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  NONE: 0,
};

const RISK_BY_ORDER: RiskLevel[] = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

/**
 * Updates baseline statistics after every request (feedback loop).
 * Uses exponential moving average for request rate (α=0.1).
 * Tracks active hours as the union of recent active hours.
 */
export function updateBaselineStats(
  entityId: string,
  entityType: "org" | "user",
  hourOfDay: number,
  riskLevel: RiskLevel,
  requestsPerMin: number,
  now = Date.now()
): void {
  const existing = getBaselineRow(entityId) ?? emptyBaseline(entityId, entityType);
  const α = 0.1; // EMA smoothing factor

  // EMA of requests per hour (convert req/min to req/hr)
  const reqPerHr = requestsPerMin * 60;
  const newAvgReqPerHour =
    existing.sample_count === 0
      ? reqPerHr
      : existing.avg_requests_per_hour * (1 - α) + reqPerHr * α;

  // Maintain running max typical risk level
  const currentRiskOrder = RISK_ORDER[existing.typical_risk_level];
  const incomingRiskOrder = RISK_ORDER[riskLevel];
  const newTypicalRisk: RiskLevel =
    incomingRiskOrder > currentRiskOrder
      ? riskLevel
      : (RISK_BY_ORDER[currentRiskOrder] as RiskLevel);

  // Active hours: union of observed hours (cap at 24 unique values)
  const currentHours = new Set(existing.active_hours as number[]);
  currentHours.add(hourOfDay);
  const newActiveHours = Array.from(currentHours).sort((a, b) => a - b);

  const updated: BehavioralBaseline = {
    ...existing,
    avg_requests_per_hour: newAvgReqPerHour,
    typical_risk_level: newTypicalRisk,
    active_hours: newActiveHours,
    last_updated: now,
    sample_count: existing.sample_count + 1,
  };

  upsertBaselineRow(updated);
  setCached(updated, now);
}

/** Clear all caches (for tests). */
export function resetBaselineCache(): void {
  baselineCache.clear();
  policyCache.clear();
}
