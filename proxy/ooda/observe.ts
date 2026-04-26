/**
 * Hound Shield OODA — Phase 1: Observe.
 *
 * Assembles the full Observation from an OODAContext + rate tracker.
 * Pure-ish function: only side effect is recording request rates (in-memory).
 */

import { recordOrgRequest, recordUserRequest } from "./rate-tracker.js";
import type { Observation, OODAContext } from "./types.js";

/** Builds a complete Observation from the request context. */
export function observe(ctx: OODAContext, now = Date.now()): Observation {
  const date = new Date(now);
  const hourOfDay = date.getHours();
  const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Record rates and get current counts (sliding window, in-memory)
  const orgReqPerMin = recordOrgRequest(ctx.org_id, now);
  const userReqPerMin = recordUserRequest(ctx.user_id, now);

  // Session request count: tracked via user rate as a proxy
  // (resets on proxy restart — acceptable for behavioral signals)
  const sessionRequestCount = userReqPerMin;

  return {
    request_id: ctx.request_id,
    org_id: ctx.org_id,
    user_id: ctx.user_id,
    session_id: ctx.session_id,
    messages: ctx.messages,
    timestamp: now,
    provider: ctx.provider,
    hour_of_day: hourOfDay,
    is_weekend: isWeekend,
    session_request_count: sessionRequestCount,
    org_requests_per_min: orgReqPerMin,
    user_requests_per_min: userReqPerMin,
  };
}
