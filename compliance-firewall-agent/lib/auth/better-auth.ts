import "server-only";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";
import { isBetterAuthEnabled, betterAuthBaseUrl } from "./auth-config";

// Re-export the gating helpers so existing importers of this server module keep
// working; the pure implementations live in auth-config (test/edge-safe).
export { isBetterAuthEnabled, betterAuthBaseUrl };

/**
 * Better Auth — self-hosted authentication for HoundShield.
 *
 * Migration posture: this is ADDITIVE and ENV-GATED. Nothing changes until the
 * founder sets `AUTH_PROVIDER=better-auth` (+ `DATABASE_URL` + `BETTER_AUTH_SECRET`)
 * in the environment. Until then `isBetterAuthEnabled()` is false and the app
 * keeps using Supabase Auth, so production is never broken by a half-applied
 * migration. See docs/BETTER-AUTH-MIGRATION.md for the activation checklist.
 *
 * Users live in OUR Postgres (reuse the Supabase Postgres via DATABASE_URL) in
 * the `user`/`session`/`account`/`verification` tables created by migration 024.
 * Better Auth issues its own session cookie, so Supabase RLS keyed on
 * `auth.uid()` no longer applies — authorization moves into route/app code via
 * `lib/auth/session.ts` and the api-guard helpers.
 */

const trim = (v: string | undefined) => (v ?? "").trim();

// Build the concrete auth instance. Kept in its own function so its precise
// inferred type flows to `_auth` and getAuth() — annotating with the general
// `Auth<BetterAuthOptions>` is rejected (generic variance: baseURL narrows).
function buildAuth() {
  const baseURL = betterAuthBaseUrl();

  const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};
  if (trim(process.env.GITHUB_CLIENT_ID) && trim(process.env.GITHUB_CLIENT_SECRET)) {
    socialProviders.github = {
      clientId: trim(process.env.GITHUB_CLIENT_ID),
      clientSecret: trim(process.env.GITHUB_CLIENT_SECRET),
    };
  }
  if (trim(process.env.GOOGLE_CLIENT_ID) && trim(process.env.GOOGLE_CLIENT_SECRET)) {
    socialProviders.google = {
      clientId: trim(process.env.GOOGLE_CLIENT_ID),
      clientSecret: trim(process.env.GOOGLE_CLIENT_SECRET),
    };
  }

  return betterAuth({
    baseURL,
    secret: trim(process.env.BETTER_AUTH_SECRET),
    database: new Pool({ connectionString: trim(process.env.DATABASE_URL) }),
    // The prod host 308-redirects the apex → www, so trust both plus localhost.
    trustedOrigins: [baseURL, "https://houndshield.com", "http://localhost:3000"],
    emailAndPassword: {
      enabled: true,
      // Resend is wired for transactional email; flip on when the verification
      // template is ready (docs/BETTER-AUTH-MIGRATION.md).
      requireEmailVerification: false,
      minPasswordLength: 8,
    },
    socialProviders,
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // refresh once per day
    },
    // nextCookies() MUST be last so Set-Cookie is emitted from server actions.
    plugins: [nextCookies()],
  });
}

// Lazily constructed so importing this module never opens a pool (or throws)
// when Better Auth is disabled — the build and every Supabase-path request stay
// unaffected.
let _auth: ReturnType<typeof buildAuth> | null = null;

export function getAuth(): ReturnType<typeof buildAuth> | null {
  if (!isBetterAuthEnabled()) return null;
  if (!_auth) _auth = buildAuth();
  return _auth;
}
