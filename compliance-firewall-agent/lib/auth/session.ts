import "server-only";
import { headers } from "next/headers";
import { getAuth, isBetterAuthEnabled } from "./better-auth";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Unified server-side session resolver — the ONE place the rest of the app asks
 * "who is the caller?" during the Supabase → Better Auth migration.
 *
 * When Better Auth is enabled it reads the Better Auth session cookie; otherwise
 * it falls back to Supabase Auth. Route guards, Server Components, and the
 * dashboard viewer all go through this, so the cutover is a single env flip.
 */

export type SessionUser = {
  id: string;
  email: string | null;
  name: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  if (isBetterAuthEnabled()) {
    const auth = getAuth();
    if (!auth) return null;
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      if (!session?.user) return null;
      return {
        id: session.user.id,
        email: session.user.email ?? null,
        name: session.user.name ?? null,
      };
    } catch {
      return null;
    }
  }

  // Supabase fallback (current default).
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email ?? null,
      name:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null,
    };
  } catch {
    return null;
  }
}
