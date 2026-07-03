import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, createServiceClient } from "@/lib/supabase/client";

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
  if (!isSupabaseConfigured()) return unauthorized();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorized();

  // Resolve role from profiles (service role read; never trust the client).
  let role = "user";
  try {
    const svc = createServiceClient();
    const { data } = await svc
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (data?.role) role = data.role as string;
  } catch {
    // If role lookup fails, default to the least-privileged role.
  }

  return {
    user: { id: user.id, email: user.email ?? null, role },
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
