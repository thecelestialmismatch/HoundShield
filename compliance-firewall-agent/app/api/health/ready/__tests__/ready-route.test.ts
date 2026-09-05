import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * Readiness diagnostic — access control and disclosure boundary.
 *
 * This route exists because the daily pre-flight in CLAUDE.md
 * (`curl .../api/health`) returns green under every failure condition it exists
 * to detect, and `/api/admin/health` needs a browser session so it cannot serve
 * a terminal. It is the only route in the app that publishes per-control state,
 * so the tests that matter are the ones proving it stays shut.
 *
 * The disclosure assertions are the point. A route that leaks its own existence
 * to an unauthenticated caller — a 401 instead of a 404, an error naming the
 * expected header — is an oracle worth grinding, and this one reports which
 * security controls are currently switched off.
 */

const REAL = "hs_health_0123456789abcdef0123456789abcdef";

vi.mock("@/lib/health/service-status", () => ({
  buildHealthReport: vi.fn(async () => ({
    services: { database: "connected", payments_webhook: "not_configured" },
    degraded: ["payments_webhook"],
  })),
}));

async function get(headers: Record<string, string> = {}) {
  vi.resetModules();
  const { GET } = await import("../route");
  return GET(new NextRequest("https://www.houndshield.com/api/health/ready", { headers }));
}

beforeEach(() => {
  process.env.HEALTH_DIAGNOSTIC_TOKEN = REAL;
});

afterEach(() => {
  delete process.env.HEALTH_DIAGNOSTIC_TOKEN;
});

describe("readiness diagnostic — stays shut", () => {
  it("404s an anonymous caller", async () => {
    const res = await get();
    expect(res.status).toBe(404);
  });

  it("404s a wrong token, indistinguishably from a missing route", async () => {
    const anon = await get();
    const wrong = await get({ "x-health-token": "hs_health_wrong" });

    expect(wrong.status).toBe(anon.status);
    expect(await wrong.json()).toEqual(await anon.json());
  });

  it("404s when no token is configured, rather than opening the route", async () => {
    // Fail closed. The opposite default would publish per-control state on
    // every deployment that had not been configured yet — which is every new one.
    delete process.env.HEALTH_DIAGNOSTIC_TOKEN;
    expect((await get({ "x-health-token": REAL })).status).toBe(404);
  });

  it("404s when the configured token is blank", async () => {
    process.env.HEALTH_DIAGNOSTIC_TOKEN = "   ";
    expect((await get({ "x-health-token": "   " })).status).toBe(404);
  });

  it("rejects a token that is a prefix of the real one", async () => {
    expect((await get({ "x-health-token": REAL.slice(0, -1) })).status).toBe(404);
  });

  it("rejects a token that merely starts with the real one", async () => {
    expect((await get({ "x-health-token": REAL + "x" })).status).toBe(404);
  });

  it("discloses nothing about the expected credential in the failure body", async () => {
    const body = JSON.stringify(await (await get()).json());
    expect(body).not.toContain("x-health-token");
    expect(body).not.toContain("HEALTH_DIAGNOSTIC_TOKEN");
    expect(body).not.toContain("payments_webhook");
    expect(body).not.toContain(REAL);
  });
});

describe("readiness diagnostic — opens for the operator", () => {
  it("reports the degraded controls to a correct token", async () => {
    const res = await get({ "x-health-token": REAL });
    expect(res.status).toBe(200);

    await expect(res.json()).resolves.toEqual({
      status: "degraded",
      degraded: ["payments_webhook"],
      services: { database: "connected", payments_webhook: "not_configured" },
    });
  });

  it("accepts the token as an Authorization bearer, for tooling that cannot set headers", async () => {
    const res = await get({ authorization: `Bearer ${REAL}` });
    expect(res.status).toBe(200);
  });

  it("reports ok when nothing is degraded", async () => {
    const mod = await import("@/lib/health/service-status");
    vi.mocked(mod.buildHealthReport).mockResolvedValueOnce({
      services: { database: "connected" },
      degraded: [],
    });

    const res = await get({ "x-health-token": REAL });
    await expect(res.json()).resolves.toMatchObject({ status: "ok", degraded: [] });
  });

  it("is never cached — a stale green is worse than no answer", async () => {
    const res = await get({ "x-health-token": REAL });
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("also sets no-store on the 404, so a rejection cannot be cached either", async () => {
    const res = await get();
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("readiness diagnostic — the public probe is untouched", () => {
  it("leaves /api/health as a bare liveness response", async () => {
    // The boundary this route exists to preserve: the public, unauthenticated
    // probe must keep publishing nothing. `health-liveness-contract.test.ts`
    // asserts the same thing from the source side; this asserts the behaviour.
    vi.resetModules();
    const { GET: publicGet } = await import("../../route");
    const res = await publicGet();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "ok" });
  });
});
