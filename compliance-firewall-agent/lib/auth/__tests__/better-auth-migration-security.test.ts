import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

/**
 * Migration 024 security contract.
 *
 * The Better Auth tables (`user`, `session`, `account`, `verification`) live in
 * the PUBLIC schema of a Supabase project whose anon/authenticated PostgREST API
 * is internet-exposed. They hold session tokens, password hashes and OAuth
 * access/refresh tokens. If RLS is disabled on them, anyone holding the public
 * anon key can read every session token via `GET /rest/v1/session` and take over
 * any account.
 *
 * Better Auth connects over a direct Postgres pool (DATABASE_URL) as the table
 * OWNER, which bypasses RLS — so enabling RLS with NO policies denies PostgREST
 * while leaving Better Auth fully functional. These tests pin that posture so a
 * future edit can never silently re-open the hole.
 */

const SQL = readFileSync(
  path.resolve(__dirname, "../../../supabase/migrations/024_better_auth_core.sql"),
  "utf8",
);

// Executable SQL only — strip `-- …` line comments so the negative assertions
// below match on real statements, not on the header's explanatory prose.
const CODE = SQL.replace(/--.*$/gm, "");

const TABLES = ["user", "session", "account", "verification"] as const;

describe("Better Auth migration 024 — RLS locks the auth tables away from PostgREST", () => {
  for (const t of TABLES) {
    it(`enables row level security on "${t}"`, () => {
      const re = new RegExp(`alter table\\s+"${t}"\\s+enable row level security`, "i");
      expect(SQL).toMatch(re);
    });
  }

  it("never disables RLS on any auth table", () => {
    expect(CODE).not.toMatch(/disable row level security/i);
  });

  it("does NOT FORCE row level security (the owner/Better Auth must stay exempt)", () => {
    // FORCE would apply RLS to the owning role too, locking Better Auth out.
    expect(CODE).not.toMatch(/force row level security/i);
  });

  it("revokes the implicit PostgREST grants from anon and authenticated", () => {
    expect(SQL).toMatch(/revoke all on[\s\S]*from\s+anon,\s*authenticated/i);
  });

  it("does not grant the API roles access back to the auth tables", () => {
    // A stray `grant ... to anon/authenticated` would defeat the revoke above.
    expect(CODE).not.toMatch(/grant[\s\S]*to\s+(anon|authenticated)/i);
  });
});
