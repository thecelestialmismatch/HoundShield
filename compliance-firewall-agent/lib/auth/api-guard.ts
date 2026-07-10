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
 * Require an authenticated user. Returns the user or a ready-to-return 401.
 * In demo mode (Supabase not configured) there are no real sessions, so this
 * fails closed with 401 — protected routes must not be reachable anonymously.
 */
export async function requireUser(): Promise<GuardResult> {
  // Identity comes from the unified session resolver (Better Auth when enabled,
  // else Supabase). Fails closed: no session → 401, so protected routes are
  // never reachable anonymously in demo mode either.
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorized();

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
