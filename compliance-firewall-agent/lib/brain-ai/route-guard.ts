import { NextResponse } from 'next/server';
import { requireUser, type AuthedUser } from '@/lib/auth/api-guard';
import { enforceRateLimit, identifierFor, LLM_RATE_LIMITS } from '@/lib/rate-limit-shared';

/**
 * The front half of every `/api/brain-ai/*` handler: authenticate, then meter.
 *
 * WHY THIS FILE EXISTS. Eight routes under `app/api/brain-ai/` shipped with no
 * authentication and no rate limiting, and were live in production — verified
 * on 2026-08-11, `GET /api/brain-ai/session` answered 200 to an anonymous
 * request. The rest of `app/api/` had already been hardened around
 * `requireUser()` / `requireRole()`; this cluster simply never adopted it.
 *
 * Three distinct exposures, all closed by the same two lines at the top of a
 * handler:
 *
 *   SPEND    — `/execute` runs an LLM turn against OpenRouter. Unauthenticated
 *              and unmetered, it is a direct path to a billing incident, and
 *              the caller chose the model.
 *   TENANCY  — `/session` listed every session id, then read or deleted any of
 *              them by id. See app/api/brain-ai/session/route.ts.
 *   SSRF     — `/ingest` fetched caller-supplied URLs. Bounded separately by
 *              lib/net/safe-fetch.ts, but it should never have been reachable
 *              without a session either.
 *
 * ONE HELPER, NOT EIGHT COPIES. A security check duplicated eight times is a
 * security check that loses a clause in one of them. This is deliberately thin
 * — it composes the two existing primitives and adds no policy of its own.
 *
 * METERING TIER. Callers that spend money upstream (`/execute`, `/ingest`) use
 * the `authenticated` LLM bucket; read-only introspection uses `publicRead`,
 * which is looser but still bounded. Both are keyed on the user id rather than
 * the IP, so one account behind a shared NAT cannot exhaust a colleague's
 * budget.
 */

export type BrainAiTier = 'llm' | 'read';

export interface BrainAiGuardResult {
  /** Ready-to-return response when the request must not proceed. */
  blocked: NextResponse | null;
  /** The authenticated caller. Null whenever `blocked` is set. */
  user: AuthedUser | null;
}

/**
 * Authenticate and meter. Returns `{ blocked }` to return immediately, or
 * `{ user }` to proceed.
 *
 *   const { blocked, user } = await guardBrainAi(req, 'llm');
 *   if (blocked) return blocked;
 */
export async function guardBrainAi(
  request: Request,
  tier: BrainAiTier = 'read',
): Promise<BrainAiGuardResult> {
  // Identity first. `requireUser()` fails closed — no session, no Supabase, or
  // an unverified email all produce a 401/403 rather than falling through.
  const auth = await requireUser();
  if (!auth.user) return { blocked: auth.response, user: null };

  // Meter per user, not per IP: the cost being bounded here is upstream spend,
  // which is attributable to an account.
  const blocked = await enforceRateLimit(
    `brain-ai:${tier}`,
    identifierFor({ userId: auth.user.id }),
    tier === 'llm' ? LLM_RATE_LIMITS.authenticated : LLM_RATE_LIMITS.publicRead,
  );
  if (blocked) return { blocked, user: null };

  return { blocked: null, user: auth.user };
}

/**
 * Namespace a session id to its owner.
 *
 * The store is a flat key→session map with no tenancy column, so ownership has
 * to live in the key itself. Prefixing with the (opaque, server-resolved) user
 * id means one caller can never name another caller's session, whatever they
 * put in `?id=` — the prefix is not theirs to forge because it is never read
 * from the request.
 *
 * ponytail: key-prefix tenancy, not a real ownership column. Move to a
 * `user_id` column if Brain AI sessions ever move to Postgres.
 */
export function scopedSessionId(userId: string, rawId: string): string {
  return `u:${userId}:${rawId}`;
}

/** True when `storedId` belongs to `userId`. */
export function ownsSession(userId: string, storedId: string): boolean {
  return storedId.startsWith(`u:${userId}:`);
}
