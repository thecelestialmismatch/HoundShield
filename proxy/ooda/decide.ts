/**
 * Hound Shield OODA — Phase 3: Decide.
 *
 * Dynamic policy engine. Evaluates orientation against org policy and returns
 * a Decision with one of 6 graduated actions.
 *
 * Priority order (first match wins):
 *   1. Locked out              → LOCKOUT
 *   2. Rate limit exceeded     → BLOCK
 *   3. effective_risk CRITICAL → BLOCK  (always — CMMC AC.L2-3.1.3 compliance)
 *   4. effective_risk HIGH:
 *      warn_before_block + first block → WARN
 *      else                            → BLOCK
 *   5. effective_risk MEDIUM:
 *      redact_low_risk + PII-only      → REDACT
 *      else                            → QUARANTINE
 *   6. effective_risk LOW:
 *      redact_low_risk                 → REDACT
 *      else                            → QUARANTINE
 *   7. effective_risk NONE:
 *      velocity_spike + anomalous_timing → WARN
 *      else                              → ALLOW
 *
 * CMMC constraint: REDACT is forbidden for CRITICAL/HIGH CUI patterns.
 * A sanitized "TOP SECRET" prompt forwarded to the LLM is still an exfiltration
 * attempt. We only REDACT LOW/MEDIUM PII-only content.
 */

import type { Orientation, Decision, OrgPolicy, BehavioralBaseline } from "./types.js";
import type { PatternCategory } from "../patterns/index.js";

// ── PII-only check ─────────────────────────────────────────────────────────

const REDACTABLE_CATEGORIES: Set<PatternCategory> = new Set(["PII"]);

/**
 * True if every detected entity is PII category with LOW or MEDIUM risk.
 * Used to gate REDACT — we never redact CUI, PHI, CREDENTIAL, or IP.
 */
function isPIIOnly(orientation: Orientation): boolean {
  const { entities } = orientation.scan_result;
  if (entities.length === 0) return false;
  return entities.every(
    (e) =>
      REDACTABLE_CATEGORIES.has(e.category) &&
      (e.risk_level === "LOW" || e.risk_level === "MEDIUM")
  );
}

// ── Decision matrix ────────────────────────────────────────────────────────

export function decide(
  orientation: Orientation,
  orgBaseline: BehavioralBaseline,
  orgPolicy: OrgPolicy,
  orgLockedOut: boolean,
  userLockedOut: boolean,
  orgReqPerMin: number
): Decision {
  const { effective_risk, is_velocity_spike, is_anomalous_timing, scan_result } = orientation;
  const topEntity = scan_result.entities[0];
  const patternName = topEntity?.pattern_name ?? "unknown";
  const nistControl = topEntity?.nist_controls?.[0] ?? "";
  const blockCount = orgBaseline.block_count;

  // ── 1. Lockout ────────────────────────────────────────────────────────────
  if (orgLockedOut || userLockedOut) {
    return {
      action: "LOCKOUT",
      reason: "Organization or user is locked out due to repeated policy violations",
      policy_id: "lockout",
      alert_manager: true,
      redaction_patterns: [],
      reputation_delta: 1,
    };
  }

  // ── 2. Rate limit ──────────────────────────────────────────────────────────
  if (orgReqPerMin > orgPolicy.max_requests_per_minute) {
    return {
      action: "BLOCK",
      reason: `Rate limit exceeded: ${orgReqPerMin} req/min (limit: ${orgPolicy.max_requests_per_minute})`,
      policy_id: "rate_limit",
      alert_manager: false,
      redaction_patterns: [],
      reputation_delta: 0,
    };
  }

  // ── 3. CRITICAL ───────────────────────────────────────────────────────────
  if (effective_risk === "CRITICAL") {
    return {
      action: "BLOCK",
      reason: `Critical compliance violation detected: ${patternName}${nistControl ? ` (${nistControl})` : ""}`,
      policy_id: "critical_block",
      alert_manager: true,
      redaction_patterns: [],
      reputation_delta: 1,
    };
  }

  // ── 4. HIGH ───────────────────────────────────────────────────────────────
  if (effective_risk === "HIGH") {
    if (orgPolicy.warn_before_block && blockCount === 0) {
      return {
        action: "WARN",
        reason: `High-risk content detected: ${patternName}. Further violations will be blocked.`,
        policy_id: "high_warn_first",
        alert_manager: true,
        redaction_patterns: [],
        reputation_delta: 1,
      };
    }
    return {
      action: "BLOCK",
      reason: `High-risk content blocked: ${patternName}${nistControl ? ` (${nistControl})` : ""}`,
      policy_id: "high_block",
      alert_manager: true,
      redaction_patterns: [],
      reputation_delta: 1,
    };
  }

  // ── 5. MEDIUM ─────────────────────────────────────────────────────────────
  if (effective_risk === "MEDIUM") {
    if (orgPolicy.redact_low_risk && isPIIOnly(orientation)) {
      return {
        action: "REDACT",
        reason: `Medium-risk PII redacted before forwarding: ${patternName}`,
        policy_id: "medium_redact_pii",
        alert_manager: false,
        redaction_patterns: scan_result.entities.map((e) => e.pattern_name),
        reputation_delta: 0,
      };
    }
    return {
      action: "QUARANTINE",
      reason: `Medium-risk content held for review: ${patternName}`,
      policy_id: "medium_quarantine",
      alert_manager: true,
      redaction_patterns: [],
      reputation_delta: 0,
    };
  }

  // ── 6. LOW ────────────────────────────────────────────────────────────────
  if (effective_risk === "LOW") {
    if (orgPolicy.redact_low_risk && isPIIOnly(orientation)) {
      return {
        action: "REDACT",
        reason: `Low-risk PII redacted before forwarding: ${patternName}`,
        policy_id: "low_redact_pii",
        alert_manager: false,
        redaction_patterns: scan_result.entities.map((e) => e.pattern_name),
        reputation_delta: 0,
      };
    }
    return {
      action: "QUARANTINE",
      reason: `Low-risk content held for review: ${patternName}`,
      policy_id: "low_quarantine",
      alert_manager: false,
      redaction_patterns: [],
      reputation_delta: 0,
    };
  }

  // ── 7. NONE ───────────────────────────────────────────────────────────────
  if (is_velocity_spike && is_anomalous_timing) {
    return {
      action: "WARN",
      reason: "Anomalous request pattern detected: velocity spike during unusual hours",
      policy_id: "behavioral_warn",
      alert_manager: false,
      redaction_patterns: [],
      reputation_delta: 0,
    };
  }

  return {
    action: "ALLOW",
    reason: "No policy violations detected",
    policy_id: "allow",
    alert_manager: false,
    redaction_patterns: [],
    reputation_delta: -1,
  };
}
