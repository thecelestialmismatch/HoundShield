/**
 * Hound Shield OODA Loop — type definitions.
 *
 * Observe → Orient → Decide → Act (with feedback to Observe)
 */

import type { ScanResult, RiskLevel } from "../patterns/index.js";

// ── Core OODA action vocabulary ────────────────────────────────────────────

export type OODAAction =
  | "ALLOW"
  | "WARN"
  | "REDACT"
  | "QUARANTINE"
  | "BLOCK"
  | "LOCKOUT";

// ── Phase 1: Observe ───────────────────────────────────────────────────────

/** Full request context assembled before any analysis. */
export interface Observation {
  request_id: string;
  org_id: string;
  user_id: string;
  session_id: string;
  messages: ReadonlyArray<{ role: string; content: unknown }>;
  timestamp: number; // Unix ms
  provider: string;
  hour_of_day: number; // 0-23 local server time
  is_weekend: boolean;
  session_request_count: number; // requests in this session so far
  org_requests_per_min: number;
  user_requests_per_min: number;
}

// ── Phase 2: Orient ────────────────────────────────────────────────────────

/** Scan enriched with behavioral context. */
export interface Orientation {
  scan_result: ScanResult;
  behavioral_risk_delta: number; // 0.0–1.0+ additive
  is_anomalous_timing: boolean;
  is_velocity_spike: boolean;
  is_first_seen_pattern: boolean;
  effective_risk: RiskLevel; // amplified risk level
  threat_signals: string[]; // human-readable signal names
  frameworks: ReadonlyArray<"CMMC" | "HIPAA" | "SOC2" | "ITAR">;
}

// ── Phase 3: Decide ────────────────────────────────────────────────────────

export interface Decision {
  action: OODAAction;
  reason: string;
  policy_id: string; // which policy rule matched
  alert_manager: boolean;
  redaction_patterns: ReadonlyArray<string>; // pattern names to redact
  reputation_delta: number; // -1 (good), 0 (neutral), +1 (bad)
}

// ── Phase 4: Act ───────────────────────────────────────────────────────────

export interface ActionResult {
  action_taken: OODAAction;
  request_forwarded: boolean;
  response_status: number;
  response_body?: unknown;
  alert_sent: boolean;
  error?: string;
}

// ── Complete loop result ────────────────────────────────────────────────────

export interface OODAResult {
  request_id: string;
  observation: Observation;
  orientation: Orientation;
  decision: Decision;
  action: ActionResult;
  loop_ms: number;
}

// ── Behavioral baseline ────────────────────────────────────────────────────

export interface BehavioralBaseline {
  entity_id: string;
  entity_type: "org" | "user";
  avg_requests_per_hour: number;
  typical_risk_level: RiskLevel;
  active_hours: ReadonlyArray<number>; // 0-23
  block_count: number;
  lockout_until: number | null; // Unix ms, null = not locked
  last_updated: number; // Unix ms
  sample_count: number;
}

// ── Org policy ─────────────────────────────────────────────────────────────

export interface OrgPolicy {
  org_id: string;
  warn_before_block: boolean;
  redact_low_risk: boolean;
  max_requests_per_minute: number;
  lockout_after_n_blocks: number;
  lockout_duration_minutes: number;
}

export const DEFAULT_POLICY: OrgPolicy = {
  org_id: "default",
  warn_before_block: true,
  redact_low_risk: false,
  max_requests_per_minute: 60,
  lockout_after_n_blocks: 5,
  lockout_duration_minutes: 60,
};

// ── Loop input context ──────────────────────────────────────────────────────

export interface OODAContext {
  request_id: string;
  org_id: string;
  user_id: string;
  session_id: string;
  messages: Array<{ role: string; content: unknown }>;
  provider: string;
  upstream_key: string;
  upstream_url: string;
  stream: boolean | undefined;
  rest: Record<string, unknown>;
}

// ── Action plan (pure, no I/O) ─────────────────────────────────────────────

export type LogAction =
  | "ALLOWED"
  | "BLOCKED"
  | "QUARANTINED"
  | "WARNED"
  | "REDACTED"
  | "LOCKED_OUT";

export interface ActionPlan {
  action: OODAAction;
  should_forward: boolean;
  error_status?: number;
  error_body?: unknown;
  extra_headers: Record<string, string>;
  log_action: LogAction;
  alert_manager: boolean;
  increment_block_count: boolean;
  apply_lockout: boolean;
}
