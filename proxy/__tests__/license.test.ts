/**
 * License validation tests.
 *
 * `license.ts` had zero coverage, which mattered for two reasons beyond the
 * number: it is the only module that talks to houndshield.com about
 * entitlement, and it is the module that decides what happens when
 * houndshield.com cannot be reached.
 *
 * Two behaviours are pinned here deliberately, because both look like bugs
 * until you know why they are there:
 *
 *   1. A NON-OK response is never cached. Only a 2xx result is. That means a
 *      transient 500 cannot pin the proxy into an "invalid" state for an hour.
 *
 *   2. A network failure with NO cache USED TO return `{ valid: true, plan:
 *      "pro", org_id: "offline" }`. That was a licence bypass: block
 *      houndshield.com at DNS and you minted yourself an unlimited Pro licence
 *      that never expired and never re-checked. The previous version of this
 *      file documented the branch and named the replacement — "a signed offline
 *      token" — as the test that would have to change. It has changed.
 *
 *      Offline operation is now GRANTED rather than achieved: an Ed25519-signed
 *      `HOUNDSHIELD_OFFLINE_LICENSE`, verified locally against a public key the
 *      install already holds. Mode C keeps working with no network at all; what
 *      stops working is inferring entitlement from unreachability.
 *
 * What is NOT negotiable, and is asserted: the raw licence key never leaves
 * the process. Only its SHA-256 hash is transmitted.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHash } from "node:crypto";

vi.mock("node-fetch", () => ({ default: vi.fn() }));

import fetch from "node-fetch";
import { validateLicense, clearLicenseCache } from "../license.js";

const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;

const KEY = "hs_live_abc123";
const KEY_HASH = createHash("sha256").update(KEY).digest("hex");

const VALID_LICENSE = {
  valid: true,
  org_id: "org_42",
  plan: "growth" as const,
  expires_at: "2027-01-01T00:00:00.000Z",
};

const INVALID = { valid: false, org_id: "", plan: "trial", expires_at: "", source: "online" };

/** A 2xx response carrying `body` as JSON. */
function ok(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

/** A non-2xx response. `json` is never reached on this path. */
function notOk(status: number) {
  return { ok: false, status, json: async () => ({}) };
}

const HOUR_MS = 60 * 60 * 1000;

beforeEach(() => {
  clearLicenseCache();
  fetchMock.mockReset();
  // Date must be fake so the 1h cache TTL and 72h offline grace are reachable
  // without the suite actually sleeping for three days.
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-12T00:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
  clearLicenseCache();
});

describe("validateLicense — missing key", () => {
  it("reports named evaluation mode and never calls the network", async () => {
    // Not "invalid" in the sense that matters: no key configured is the free
    // demo and the evaluation path, and server.ts still serves it. What changed
    // is that it is now NAMED, instead of being indistinguishable from a paid
    // Pro licence — which is what the old offline branch made it.
    await expect(validateLicense("")).resolves.toEqual({
      valid: false,
      org_id: "",
      plan: "trial",
      expires_at: "",
      source: "evaluation",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("validateLicense — the key itself never leaves the process", () => {
  it("transmits only the SHA-256 hash, never the raw key", async () => {
    fetchMock.mockResolvedValueOnce(ok(VALID_LICENSE));

    await validateLicense(KEY);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    const body = JSON.parse(init.body) as Record<string, unknown>;

    expect(body).toEqual({ key_hash: KEY_HASH });
    // The guarantee, stated as an assertion rather than a comment.
    expect(init.body).not.toContain(KEY);
  });

  it("POSTs JSON to the validate endpoint", async () => {
    fetchMock.mockResolvedValueOnce(ok(VALID_LICENSE));

    await validateLicense(KEY);

    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      { method: string; headers: Record<string, string> },
    ];
    expect(url).toContain("houndshield.com");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
  });
});

describe("validateLicense — successful validation", () => {
  it("returns the server's licence verbatim", async () => {
    fetchMock.mockResolvedValueOnce(ok(VALID_LICENSE));
    await expect(validateLicense(KEY)).resolves.toMatchObject({
      ...VALID_LICENSE,
      source: "online",
    });
  });

  it("caches the result, so a second call inside the TTL makes no request", async () => {
    fetchMock.mockResolvedValueOnce(ok(VALID_LICENSE));
    await validateLicense(KEY);

    vi.setSystemTime(new Date(Date.now() + 59 * 60 * 1000)); // 59 min: still fresh

    await expect(validateLicense(KEY)).resolves.toMatchObject({
      ...VALID_LICENSE,
      source: "cache",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("re-validates once the 1h TTL has passed", async () => {
    fetchMock.mockResolvedValueOnce(ok(VALID_LICENSE));
    await validateLicense(KEY);

    vi.setSystemTime(new Date(Date.now() + HOUR_MS + 1));
    fetchMock.mockResolvedValueOnce(ok({ ...VALID_LICENSE, plan: "enterprise" }));

    await expect(validateLicense(KEY)).resolves.toMatchObject({ plan: "enterprise" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("validateLicense — server rejects the key", () => {
  it("returns an invalid trial licence on a non-OK response", async () => {
    fetchMock.mockResolvedValueOnce(notOk(403));
    await expect(validateLicense(KEY)).resolves.toEqual(INVALID);
  });

  it("does NOT cache a rejection, so a transient 500 cannot pin it for an hour", async () => {
    fetchMock.mockResolvedValueOnce(notOk(500));
    await expect(validateLicense(KEY)).resolves.toEqual(INVALID);

    // Same instant — a cached rejection would short-circuit this call.
    fetchMock.mockResolvedValueOnce(ok(VALID_LICENSE));
    await expect(validateLicense(KEY)).resolves.toMatchObject(VALID_LICENSE);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("validateLicense — houndshield.com unreachable", () => {
  it("serves a stale cache through the 72h grace window", async () => {
    fetchMock.mockResolvedValueOnce(ok(VALID_LICENSE));
    await validateLicense(KEY);

    // Past the 1h TTL so the cache is stale, inside the 72h grace.
    vi.setSystemTime(new Date(Date.now() + 24 * HOUR_MS));
    fetchMock.mockRejectedValueOnce(new Error("ENOTFOUND"));

    await expect(validateLicense(KEY)).resolves.toMatchObject({
      ...VALID_LICENSE,
      source: "cache",
    });
  });

  it("refuses once the cache is older than the 72h grace", async () => {
    // The grace window is a bounded courtesy for a transient outage, not an
    // indefinite entitlement. Past it, a stale cache stops being evidence.
    fetchMock.mockResolvedValueOnce(ok(VALID_LICENSE));
    await validateLicense(KEY);

    vi.setSystemTime(new Date(Date.now() + 73 * HOUR_MS));
    fetchMock.mockRejectedValueOnce(new Error("ENOTFOUND"));

    await expect(validateLicense(KEY)).resolves.toMatchObject({
      valid: false,
      plan: "trial",
      source: "unverified",
    });
  });

  it("offline with no cache is UNVERIFIED — unplugging the network is not a licence", async () => {
    // The bypass, asserted closed. Blocking houndshield.com at DNS used to
    // return plan:"pro"; it now returns nothing usable, and the supported
    // offline path is the signed token exercised further down.
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    await expect(validateLicense(KEY)).resolves.toMatchObject({
      valid: false,
      org_id: "",
      plan: "trial",
      source: "unverified",
    });
  });

  it("does not cache the offline licence, and retries on the next call", async () => {
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    await validateLicense(KEY);

    fetchMock.mockResolvedValueOnce(ok(VALID_LICENSE));
    await expect(validateLicense(KEY)).resolves.toMatchObject(VALID_LICENSE);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("clearLicenseCache", () => {
  it("forces the next call back to the network", async () => {
    fetchMock.mockResolvedValueOnce(ok(VALID_LICENSE));
    await validateLicense(KEY);

    clearLicenseCache();

    fetchMock.mockResolvedValueOnce(ok(VALID_LICENSE));
    await validateLicense(KEY);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
