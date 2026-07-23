import { describe, it, expect, afterEach, vi } from "vitest";
import { passwordResetDiagnostic } from "../reset-diagnostics";

afterEach(() => vi.unstubAllEnvs());

describe("passwordResetDiagnostic", () => {
  it("reports everything missing/default when env is unset", () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    const d = passwordResetDiagnostic();
    expect(d.service_role).toBe("missing");
    expect(d.resend).toBe("missing");
    expect(d.app_url).toBe("default");
    expect(d.app_url_hint).toMatch(/houndshield\.com/);
    expect(d.sender_domain).toBe("houndshield.com");
  });

  it("reports set/ok with valid config", () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "eyJ" + "a".repeat(60));
    vi.stubEnv("RESEND_API_KEY", "re_" + "b".repeat(30));
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://houndshield.com");
    const d = passwordResetDiagnostic();
    expect(d.service_role).toBe("set");
    expect(d.resend).toBe("set");
    expect(d.app_url).toBe("ok");
    expect(d.app_url_hint).toBeUndefined();
  });

  it("flags the old kaelus.ai host as suspect with a fix hint", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://kaelus.ai");
    const d = passwordResetDiagnostic();
    expect(d.app_url).toBe("suspect");
    expect(d.app_url_hint).toMatch(/kaelus/);
    expect(d.app_url_hint).toMatch(/houndshield\.com/);
  });

  it("flags localhost and Vercel preview hosts", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    expect(passwordResetDiagnostic().app_url).toBe("suspect");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://houndshield-preview.vercel.app");
    expect(passwordResetDiagnostic().app_url).toBe("suspect");
  });

  it("treats www.houndshield.com as ok", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.houndshield.com");
    expect(passwordResetDiagnostic().app_url).toBe("ok");
  });

  it("rejects a present-but-malformed key shape", () => {
    vi.stubEnv("RESEND_API_KEY", "not-a-real-key");
    expect(passwordResetDiagnostic().resend).toBe("missing");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "short");
    expect(passwordResetDiagnostic().service_role).toBe("missing");
  });

  it("never leaks the configured secret values", () => {
    const secretSR = "eyJsupersecretserviceRoleXXXXXXXXXXXXXXXXXXXXXX";
    const secretRe = "re_supersecretresendkeyYYYYYYYYYYYY";
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", secretSR);
    vi.stubEnv("RESEND_API_KEY", secretRe);
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://houndshield.com");
    const serialized = JSON.stringify(passwordResetDiagnostic());
    expect(serialized).not.toContain(secretSR);
    expect(serialized).not.toContain(secretRe);
    expect(serialized).not.toContain("supersecret");
  });
});
