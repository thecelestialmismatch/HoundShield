/**
 * Auth provider gating — pure env reads, no server-only / pg imports so it is
 * safe to import from tests, middleware, and the server module alike. This is
 * the single source of truth for "is Better Auth the active provider?" during
 * the Supabase → Better Auth migration.
 */

const trim = (v: string | undefined): string => (v ?? "").trim();

/**
 * True only when Better Auth is explicitly selected AND fully configured.
 * Requires all three so a stray flag without a database can never half-activate
 * (which would fail closed and lock everyone out).
 */
export function isBetterAuthEnabled(): boolean {
  return (
    trim(process.env.AUTH_PROVIDER) === "better-auth" &&
    trim(process.env.DATABASE_URL).length > 0 &&
    trim(process.env.BETTER_AUTH_SECRET).length > 0
  );
}

/** Canonical base URL for Better Auth (prod defaults to the www host). */
export function betterAuthBaseUrl(): string {
  return trim(process.env.BETTER_AUTH_URL) || "https://www.houndshield.com";
}

/**
 * Which `profiles` column keys the session user id for the active provider.
 * Supabase sessions → profiles.id (uuid). Better Auth sessions →
 * profiles.better_auth_user_id (text, written by the migration-025 trigger).
 * Pure so tests/middleware can import it without touching pg/server-only.
 */
export function profileKeyColumn(betterAuthActive: boolean): "better_auth_user_id" | "id" {
  return betterAuthActive ? "better_auth_user_id" : "id";
}
