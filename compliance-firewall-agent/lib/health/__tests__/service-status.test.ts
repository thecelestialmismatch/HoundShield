import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  degradedKeys,
  isHintKey,
  isOperationalValue,
  PROBED_TABLES,
  type Services,
} from "@/lib/health/service-status";

/**
 * Audit #20c: three security controls fail OPEN and reported nowhere, so all
 * three could be entirely absent while every health check stayed green.
 *
 * These tests pin the two properties that make the report worth reading:
 *   1. a degraded control is NAMED (not merely absent from a green list), and
 *   2. operator prose and deployment facts are never mistaken for a failure —
 *      the bug that made the public /status page alarm on its own hint text and
 *      on a row reading "houndshield.com".
 */

const ENV_KEYS = [
  "TURNSTILE_SECRET_KEY",
  "ENCRYPTION_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "MARKETING_POSTAL_ADDRESS",
  "UNSUBSCRIBE_SECRET",
] as const;

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
});

afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  vi.resetModules();
});

describe("degradedKeys — a control that fails open must be loud", () => {
  it("names each control that is not doing its job", () => {
    const services: Services = {
      rate_limit_store: "degraded_local",
      auth_lockout_store: "degraded_open",
      captcha: "not_configured",
      quarantine_encryption: "unavailable",
    };
    expect(degradedKeys(services).sort()).toEqual([
      "auth_lockout_store",
      "captcha",
      "quarantine_encryption",
      "rate_limit_store",
    ]);
  });

  it("reports nothing when every control is enforcing", () => {
    const services: Services = {
      database: "connected",
      rate_limit_store: "shared",
      auth_lockout_store: "enforcing",
      captcha: "enforcing",
      quarantine_encryption: "enabled",
    };
    expect(degradedKeys(services)).toEqual([]);
  });

  it("does not treat its own operator prose as a failing service", () => {
    // The old /status page had no notion of a hint key, so every explanatory
    // sentence counted as a service in a bad state and the banner could never
    // read green.
    const services: Services = {
      captcha: "enforcing",
      captcha_hint: "TURNSTILE_SECRET_KEY is not set, so verification is a no-op.",
    };
    expect(isHintKey("captcha_hint")).toBe(true);
    expect(degradedKeys(services)).toEqual([]);
  });

  it("does not treat a deployment fact as a failing service", () => {
    // These are the exact rows that made the public status page show a warning
    // triangle next to the word "houndshield.com".
    const services: Services = {
      reset_sender_domain: "houndshield.com",
      founder_inbox: "default",
      founder_inbox_domain: "houndshield.com",
    };
    expect(degradedKeys(services)).toEqual([]);
  });

  it("knows the pre-existing diagnostic vocabulary is healthy", () => {
    // "set" and "ok" come from passwordResetDiagnostic() and were unknown to the
    // page's old local allow-list.
    for (const value of ["connected", "set", "ok", "operational"]) {
      expect(isOperationalValue(value)).toBe(true);
    }
    for (const value of ["demo_mode", "missing_key", "suspect", "missing"]) {
      expect(isOperationalValue(value)).toBe(false);
    }
  });
});

describe("every probed column exists in the migration that creates the table", () => {
  /*
   * THE BUG THIS EXISTS FOR, found in production and not in review.
   *
   * The first version probed `.select("key")` on rate_limit_buckets, whose
   * primary key is `bucket_key`. PostgREST returned an error, the probe's catch
   * swallowed it, and /api/health reported `rate_limit_store: degraded_local`
   * while shared rate limiting was working perfectly.
   *
   * That is the worst possible failure for this endpoint. It was written to
   * stop a control failing SILENTLY; a misspelled probe makes it cry wolf
   * instead, which sends an operator chasing an outage that does not exist and
   * teaches them to distrust the page. A false alarm is a worse lie than the
   * hardcoded "operational" this module deleted.
   *
   * Asserted against the migration DDL rather than a copy of the column name,
   * so renaming a column in a future migration fails here rather than in prod.
   */
  const MIGRATIONS = join(process.cwd(), "supabase", "migrations");

  /**
   * A column is real if ANY migration declares it — in the table's CREATE
   * TABLE body, or added later by an ALTER TABLE.
   *
   * The create-table-only version of this check would have failed on
   * `profiles.marketing_opt_out_at`, which migration 034 adds to a table
   * created back in 001. Tightening the probe list would have been the wrong
   * response: a guard that cannot see half the ways a column comes into
   * existence pushes you toward not probing at all.
   */
  function columnIsDeclared(table: string, column: string): boolean {
    const sqls = readdirSync(MIGRATIONS)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => readFileSync(join(MIGRATIONS, f), "utf8"));

    const addedByAlter = new RegExp(
      `alter table[^;]*\\b${table}\\b[^;]*add column[^;]*\\b${column}\\b`,
      "is",
    );
    if (sqls.some((sql) => addedByAlter.test(sql))) return true;

    const created = sqls.find((sql) =>
      new RegExp(`create table[^;]*\\b${table}\\b`, "i").test(sql),
    );
    if (!created) return false;

    const body = created.slice(created.search(new RegExp(`create table[^(]*\\b${table}\\b`, "i")));
    const columns = body.slice(body.indexOf("(") + 1, body.indexOf(");"));
    return new RegExp(`^\\s*${column}\\s`, "m").test(columns);
  }

  it.each(Object.entries(PROBED_TABLES))("%s.%s is a real column", (table, column) => {
    expect(
      columnIsDeclared(table, column),
      `${table} has no column "${column}" — the probe would report a FALSE outage`,
    ).toBe(true);
  });

  it("rejects a column no migration declares", () => {
    // Both directions: without this, a regex that matched nothing would make
    // every assertion above pass vacuously.
    expect(columnIsDeclared("profiles", "column_that_does_not_exist")).toBe(false);
    expect(columnIsDeclared("table_that_does_not_exist", "id")).toBe(false);
  });
});

describe("buildHealthReport — controls are measured, not declared", () => {
  /** Import fresh so module-level env reads in the Supabase client re-evaluate. */
  async function build() {
    vi.resetModules();
    const mod = await import("@/lib/health/service-status");
    return mod.buildHealthReport();
  }

  it("reports captcha as not_configured, and says why, when the key is absent", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const { services, degraded } = await build();
    expect(services.captcha).toBe("not_configured");
    expect(degraded).toContain("captcha");
    // The hint has to state the fail-open behaviour, not merely "not set" —
    // an absent key means verifyCaptcha() answers TRUE, which is the opposite
    // of "captcha is off".
    expect(services.captcha_hint).toMatch(/returns true for every token/i);
  });

  it("reports captcha as enforcing when the key is present", async () => {
    process.env.TURNSTILE_SECRET_KEY = "0x-test-secret";
    const { services, degraded } = await build();
    expect(services.captcha).toBe("enforcing");
    expect(degraded).not.toContain("captcha");
    expect(services.captcha_hint).toBeUndefined();
  });

  it("rejects an ENCRYPTION_KEY that is the wrong length or not hex", async () => {
    process.env.ENCRYPTION_KEY = "tooshort";
    expect((await build()).services.quarantine_encryption).toBe("unavailable");

    // Right length, but not hex — Buffer.from(x, "hex") would silently truncate,
    // so a length-only check would call this key usable.
    process.env.ENCRYPTION_KEY = "z".repeat(64);
    expect((await build()).services.quarantine_encryption).toBe("unavailable");

    process.env.ENCRYPTION_KEY = "a1b2c3d4".repeat(8); // 64 hex chars
    expect((await build()).services.quarantine_encryption).toBe("enabled");
  });

  it("reports the onboarding drip as disabled, and says which variable, when it cannot lawfully send", async () => {
    // This one fails CLOSED — no address means no send, not an unlawful send.
    // It is reported anyway because a silently dark drip looks identical to a
    // working one from the outside, and the fix is a single env var.
    delete process.env.MARKETING_POSTAL_ADDRESS;
    const { services, degraded } = await build();
    expect(services.marketing_email).toBe("disabled");
    expect(degraded).toContain("marketing_email");
    expect(services.marketing_email_hint).toMatch(/MARKETING_POSTAL_ADDRESS/);
  });

  it("reports the drip as enabled once the statutory elements are configured", async () => {
    process.env.MARKETING_POSTAL_ADDRESS = "HoundShield, 1 Example St, Wilmington DE 19801";
    process.env.UNSUBSCRIBE_SECRET = "test-unsubscribe-secret";
    const { services, degraded } = await build();
    expect(services.marketing_email).toBe("enabled");
    expect(degraded).not.toContain("marketing_email");
    expect(services.marketing_email_hint).toBeUndefined();
  });

  it("never leaks a configured value into the public response", async () => {
    process.env.TURNSTILE_SECRET_KEY = "0xSUPERSECRETTURNSTILEVALUE";
    process.env.ENCRYPTION_KEY = "deadbeef".repeat(8);
    const { services } = await build();
    const serialized = JSON.stringify(services);
    expect(serialized).not.toContain("SUPERSECRETTURNSTILEVALUE");
    expect(serialized).not.toContain("deadbeef".repeat(8));
  });

  it("reports the stores as not_configured rather than throwing in demo mode", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { services, degraded } = await build();
    expect(services.rate_limit_store).toBe("not_configured");
    expect(services.auth_lockout_store).toBe("not_configured");
    expect(services.marketing_opt_out_store).toBe("not_configured");
    expect(degraded).toContain("rate_limit_store");
    expect(degraded).toContain("auth_lockout_store");
    expect(degraded).toContain("marketing_opt_out_store");
  });

  it("names migration 034 and the ordering when an opt-out cannot be stored", async () => {
    // The trap this closes: setting MARKETING_POSTAL_ADDRESS before applying
    // 034 opens the CAN-SPAM gate onto a column that does not exist, so every
    // drip run throws and sends nothing while looking configured.
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { services } = await build();
    expect(services.marketing_opt_out_store_hint).toMatch(/cannot be recorded/i);
  });

  it("no longer publishes the three constants that could never go red", async () => {
    const { services } = await build();
    // classifier/quarantine/audit_chain were each hardcoded "operational".
    expect(services.classifier).toBeUndefined();
    expect(services.quarantine).toBeUndefined();
    expect(services.audit_chain).toBeUndefined();
  });

  it("every reported key is classified — no key can be silently unjudged", async () => {
    const { services, degraded } = await build();
    for (const [key, value] of Object.entries(services)) {
      const judged =
        isHintKey(key) ||
        isOperationalValue(value) ||
        degraded.includes(key) ||
        // Informational keys are excluded by design; assert that exclusion is
        // deliberate by naming them, so a NEW unjudged key fails here.
        ["reset_sender_domain", "founder_inbox", "founder_inbox_domain"].includes(key);
      expect(judged, `service key "${key}" (value "${value}") is not classified`).toBe(true);
    }
  });
});
