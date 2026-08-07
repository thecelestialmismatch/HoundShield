import "server-only";
import { cache } from "react";
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
 *
 * PERFORMANCE — the export is wrapped in React `cache()`, which memoizes per
 * REQUEST (not across requests, not across users; the cache lives and dies with
 * the render). This is load-bearing, not a micro-optimization:
 *
 *   `supabase.auth.getUser()` is a network call to the GoTrue `/user` endpoint,
 *   not a local JWT decode — that is the whole point of `getUser()` over
 *   `getSession()`, and why it is the one Supabase tells you to trust on a
 *   server. It costs a full round-trip every time it is called.
 *
 * Rendering /command-center/overview called it THREE times in series before this
 * wrapper: once in the fail-closed gate in app/command-center/layout.tsx, once
 * via getSessionProfile() in the page, and once more inside hasGatewayTraffic().
 * Three sequential auth round-trips before a single byte of HTML streamed, which
 * is what the founder saw on a phone as a long shield-and-progress-bar splash on
 * 2026-08-07. Deduped to one, the other two resolve from memory.
 *
 * Every caller benefits without changing a line, which is the point of fixing it
 * here rather than threading a user object through nine call sites. Call it as
 * often as reads naturally — it is free after the first one in a request.
 */

export type SessionUser = {
  id: string;
  email: string | null;
  name: string | null;
};

async function resolveSessionUser(): Promise<SessionUser | null> {
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

export const getSessionUser = cache(resolveSessionUser);
