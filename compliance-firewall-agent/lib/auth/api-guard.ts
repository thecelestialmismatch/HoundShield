import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/client";
import { getSessionUser } from "@/lib/auth/session";
import { isBetterAuthEnabled, profileKeyColumn } from "@/lib/auth/auth-config";

/**
 * Server-side auth guards for API route handlers.
 *
 * SECURITY (fixes audit C3/C4/C5/H2): state-changing and cross-tenant routes
 * must derive the caller's identity and role from the session cookie — never
 * from a client-supplied body field or header. Use these helpers at the top of
 * every such route.
 */

export type AuthedUser = { id: string; email: string | null; role: string };

type GuardFailure = { user: null; response: NextResponse };
type GuardSuccess = { user: AuthedUser; response: null };
export type GuardResult = GuardFailure | GuardSuccess;

function unauthorized(): GuardFailure {
  return {
    user: null,
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  };
}

function forbidden(): GuardFailure {
  return {
    user: null,
    response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  };
}

/**
 * Holding a session but not having proved the address. Distinct from 401 so the
 * client can tell "sign in" from "go confirm your email", and distinct from a
 * plain 403 so it is actionable. This is safe to be specific about: the caller
 * already authenticated, so it tells them nothing about anyone else's account.
 */
function emailUnverified(): GuardFailure {
  return {
    user: null,
    response: NextResponse.json(
      {
        error: "Email not verified",
        message: "Confirm your email address to activate this account.",
        code: "email_unverified",
      },
      { status: 403 },
    ),
  };
}

/**
 * Require an authenticated user whose email is verified. Returns the user or a
 * ready-to-return 401/403.
 *
 * In demo mode (Supabase not configured) there are no real sessions, so this
 * fails closed with 401 — protected routes must not be reachable anonymously.
 *
 * WHY VERIFICATION IS CHECKED HERE. Requirement 3 says an account is not active
 * until the address is proven. "Active" has to mean something a route enforces,
 * or it is a claim about a dashboard toggle rather than about the system: with
 * Supabase "Confirm email" OFF, sign-up mints a live session immediately, and
 * every guarded route would have accepted it. Checking at the guard means the
 * rule holds no matter how the session was obtained, and it is one place rather
 * than ~40 route handlers.
 *
 * ⚠️ OPERATIONAL NOTE. Any pre-existing account with a null `email_confirmed_at`
 * — e.g. one created through the admin API, which does not send a confirmation
 * — starts returning 403 here. That is the correct posture, not a regression,
 * but it is a visible behaviour change. `docs/SECURITY-PHASE-1-AUTH-REPORT.md`
 * records the query to find such rows before deploying.
 */
export async function requireUser(): Promise<GuardResult> {
  // Identity comes from the unified session resolver (Better Auth when enabled,
  // else Supabase). Fails closed: no session → 401, so protected routes are
  // never reachable anonymously in demo mode either.
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorized();

  // Proven ownership, second. A session is necessary but not sufficient.
  if (!sessionUser.emailVerified) return emailUnverified();

  // Resolve role from profiles (service role read; never trust the client).
  // Best-effort — if the lookup fails or Supabase isn't configured, default to
  // the least-privileged role.
  let role = "user";
  try {
    const svc = createServiceClient();
    const { data } = await svc
      .from("profiles")
      .select("role")
      // Supabase sessions key profiles by id (uuid); Better Auth sessions by
      // better_auth_user_id (text, written by the migration-025 trigger).
      .eq(profileKeyColumn(isBetterAuthEnabled()), sessionUser.id)
      .maybeSingle();
    if (data?.role) role = data.role as string;
  } catch {
    // If role lookup fails, default to the least-privileged role.
  }

  return {
    user: { id: sessionUser.id, email: sessionUser.email, role },
    response: null,
  };
}

/**
 * Require an authenticated user whose role is one of `roles`
 * (e.g. admin/compliance officer for weakening detection rules).
 */
export async function requireRole(roles: string[]): Promise<GuardResult> {
  const result = await requireUser();
  if (!result.user) return result;
  if (!roles.includes(result.user.role)) return forbidden();
  return result;
}
