import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { profileKeyColumn } from "../auth-config";

/**
 * Migration 025 (fresh-start re-key) + profile-resolution contract.
 *
 * 025 makes `profiles` the provider-agnostic identity root: it drops the FK to
 * auth.users, re-points every public-schema user FK at profiles(id), and
 * installs the trigger that auto-provisions (or email-links) a profile when
 * Better Auth creates a user. These tests pin the load-bearing pieces so a
 * future edit can't silently break signups or re-couple the schema to
 * auth.users.
 */

const SQL = readFileSync(
  path.resolve(__dirname, "../../../supabase/migrations/025_better_auth_fresh_start.sql"),
  "utf8",
);

// Executable SQL only — strip `-- …` line comments so negative assertions
// match statements, not explanatory prose.
const CODE = SQL.replace(/--.*$/gm, "");

describe("migration 025 — profiles becomes the identity root", () => {
  it("drops the profiles → auth.users FK", () => {
    expect(CODE).toMatch(/alter table profiles drop constraint if exists profiles_id_fkey/i);
  });

  it("re-points the user FKs at profiles(id), never back at auth.users", () => {
    // Every added FK must reference profiles(id)…
    const added = CODE.match(/add constraint[\s\S]*?references\s+\S+/gi) ?? [];
    expect(added.length).toBeGreaterThanOrEqual(12);
    for (const stmt of added) {
      expect(stmt).toMatch(/references\s+profiles\s*\(?/i);
    }
    // …and no executable statement may reference auth.users.
    expect(CODE).not.toMatch(/references\s+auth\.users/i);
  });

  it("preserves report_orders' SET NULL semantics (a deleted account must not delete revenue records)", () => {
    expect(CODE).toMatch(/report_orders_user_id_fkey[\s\S]{0,120}references profiles\(id\) on delete set null/i);
  });
});

describe("migration 025 — Better Auth signup trigger", () => {
  it("installs an AFTER INSERT trigger on \"user\"", () => {
    expect(CODE).toMatch(/create trigger on_better_auth_user_created\s+after insert on "user"/i);
  });

  it("links an existing unlinked profile by email before creating a new one", () => {
    expect(CODE).toMatch(/update profiles[\s\S]{0,200}better_auth_user_id is null[\s\S]{0,200}lower\(email\) = lower\(new\."email"\)/i);
    expect(CODE).toMatch(/if not found then[\s\S]{0,300}insert into profiles/i);
  });

  it("never aborts a signup on unique_violation", () => {
    expect(CODE).toMatch(/exception when unique_violation then\s*return new/i);
  });

  it("is security definer with a pinned search_path, execute revoked from API roles", () => {
    expect(CODE).toMatch(/security definer/i);
    expect(CODE).toMatch(/set search_path = public/i);
    expect(CODE).toMatch(/revoke execute on function public\.handle_new_better_auth_user\(\) from public/i);
    expect(CODE).toMatch(/revoke execute on function public\.handle_new_better_auth_user\(\) from anon, authenticated/i);
  });
});

describe("profileKeyColumn — session id → profiles column, per provider", () => {
  it("Supabase sessions key by profiles.id", () => {
    expect(profileKeyColumn(false)).toBe("id");
  });
  it("Better Auth sessions key by profiles.better_auth_user_id", () => {
    expect(profileKeyColumn(true)).toBe("better_auth_user_id");
  });
});
