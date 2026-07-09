import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isBetterAuthEnabled, betterAuthBaseUrl } from "../auth-config";

/**
 * Better Auth is fully built but ENV-GATED: it must stay dormant (app on
 * Supabase) unless AUTH_PROVIDER=better-auth AND both DATABASE_URL and
 * BETTER_AUTH_SECRET are present. A half-configured flag must NOT activate it —
 * that would fail closed and lock everyone out. These pin the switch.
 */

const KEYS = ["AUTH_PROVIDER", "DATABASE_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL"] as const;

describe("Better Auth env gating", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("is OFF when nothing is set", () => {
    expect(isBetterAuthEnabled()).toBe(false);
  });

  it("is OFF when the flag is set but DATABASE_URL is missing", () => {
    process.env.AUTH_PROVIDER = "better-auth";
    process.env.BETTER_AUTH_SECRET = "s".repeat(32);
    expect(isBetterAuthEnabled()).toBe(false);
  });

  it("is OFF when DB + secret are present but the flag is not flipped", () => {
    process.env.DATABASE_URL = "postgres://x";
    process.env.BETTER_AUTH_SECRET = "s".repeat(32);
    expect(isBetterAuthEnabled()).toBe(false); // AUTH_PROVIDER still 'supabase'/unset
  });

  it("is OFF when the secret is blank whitespace", () => {
    process.env.AUTH_PROVIDER = "better-auth";
    process.env.DATABASE_URL = "postgres://x";
    process.env.BETTER_AUTH_SECRET = "   ";
    expect(isBetterAuthEnabled()).toBe(false);
  });

  it("is ON only when all three are set", () => {
    process.env.AUTH_PROVIDER = "better-auth";
    process.env.DATABASE_URL = "postgres://x";
    process.env.BETTER_AUTH_SECRET = "s".repeat(32);
    expect(isBetterAuthEnabled()).toBe(true);
  });

  it("base URL defaults to the www host, overridable via env", () => {
    expect(betterAuthBaseUrl()).toBe("https://www.houndshield.com");
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    expect(betterAuthBaseUrl()).toBe("http://localhost:3000");
  });
});
