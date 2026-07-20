/**
 * Hound Shield OODA — Loop orchestrator.
 *
 * Coordinates all 4 phases and the feedback step:
 *   Observe → Scan → Orient → Decide → planAction → Execute → Feedback
 *
 * The feedback step (updateBaselineStats) closes the loop so the next
 * cycle has a smarter baseline to orient against.
 */

import type { Response } from "express";
import fetch from "node-fetch";

import { scanMessages } from "../scanner.js";
import { logEvent } from "../storage.js";
import { enqueueEvent } from "../webhook.js";

import { observe } from "./observe.js";
import { orient } from "./orient.js";
import { decide } from "./decide.js";
import { planAction, redactMessages } from "./act.js";
import {
  getBaseline,
  getOrgPolicy,
  checkLockout,
  recordBlockEvent,
  updateBaselineStats,
} from "./baseline.js";
import { addQuarantineRow } from "./db.js";

import type {
  OODAContext,
  OODAResult,
  ActionResult,
} from "./types.js";

// ── Tool-call argument extraction ──────────────────────────────────────────

/**
 * Collects every tool_calls[].function.arguments string from an
 * OpenAI-format messages array. Arguments are prompt-derived text and must
 * be gated like any other content — on the request path (resent history)
 * and the response path (model output).
 */
export function toolCallArgText(
  messages: ReadonlyArray<{ role: string; content: unknown }>
): string {
  const args: string[] = [];
  for (const msg of messages) {
    const calls = (msg as {
      tool_calls?: Array<{ function?: { arguments?: unknown } }>;
    }).tool_calls;
    if (!Array.isArray(calls)) continue;
    for (const call of calls) {
      if (typeof call.function?.arguments === "string") {
        args.push(call.function.arguments);
      }
    }
  }
  return args.join("\n");
}

// ── Main OODA loop ─────────────────────────────────────────────────────────

export async function runOODALoop(
  ctx: OODAContext,
  res: Response
): Promise<OODAResult> {
  const loopStart = Date.now();

  // ── Phase 1: Observe ─────────────────────────────────────────────────────
  const observation = observe(ctx, loopStart);

  // ── Phase 2: Scan + Orient ───────────────────────────────────────────────
  // Tool-call arguments in resent history scan alongside message content.
  // ponytail: REDACT rewrites content only, not JSON args — BLOCK/QUARANTINE
  // still stop forwarding; add JSON-aware redaction if REDACT policy widens.
  const requestArgText = toolCallArgText(ctx.messages);
  const scanResult = scanMessages(
    requestArgText
      ? [...ctx.messages, { role: "tool", content: requestArgText }]
      : (ctx.messages as Array<{ role: string; content: unknown }>)
  );

  const orgBaseline = getBaseline(ctx.org_id, "org", loopStart);
  const orientation = orient(observation, scanResult, orgBaseline);

  // ── Phase 3: Decide ───────────────────────────────────────────────────────
  const orgPolicy = getOrgPolicy(ctx.org_id, loopStart);
  const orgLockedOut = checkLockout(ctx.org_id, "org", loopStart);
  const userLockedOut = checkLockout(ctx.user_id, "user", loopStart);

  const decision = decide(
    orientation,
    orgBaseline,
    orgPolicy,
    orgLockedOut,
    userLockedOut,
    observation.org_requests_per_min
  );

  // ── Phase 4: Plan ─────────────────────────────────────────────────────────
  const plan = planAction(decision, orientation, ctx.request_id);

  // ── Set response headers (always, before any branching) ───────────────────
  for (const [key, value] of Object.entries(plan.extra_headers)) {
    res.setHeader(key, value);
  }

  // ── Quarantine: record before executing ───────────────────────────────────
  if (plan.log_action === "QUARANTINED") {
    const topEntity = scanResult.entities[0];
    addQuarantineRow({
      request_id: ctx.request_id,
      org_id: ctx.org_id,
      user_id: ctx.user_id,
      pattern_name: topEntity?.pattern_name,
      risk_level: orientation.effective_risk,
      nist_control: topEntity?.nist_controls?.[0],
      scan_ms: scanResult.scan_ms,
      status: "pending",
    });
  }

  // ── Execute ───────────────────────────────────────────────────────────────
  let actionResult: ActionResult;

  if (!plan.should_forward) {
    // Block / Quarantine / Lockout — return error response
    res.status(plan.error_status ?? 403).json(plan.error_body);
    actionResult = {
      action_taken: plan.action,
      request_forwarded: false,
      response_status: plan.error_status ?? 403,
      response_body: plan.error_body,
      alert_sent: false,
    };
  } else {
    // Allow / Warn / Redact — forward to upstream
    const messagesToForward =
      plan.action === "REDACT"
        ? redactMessages(ctx.messages, decision.redaction_patterns)
        : ctx.messages;

    let upstreamStatus = 502;
    let upstreamBody: unknown = null;
    let forwardError: string | undefined;

    try {
      const upstreamRes = await fetch(ctx.upstream_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ctx.upstream_key}`,
        },
        body: JSON.stringify({
          messages: messagesToForward,
          stream: ctx.stream,
          ...ctx.rest,
        }),
      });

      upstreamStatus = upstreamRes.status;

      if (ctx.stream && upstreamRes.body) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        upstreamRes.body.pipe(res);
        upstreamBody = "[streaming]";
      } else {
        upstreamBody = await upstreamRes.json();
        res.status(upstreamStatus).json(upstreamBody);
      }
    } catch (err) {
      forwardError = err instanceof Error ? err.message : "Upstream unreachable";
      res
        .status(502)
        .json({ error: { message: forwardError, code: "UPSTREAM_ERROR" } });
      upstreamStatus = 502;
    }

    actionResult = {
      action_taken: plan.action,
      request_forwarded: !forwardError,
      response_status: upstreamStatus,
      response_body: upstreamBody,
      alert_sent: false,
      error: forwardError,
    };
  }

  // ── Log event (metadata only) ─────────────────────────────────────────────
  const topEntity = scanResult.entities[0];
  logEvent({
    request_id: ctx.request_id,
    org_id: ctx.org_id,
    action: plan.log_action as "ALLOWED" | "BLOCKED" | "QUARANTINED",
    risk_level: orientation.effective_risk,
    pattern_name: topEntity?.pattern_name,
    nist_control: topEntity?.nist_controls?.[0],
    scan_ms: Math.round(scanResult.scan_ms),
  });

  // Forward metadata to cloud dashboard (async, non-blocking)
  enqueueEvent({
    request_id: ctx.request_id,
    org_id: ctx.org_id,
    action: plan.log_action as "ALLOWED" | "BLOCKED" | "QUARANTINED",
    risk_level: orientation.effective_risk,
    pattern_name: topEntity?.pattern_name,
    nist_control: topEntity?.nist_controls?.[0],
    scan_ms: Math.round(scanResult.scan_ms),
  });

  // ── Block count + lockout side-effects ─────────────────────────────────────
  if (plan.increment_block_count) {
    recordBlockEvent(ctx.org_id, "org", orgPolicy, loopStart);
  }

  // ── Feedback: update behavioral baseline ─────────────────────────────────
  updateBaselineStats(
    ctx.org_id,
    "org",
    observation.hour_of_day,
    orientation.effective_risk,
    observation.org_requests_per_min,
    loopStart
  );
  // Also update user baseline asynchronously (fire-and-forget style via sync call)
  updateBaselineStats(
    ctx.user_id,
    "user",
    observation.hour_of_day,
    orientation.effective_risk,
    observation.user_requests_per_min,
    loopStart
  );

  const loopMs = Date.now() - loopStart;

  return {
    request_id: ctx.request_id,
    observation,
    orientation,
    decision,
    action: actionResult,
    loop_ms: loopMs,
  };
}
