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
 *   2. A network failure with NO cache returns `{ valid: true, plan: "pro",
 *      org_id: "offline" }`. Read in isolation that is a licence bypass: block
 *      houndshield.com at DNS and you mint yourself an unlimited Pro licence.
 *      It is here because Mode C (air-gapped) is a documented deployment mode
 *      and there is no other offline-licensing path in the proxy — so this
 *      branch IS how an air-gapped install gets a working proxy, and
 *      `org_id: "offline"` is the sentinel webhook.ts stamps on every event.
 *      These tests DOCUMENT that behaviour; they do not endorse it. Replacing
 *      it with a signed offline token is a product decision, and the test that
 *      changes is `offline with no cache …` below.
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

const INVALID = { valid: false, org_id: "", plan: "trial", expires_at: "" };

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
  it("returns an invalid trial licence and never calls the network", async () => {
    await expect(validateLicense("")).resolves.toEqual(INVALID);
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
    await expect(validateLicense(KEY)).resolves.toEqual(VALID_LICENSE);
  });

  it("caches the result, so a second call inside the TTL makes no request", async () => {
    fetchMock.mockResolvedValueOnce(ok(VALID_LICENSE));
    await validateLicense(KEY);

    vi.setSystemTime(new Date(Date.now() + 59 * 60 * 1000)); // 59 min: still fresh

    await expect(validateLicense(KEY)).resolves.toEqual(VALID_LICENSE);
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
    await expect(validateLicense(KEY)).resolves.toEqual(VALID_LICENSE);
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

    await expect(validateLicense(KEY)).resolves.toEqual(VALID_LICENSE);
  });

  it("falls back to the offline licence once the cache is older than 72h", async () => {
    fetchMock.mockResolvedValueOnce(ok(VALID_LICENSE));
    await validateLicense(KEY);

    vi.setSystemTime(new Date(Date.now() + 73 * HOUR_MS));
    fetchMock.mockRejectedValueOnce(new Error("ENOTFOUND"));

    await expect(validateLicense(KEY)).resolves.toEqual({
      valid: true,
      org_id: "offline",
      plan: "pro",
      expires_at: "",
    });
  });

  it("offline with no cache returns a valid Pro licence — the Mode C path", async () => {
    // Documents current behaviour, and is the test to change if entitlement
    // stops being inferred from network unreachability. See the file header.
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    await expect(validateLicense(KEY)).resolves.toEqual({
      valid: true,
      org_id: "offline",
      plan: "pro",
      expires_at: "",
    });
  });

  it("does not cache the offline licence, and retries on the next call", async () => {
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    await validateLicense(KEY);

    fetchMock.mockResolvedValueOnce(ok(VALID_LICENSE));
    await expect(validateLicense(KEY)).resolves.toEqual(VALID_LICENSE);
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
