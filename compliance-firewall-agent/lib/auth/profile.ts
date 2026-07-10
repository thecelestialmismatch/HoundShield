import "server-only";
import { getSessionUser, type SessionUser } from "./session";
import { isBetterAuthEnabled, profileKeyColumn } from "./auth-config";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/client";

// Re-export so server callers can import everything profile-related from here.
export { profileKeyColumn };

/**
 * Provider-agnostic profile resolution — the ONE place that knows how a
 * session identity maps onto a `profiles` row during the Supabase → Better
 * Auth migration.
 *
 * Supabase Auth:  profiles.id                == session user id (uuid)
 * Better Auth:    profiles.better_auth_user_id == session user id (text),
 *                 written by the on_better_auth_user_created trigger
 *                 (migration 025).
 *
 * Reads go through the service client AFTER identity is established from the
 * session cookie, filtered to the caller's own row — same trust model as the
 * api-guard role lookup. Callers never pass ids in from the client.
 */

export interface SessionProfile {
  user: SessionUser;
  /** The caller's own profiles row (requested columns), or null if none. */
  profile: Record<string, unknown> | null;
}

/**
 * Resolve the signed-in caller and their own profile row in one call.
 * Returns null when there is no session; returns { user, profile: null } when
 * the session exists but the profile lookup finds nothing (fail to least
 * privilege — callers must treat a missing profile as free-tier/anonymous-ish).
 */
export async function getSessionProfile(columns: string): Promise<SessionProfile | null> {
  const user = await getSessionUser();
  if (!user) return null;
  if (!isSupabaseConfigured()) return { user, profile: null };
  try {
    const svc = createServiceClient();
    const { data } = await svc
      .from("profiles")
      .select(columns)
      .eq(profileKeyColumn(isBetterAuthEnabled()), user.id)
      .maybeSingle();
    return { user, profile: (data as Record<string, unknown> | null) ?? null };
  } catch {
    return { user, profile: null };
  }
}
