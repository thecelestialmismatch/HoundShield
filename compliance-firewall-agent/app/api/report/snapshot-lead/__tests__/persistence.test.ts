import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* ──────────────────────────────────────────────────────────────────
 * snapshot_leads — the privacy boundary, pinned to the schema.
 *
 * The free snapshot's whole claim is that pasted prompt text never leaves the
 * visitor's device. Migration 037 gives that promise a place to break: a table.
 * The route's zod schema is `.strict()` and has no content field, so the way
 * this fails in practice is somebody adding a column here "just to debug it"
 * and a matching field there, months apart, each looking harmless alone.
 *
 * So the invariant is asserted against BOTH artifacts at once: the migration
 * may not contain a content-shaped column, the schema may not contain a
 * content-shaped field, and the two must describe the same record.
 * ────────────────────────────────────────────────────────────────── */

const APP = join(__dirname, "..", "..", "..", "..", "..");
const MIGRATION = readFileSync(
  join(APP, "supabase", "migrations", "037_snapshot_leads.sql"),
  "utf8",
);
const ROUTE = readFileSync(join(__dirname, "..", "route.ts"), "utf8");

/** Column names declared in the create-table block. */
function migrationColumns(): string[] {
  const body = MIGRATION.split(/create table[^(]*\(/i)[1]?.split(/\n\);/)[0] ?? "";
  return body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("--"))
    .map((l) => l.split(/\s+/)[0])
    .filter((c) => /^[a-z_]+$/.test(c));
}

describe("snapshot_leads stores counts, never content", () => {
  /**
   * The exact column set this table is allowed to have.
   *
   * A closed world, not a blocklist. The first draft blocked content-shaped
   * WORDS and flagged `prompts_scanned` — a count of how many prompts were
   * scanned, which is precisely the kind of field this table exists for. A
   * guard that would force correct code to change is measuring the wrong thing
   * (lessons.md, 2026-08-14), and a blocklist also loses to any name its author
   * failed to imagine.
   *
   * Enumerating instead means ANY new column fails here and has to be argued
   * for in review — which is the actual control, since the risk is a
   * well-meaning column added quietly rather than one named `prompt_text`.
   */
  const ALLOWED_COLUMNS = [
    "id",
    "email",
    "full_name",
    "company",
    "vertical",
    "critical_count",
    "high_count",
    "medium_count",
    "total_matches",
    "prompts_scanned",
    "controls",
    "created_at",
  ];

  /** Fields the request schema is allowed to accept. Same reasoning. */
  const ALLOWED_FIELDS = [
    "name",
    "email",
    "company",
    "vertical",
    "criticalCount",
    "highCount",
    "mediumCount",
    "totalMatches",
    "promptsScanned",
    "controls",
  ];

  it("declares exactly the counts-only column set — no column can be added quietly", () => {
    const columns = migrationColumns();
    const unexpected = columns.filter((c) => !ALLOWED_COLUMNS.includes(c));
    expect(
      unexpected,
      `New column(s) on snapshot_leads: ${unexpected.join(", ")}. This table stores ` +
        `finding COUNTS ONLY — prompt content never leaves the visitor's device. If the ` +
        `column is genuinely counts-only, add it to ALLOWED_COLUMNS here.`,
    ).toEqual([]);
    // And the boundary cannot be weakened by DELETING the counts either.
    for (const required of ["email", "full_name", "critical_count", "created_at"]) {
      expect(columns).toContain(required);
    }
  });

  it("accepts exactly the counts-only request fields", () => {
    const schema = ROUTE.split("const LeadSchema")[1]?.split(".strict()")[0] ?? "";
    expect(schema.length, "could not locate LeadSchema — this guard is blind").toBeGreaterThan(50);
    const fields = [...schema.matchAll(/^\s{4}([a-zA-Z]+):\s*z\.|^\s{4}([a-zA-Z]+):\s*nonNegInt/gm)]
      .map((m) => m[1] ?? m[2])
      .filter(Boolean) as string[];
    expect(fields.length, "parsed no schema fields — this guard is blind").toBeGreaterThan(5);
    const unexpected = fields.filter((f) => !ALLOWED_FIELDS.includes(f));
    expect(
      unexpected,
      `New request field(s): ${unexpected.join(", ")}. LeadSchema is counts-only.`,
    ).toEqual([]);
  });

  it("keeps the .strict() schema — unknown keys must be rejected, not ignored", () => {
    // Without .strict() an extra `inputText` key would be silently dropped
    // rather than 400'd, which is a quieter and worse failure.
    expect(ROUTE).toContain(".strict()");
  });

  it("persists every count the schema accepts — no field captured then discarded", () => {
    const columns = migrationColumns();
    // schema field (camelCase) → column (snake_case)
    const mapping: Record<string, string> = {
      criticalCount: "critical_count",
      highCount: "high_count",
      mediumCount: "medium_count",
      totalMatches: "total_matches",
      promptsScanned: "prompts_scanned",
      controls: "controls",
      email: "email",
      company: "company",
      vertical: "vertical",
    };
    for (const [field, column] of Object.entries(mapping)) {
      expect(columns, `${field} is accepted but has no ${column} column`).toContain(column);
      expect(ROUTE, `${column} is never written by the route`).toContain(column);
    }
    // `name` is the one deliberate rename — the column is full_name.
    expect(columns).toContain("full_name");
    expect(ROUTE).toContain("full_name: name");
  });

  it("writes to the database BEFORE checking RESEND_API_KEY", () => {
    // Ordering is the fix: the old route returned 503 on a missing key without
    // recording anything, so an unconfigured mailer lost the lead outright.
    const insertAt = ROUTE.indexOf('from("snapshot_leads")');
    const resendGateAt = ROUTE.indexOf("if (!process.env.RESEND_API_KEY)");
    expect(insertAt, "no insert into snapshot_leads found").toBeGreaterThan(-1);
    expect(resendGateAt, "no RESEND_API_KEY gate found").toBeGreaterThan(-1);
    expect(
      insertAt,
      "the lead must be persisted before the mailer gate, or an unset key drops it",
    ).toBeLessThan(resendGateAt);
  });

  it("does not fail the request when only the database rail is down", () => {
    // The insert is wrapped so a Postgres outage still lets the emails go.
    const block = ROUTE.split('from("snapshot_leads")')[1]?.slice(0, 900) ?? "";
    expect(block).toContain("catch");
    expect(block).toContain("console.error");
  });

  it("is rate limited — it is unauthenticated and sends two emails per call", () => {
    expect(ROUTE).toContain("enforceRateLimit");
    expect(ROUTE).toContain("snapshot-lead");
  });

  it("enables RLS with no policy, so only the service role can read leads", () => {
    expect(MIGRATION).toMatch(/alter table snapshot_leads enable row level security/i);
    expect(MIGRATION).not.toMatch(/create policy/i);
  });
});
