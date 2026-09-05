import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { buildHealthReport } from "@/lib/health/service-status";

/**
 * GET /api/health/ready — the readiness diagnostic, token-gated.
 *
 * ─── The gap this closes ───────────────────────────────────────────────────
 *
 * `CLAUDE.md`'s Session Start Protocol step 3 is
 * `curl https://www.houndshield.com/api/health`, and CLAUDE.md states that
 * endpoint "reports missing control stores and reset-code configuration as
 * degraded rather than green". `docs/gtm/LIVE-PRODUCTION-AUDIT-2026-08-15.md`
 * quotes it returning a full sentence about sales being silently lost.
 *
 * It does not do that. `app/api/health/route.ts` returns `{ status: "ok" }`
 * unconditionally, with no branch that can report anything else, and
 * `app/__tests__/health-liveness-contract.test.ts` locks it that way on
 * purpose — a public, unauthenticated probe should not publish deployment
 * topology or per-control state.
 *
 * Both positions are right, and the contradiction was in the documentation. The
 * daily pre-flight had become a check that returns green under every failure
 * condition it exists to detect, including the one that has actually cost money:
 * `STRIPE_WEBHOOK_SECRET` unset, so a completed $499 purchase records no order,
 * sends no receipt and raises no alert.
 *
 * So the public probe is left exactly as it is, and the capability it cannot
 * safely provide lives here instead — behind a shared secret, reachable from a
 * terminal. `/api/admin/health` could not serve this: it requires an
 * authenticated browser session, so it is unusable from `curl` in a session
 * start protocol.
 *
 * ─── Why this returns 404 and not 401 ──────────────────────────────────────
 *
 * A wrong token and an unconfigured token both produce the same 404 as a route
 * that does not exist. A 401 would confirm the endpoint is real and that the
 * header name is right, turning it into an oracle worth grinding. Nothing about
 * the deployment is disclosed until the caller already holds the secret.
 *
 * ─── What it reports ───────────────────────────────────────────────────────
 *
 * `lib/health/service-status.ts`, whose header states its output is
 * "VALUE-FREE, ALWAYS … derived from the SHAPE or PRESENCE of configuration,
 * never its content". That module was written for exactly this and had been
 * orphaned — its only remaining consumer was its own test file.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Header the operator sends. Also accepted as `Authorization: Bearer <token>`. */
const TOKEN_HEADER = "x-health-token";

/** Indistinguishable from a route that does not exist. */
function notFound(): NextResponse {
  return NextResponse.json(
    { error: "Not found" },
    { status: 404, headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * Constant-time compare. `a !== b` short-circuits on the first differing byte,
 * which leaks the token prefix to anyone who can time the response. Lengths are
 * compared first because timingSafeEqual throws on a length mismatch; the
 * length of the token is not the secret.
 */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function presentedToken(request: NextRequest): string {
  const header = request.headers.get(TOKEN_HEADER);
  if (header) return header.trim();
  const auth = request.headers.get("authorization") ?? "";
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
}

export async function GET(request: NextRequest) {
  const expected = (process.env.HEALTH_DIAGNOSTIC_TOKEN ?? "").trim();

  // Fail closed. An unset token disables the route rather than opening it —
  // the opposite default would publish per-control state on every deployment
  // that had not yet been configured, which is every new one.
  if (expected.length === 0) return notFound();
  if (!safeEqual(presentedToken(request), expected)) return notFound();

  const report = await buildHealthReport();

  return NextResponse.json(
    {
      status: report.degraded.length === 0 ? "ok" : "degraded",
      degraded: report.degraded,
      services: report.services,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
