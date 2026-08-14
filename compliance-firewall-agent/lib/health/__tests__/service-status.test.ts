import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  degradedKeys,
  isHintKey,
  isOperationalValue,
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
    expect(degraded).toContain("rate_limit_store");
    expect(degraded).toContain("auth_lockout_store");
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
