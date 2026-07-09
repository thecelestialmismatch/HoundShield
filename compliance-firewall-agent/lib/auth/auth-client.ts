"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Better Auth browser client. baseURL is inferred from the current origin
 * (same-origin API at /api/auth/*), so it works on www, apex, and localhost
 * without a build-time URL.
 *
 * Gate: components should call these only when Better Auth is the active
 * provider — check `isBetterAuthClientEnabled()` (reads the public flag). When
 * false the app is still on Supabase Auth.
 */
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;

/** Client-visible flag mirroring the server's AUTH_PROVIDER selection. */
export function isBetterAuthClientEnabled(): boolean {
  return (process.env.NEXT_PUBLIC_AUTH_PROVIDER ?? "").trim() === "better-auth";
}
