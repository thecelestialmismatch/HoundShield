import { describe, it, expect } from "vitest";
import { isAllowedOrigin } from "@/lib/auth/origin-guard";

/**
 * Audit finding #1 — CSRF. The asymmetry is the design: an ABSENT Origin is
 * allowed (non-browser callers never send one), a PRESENT non-matching Origin
 * is refused.
 */

const APP = "https://houndshield.com";

describe("isAllowedOrigin — allows what is not a browser cross-site request", () => {
  it("allows a request with no Origin header at all", () => {
    // curl, server-to-server, and same-origin GET/HEAD. Requiring an Origin
    // here would break every non-browser caller to stop a browser-only attack.
    expect(isAllowedOrigin({ origin: null, host: "houndshield.com", appUrl: APP })).toBe(true);
    expect(isAllowedOrigin({ origin: undefined, host: "houndshield.com", appUrl: APP })).toBe(true);
  });

  it("allows same-origin by comparing Origin to Host, with no configuration", () => {
    // This is what makes preview deployments work without an env var per URL.
    expect(
      isAllowedOrigin({
        origin: "https://compliance-firewall-agent-abc123.vercel.app",
        host: "compliance-firewall-agent-abc123.vercel.app",
        appUrl: APP,
      }),
    ).toBe(true);
  });

  it("allows localhost in development without special-casing NODE_ENV", () => {
    expect(
      isAllowedOrigin({ origin: "http://localhost:3000", host: "localhost:3000", appUrl: "" }),
    ).toBe(true);
  });

  it("treats apex and www as the same site, in both directions", () => {
    // next.config.js redirects www -> apex, but CLAUDE.md still calls
    // www.houndshield.com canonical. Rejecting either would be a live outage on
    // whichever half of that disagreement a real user landed on.
    expect(
      isAllowedOrigin({ origin: "https://www.houndshield.com", host: "houndshield.com", appUrl: APP }),
    ).toBe(true);
    expect(
      isAllowedOrigin({
        origin: "https://houndshield.com",
        host: "www.houndshield.com",
        appUrl: "https://www.houndshield.com",
      }),
    ).toBe(true);
  });

  it("allows the configured app URL even when Host differs", () => {
    // e.g. behind a proxy that rewrites Host.
    expect(
      isAllowedOrigin({ origin: APP, host: "internal-lb.local", appUrl: APP }),
    ).toBe(true);
  });
});

describe("isAllowedOrigin — refuses a browser driven from someone else's page", () => {
  it("refuses a foreign origin", () => {
    expect(
      isAllowedOrigin({ origin: "https://evil.example", host: "houndshield.com", appUrl: APP }),
    ).toBe(false);
  });

  it("refuses a lookalike that merely contains our host", () => {
    // The classic bug in hand-rolled origin checks: `origin.includes(appHost)`.
    for (const origin of [
      "https://houndshield.com.evil.example",
      "https://evil.example/?x=houndshield.com",
      "https://nothoundshield.com",
    ]) {
      expect(isAllowedOrigin({ origin, host: "houndshield.com", appUrl: APP }), origin).toBe(false);
    }
  });

  it('refuses the literal "null" origin sent by sandboxed iframes', () => {
    // Must not be normalised into the "no origin" allow path.
    expect(isAllowedOrigin({ origin: "null", host: "houndshield.com", appUrl: APP })).toBe(false);
  });

  it("refuses a present-but-unparseable Origin rather than ignoring it", () => {
    expect(isAllowedOrigin({ origin: "not-a-url", host: "houndshield.com", appUrl: APP })).toBe(
      false,
    );
  });

  it("refuses a foreign origin even when no app URL is configured", () => {
    // Absent configuration must not become an allow-all.
    expect(
      isAllowedOrigin({ origin: "https://evil.example", host: "houndshield.com", appUrl: "" }),
    ).toBe(false);
  });

  it("distinguishes ports — a different port is a different origin", () => {
    expect(
      isAllowedOrigin({ origin: "http://localhost:4000", host: "localhost:3000", appUrl: "" }),
    ).toBe(false);
  });
});
