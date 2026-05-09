/**
 * Hound Shield OODA — Phase 4: Act (pure planning layer).
 *
 * No I/O. Takes a Decision + Orientation and returns an ActionPlan
 * describing exactly what the loop executor should do.
 *
 * Also exports redactMessages() — substitutes matched PII with
 * [REDACTED-{CATEGORY}] placeholders before forwarding.
 */

import type { Decision, Orientation, ActionPlan, LogAction } from "./types.js";
import { ALL_PATTERNS } from "../patterns/index.js";

// ── Redaction ─────────────────────────────────────────────────────────────

/**
 * Replaces all regex matches for the given pattern names with
 * [REDACTED-{CATEGORY}] in every message's content.
 *
 * Only operates on string content — array content (multi-modal) is left intact
 * since image/audio content doesn't contain PII in the same form.
 */
export function redactMessages(
  messages: ReadonlyArray<{ role: string; content: unknown }>,
  patternNames: ReadonlyArray<string>
): Array<{ role: string; content: unknown }> {
  if (patternNames.length === 0) return messages.map((m) => ({ ...m }));

  // Build a map of patternName → { regex, category } for O(1) lookup
  const patternsToApply = ALL_PATTERNS.filter((p) =>
    patternNames.includes(p.name)
  );

  if (patternsToApply.length === 0) return messages.map((m) => ({ ...m }));

  return messages.map((msg) => {
    if (typeof msg.content !== "string") return { ...msg };

    let redacted = msg.content;
    for (const pattern of patternsToApply) {
      const re = new RegExp(pattern.regex.source, pattern.regex.flags + (pattern.regex.flags.includes("g") ? "" : "g"));
      redacted = redacted.replace(re, `[REDACTED-${pattern.category}]`);
    }

    return { role: msg.role, content: redacted };
  });
}

// ── Error response bodies ──────────────────────────────────────────────────

function blockBody(
  reason: string,
  action: string,
  requestId: string
): unknown {
  return {
    error: {
      message: reason,
      code: `HOUNDSHIELD_${action}`,
      request_id: requestId,
    },
  };
}

function warnBody(reason: string, requestId: string): unknown {
  return {
    error: {
      message: reason,
      code: "HOUNDSHIELD_WARN",
      request_id: requestId,
      warning: true,
    },
  };
}

// ── Action → LogAction mapping ─────────────────────────────────────────────

const ACTION_LOG_MAP: Record<string, LogAction> = {
  ALLOW: "ALLOWED",
  WARN: "WARNED",
  REDACT: "REDACTED",
  QUARANTINE: "QUARANTINED",
  BLOCK: "BLOCKED",
  LOCKOUT: "LOCKED_OUT",
};

// ── planAction ─────────────────────────────────────────────────────────────

export function planAction(
  decision: Decision,
  orientation: Orientation,
  requestId: string
): ActionPlan {
  const { action } = decision;
  const topEntity = orientation.scan_result.entities[0];
  const patternName = topEntity?.pattern_name ?? "unknown";

  const baseHeaders: Record<string, string> = {
    "X-HoundShield-Action": action,
    "X-HoundShield-Risk-Level": orientation.effective_risk,
    "X-HoundShield-Request-Id": requestId,
  };

  if (orientation.threat_signals.length > 0) {
    baseHeaders["X-HoundShield-Signals"] = orientation.threat_signals.join(",");
  }
  if (orientation.frameworks.length > 0) {
    baseHeaders["X-HoundShield-Frameworks"] = orientation.frameworks.join(",");
  }

  switch (action) {
    case "ALLOW":
      return {
        action,
        should_forward: true,
        extra_headers: baseHeaders,
        log_action: "ALLOWED",
        alert_manager: false,
        increment_block_count: false,
        apply_lockout: false,
      };

    case "WARN":
      // WARN still forwards — it's a notification, not a block.
      // The warn body is added as a response header, not blocking the request.
      return {
        action,
        should_forward: true,
        extra_headers: {
          ...baseHeaders,
          "X-HoundShield-Warning": decision.reason.slice(0, 200),
        },
        log_action: "WARNED",
        alert_manager: decision.alert_manager,
        increment_block_count: false,
        apply_lockout: false,
      };

    case "REDACT":
      // Forward with redacted messages — increment_block_count stays false
      return {
        action,
        should_forward: true,
        extra_headers: {
          ...baseHeaders,
          "X-HoundShield-Redacted-Patterns": patternName,
        },
        log_action: "REDACTED",
        alert_manager: false,
        increment_block_count: false,
        apply_lockout: false,
      };

    case "QUARANTINE":
      // Block the request but hold for review (do not forward)
      return {
        action,
        should_forward: false,
        error_status: 403,
        error_body: blockBody(decision.reason, "QUARANTINED", requestId),
        extra_headers: baseHeaders,
        log_action: "QUARANTINED",
        alert_manager: decision.alert_manager,
        increment_block_count: false, // quarantine is not a block for lockout purposes
        apply_lockout: false,
      };

    case "BLOCK":
      return {
        action,
        should_forward: false,
        error_status: 403,
        error_body: blockBody(decision.reason, "BLOCKED", requestId),
        extra_headers: baseHeaders,
        log_action: "BLOCKED",
        alert_manager: decision.alert_manager,
        increment_block_count: true,
        apply_lockout: false,
      };

    case "LOCKOUT":
      return {
        action,
        should_forward: false,
        error_status: 429,
        error_body: blockBody(decision.reason, "LOCKED_OUT", requestId),
        extra_headers: baseHeaders,
        log_action: "LOCKED_OUT",
        alert_manager: true,
        increment_block_count: false,
        apply_lockout: false, // lockout already applied when block_count was incremented
      };

    default: {
      const _exhaustive: never = action;
      void _exhaustive;
      return {
        action: "BLOCK",
        should_forward: false,
        error_status: 500,
        error_body: { error: { message: "Unknown action", code: "INTERNAL_ERROR" } },
        extra_headers: baseHeaders,
        log_action: "BLOCKED",
        alert_manager: false,
        increment_block_count: false,
        apply_lockout: false,
      };
    }
  }
}

export { ACTION_LOG_MAP, warnBody };
