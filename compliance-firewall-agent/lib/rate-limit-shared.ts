import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { createRateLimiter } from "@/lib/rate-limit";

/**
 * Shared-state rate limiting for the routes that cost real money per call.
 *
 * The two pre-existing limiters (middleware.ts, lib/rate-limit.ts) keep their
 * counters in a per-process Map. On Vercel Fluid Compute every instance has its
 * own Map, so the real ceiling is (limit x live instances) and it resets on each
 * cold start. For a route that bills OpenRouter per request that is a spend
 * exposure, not a nitpick — one signed-up free-tier account can loop a Brain AI
 * call and the counter never catches up.
 *
 * This module counts in Postgres instead, where the count is shared by every
 * instance (see supabase/migrations/028_rate_limit_buckets.sql).
 *
 * Availability posture — deliberately fail-OPEN to a local limiter:
 *   `/api/v1/chat/completions` is the shipped product. If Postgres is briefly
 *   unreachable, failing closed would return 429 to paying customers over an
 *   infrastructure blip. Instead we fall back to the in-process limiter: still
 *   bounded per instance (so a flood is slowed, not ignored), and the decision
 *   is flagged `degraded: true` so callers can log it. Availability of a paid
 *   endpoint outranks perfect accounting during an outage.
 */

export interface RateLimitOptions {
  /** Max requests permitted per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Epoch milliseconds at which the current window ends. */
  resetAt: number;
  /** True when the shared store was unavailable and a local fallback decided. */
  degraded: boolean;
}

/**
 * Ceilings for the routes that spend money per call.
 *
 * Window matches middleware.ts (60s) so the two layers describe the same unit.
 * These are deliberately generous for a human and ruinous for a loop: 20/min is
 * a question every three seconds, sustained, which no interactive user reaches.
 */
export const LLM_RATE_LIMITS = {
  /** Signed-in LLM calls that bill OpenRouter (Brain AI, agent execute). */
  authenticated: { limit: 20, windowMs: 60_000 },
  /** The OpenAI-compatible product endpoint — higher headroom for real client traffic. */
  gateway: { limit: 120, windowMs: 60_000 },
  /** Unauthenticated reads served from the local BM25 graph — CPU only, no spend. */
  publicRead: { limit: 30, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitOptions>;

/** First hop of x-forwarded-for, matching middleware.ts's key derivation. */
export function clientIp(req: { headers: { get(name: string): string | null } }): string {
  const forwarded = req.headers.get("x-forwarded-for") ?? "";
  return forwarded.split(",")[0]?.trim() || "unknown";
}

/** Local fallbacks, one per bucket namespace. Only used when Postgres is unreachable. */
const localFallbacks = new Map<string, ReturnType<typeof createRateLimiter>>();

function localDecision(
  namespace: string,
  identifier: string,
  options: RateLimitOptions,
): RateLimitDecision {
  let limiter = localFallbacks.get(namespace);
  if (!limiter) {
    limiter = createRateLimiter(namespace, {
      limit: options.limit,
      windowMs: options.windowMs,
    });
    localFallbacks.set(namespace, limiter);
  }
  const result = limiter(identifier);
  return {
    allowed: result.success,
    limit: result.limit,
    remaining: result.remaining,
    resetAt: result.reset,
    degraded: true,
  };
}

/**
 * Turn a caller identity into a value safe to store.
 *
 * A user id is already an opaque uuid and is stored as-is. A raw IP is personal
 * data, so it is hashed before it can reach the database — the bucket table must
 * never hold an address. Truncated to 32 hex chars: still far beyond collision
 * risk at this cardinality, and keeps keys short.
 */
export function identifierFor(input: { userId?: string | null; ip?: string | null }): string {
  if (input.userId) return `u:${input.userId}`;
  const ip = input.ip?.trim();
  if (!ip) return "anon";
  return `i:${createHash("sha256").update(ip).digest("hex").slice(0, 32)}`;
}

/**
 * Count one request against `<namespace>:<identifier>` and return the decision.
 *
 * `namespace` should identify the route, so that flooding one endpoint cannot
 * consume another endpoint's budget.
 */
export async function consumeRateLimit(
  namespace: string,
  identifier: string,
  options: RateLimitOptions,
): Promise<RateLimitDecision> {
  if (!isSupabaseConfigured()) {
    // Local dev / demo mode — no shared store exists to consult.
    return localDecision(namespace, identifier, options);
  }

  const windowSeconds = Math.max(1, Math.ceil(options.windowMs / 1_000));

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("consume_rate_limit", {
      p_key: `${namespace}:${identifier}`,
      p_max: options.limit,
      p_window_seconds: windowSeconds,
    });

    if (error) throw new Error(error.message);

    // The RPC returns a single-row set.
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row.allowed !== "boolean") {
      throw new Error("consume_rate_limit returned no decision");
    }

    return {
      allowed: row.allowed,
      limit: options.limit,
      remaining: typeof row.remaining === "number" ? row.remaining : 0,
      resetAt: row.reset_at ? new Date(row.reset_at).getTime() : Date.now() + options.windowMs,
      degraded: false,
    };
  } catch (error: unknown) {
    // Shared store unreachable — degrade to the local limiter rather than
    // 429-ing paying customers over an infrastructure blip.
    console.warn(
      `[rate-limit] shared store unavailable for "${namespace}", using local fallback:`,
      error instanceof Error ? error.message : String(error),
    );
    return localDecision(namespace, identifier, options);
  }
}

/** Standard `X-RateLimit-*` headers for a decision. */
export function rateLimitHeaders(decision: RateLimitDecision): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(decision.limit),
    "X-RateLimit-Remaining": String(decision.remaining),
    "X-RateLimit-Reset": String(Math.ceil(decision.resetAt / 1_000)),
  };
}

/**
 * The 429 a caller should receive, with `Retry-After` derived from the window.
 * Returns null when the request is allowed, so routes can write:
 *
 *   const blocked = await enforceRateLimit(ns, id, opts);
 *   if (blocked) return blocked;
 */
export async function enforceRateLimit(
  namespace: string,
  identifier: string,
  options: RateLimitOptions,
): Promise<NextResponse | null> {
  const decision = await consumeRateLimit(namespace, identifier, options);
  if (decision.allowed) return null;

  const retryAfter = Math.max(1, Math.ceil((decision.resetAt - Date.now()) / 1_000));
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        ...rateLimitHeaders(decision),
        "Retry-After": String(retryAfter),
      },
    },
  );
}
