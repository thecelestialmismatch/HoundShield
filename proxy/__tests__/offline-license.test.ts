/**
 * Signed offline licence (Mode C) tests.
 *
 * This is the capability that made it safe to delete the old bypass. The proxy
 * used to treat "houndshield.com is unreachable" as proof of entitlement, which
 * meant one firewall rule minted an unlimited Pro licence. It could not simply
 * be removed: air-gapped is a documented deployment mode and had no other
 * licensing path, so removing the branch would have broken the one deployment
 * CUI customers actually need.
 *
 * An offline licence is a bearer credential that works with no network, so the
 * tests that matter are the REJECTIONS. Every way a token could be abused is
 * exercised here against a real Ed25519 keypair generated per run:
 *
 *   - signed by the wrong key           (forged by anyone with a keygen)
 *   - payload edited after signing      (upgrade yourself to enterprise)
 *   - lifted from another customer      (bound to the wrong licence key)
 *   - expired                           (a licence that outlives the contract)
 *   - no public key configured          (verification silently skipped)
 *
 * A suite that only proved the happy path would pass against a function that
 * base64-decoded the payload and trusted it.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { generateKeyPairSync, sign, createHash, type KeyObject } from "node:crypto";

vi.mock("node-fetch", () => ({ default: vi.fn() }));

import fetch from "node-fetch";
import { validateLicense, clearLicenseCache } from "../license.js";

const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;

const KEY = "hs_live_abc123";
const OTHER_KEY = "hs_live_someone_else";
const keyHash = (k: string) => createHash("sha256").update(k).digest("hex");

const b64url = (buf: Buffer | string) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

let signing: { privateKey: KeyObject; publicKey: KeyObject };
let otherPair: { privateKey: KeyObject; publicKey: KeyObject };

/** Mint a token exactly the way `scripts/issue-offline-license.mjs` does. */
function mintToken(
  payload: Record<string, unknown>,
  privateKey: KeyObject = signing.privateKey
): string {
  const payloadB64 = b64url(JSON.stringify(payload));
  const sig = b64url(sign(null, Buffer.from(payloadB64, "utf8"), privateKey));
  return `${payloadB64}.${sig}`;
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    org_id: "org_42",
    plan: "enterprise",
    expires_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    key_hash: keyHash(KEY),
    ...overrides,
  };
}

beforeEach(() => {
  clearLicenseCache();
  fetchMock.mockReset();
  signing = generateKeyPairSync("ed25519");
  otherPair = generateKeyPairSync("ed25519");
  process.env.HOUNDSHIELD_LICENSE_PUBLIC_KEY = signing.publicKey
    .export({ type: "spki", format: "pem" })
    .toString();
});

afterEach(() => {
  delete process.env.HOUNDSHIELD_LICENSE_PUBLIC_KEY;
  delete process.env.HOUNDSHIELD_OFFLINE_LICENSE;
  clearLicenseCache();
  vi.restoreAllMocks();
});

describe("offline licence — the Mode C happy path", () => {
  it("grants the signed entitlement without touching the network", async () => {
    process.env.HOUNDSHIELD_OFFLINE_LICENSE = mintToken(validPayload());

    await expect(validateLicense(KEY)).resolves.toMatchObject({
      valid: true,
      org_id: "org_42",
      plan: "enterprise",
      source: "offline-token",
    });

    // The whole point: an air-gapped install must never depend on a round-trip
    // having succeeded at some earlier point in its life.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("wins over the network even when houndshield.com is reachable", async () => {
    // Checked before the cache and before the fetch, so a Mode C deployment
    // behaves identically whether or not it can see the internet that day.
    process.env.HOUNDSHIELD_OFFLINE_LICENSE = mintToken(validPayload());
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });

    await expect(validateLicense(KEY)).resolves.toMatchObject({ source: "offline-token" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("carries the issued expiry through unchanged", async () => {
    const expires = new Date(Date.now() + 5 * 86_400_000).toISOString();
    process.env.HOUNDSHIELD_OFFLINE_LICENSE = mintToken(validPayload({ expires_at: expires }));

    await expect(validateLicense(KEY)).resolves.toMatchObject({ expires_at: expires });
  });
});

describe("offline licence — rejections", () => {
  /** Every rejection must fall through to the network path, never grant. */
  async function expectRejected() {
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    await expect(validateLicense(KEY)).resolves.toMatchObject({
      valid: false,
      source: "unverified",
    });
  }

  it("rejects a token signed by a different key", async () => {
    process.env.HOUNDSHIELD_OFFLINE_LICENSE = mintToken(validPayload(), otherPair.privateKey);
    await expectRejected();
  });

  it("rejects a payload edited after signing", async () => {
    // The upgrade-yourself attack: take a real trial token, swap the plan.
    const token = mintToken(validPayload({ plan: "trial" }));
    const [, sig] = token.split(".");
    const tampered = b64url(JSON.stringify(validPayload({ plan: "enterprise" })));

    process.env.HOUNDSHIELD_OFFLINE_LICENSE = `${tampered}.${sig}`;
    await expectRejected();
  });

  it("rejects a token issued for a different licence key", async () => {
    // The resale attack: lift a token out of someone's compose file. Without
    // their licence key too, it is inert.
    process.env.HOUNDSHIELD_OFFLINE_LICENSE = mintToken(
      validPayload({ key_hash: keyHash(OTHER_KEY) })
    );
    await expectRejected();
  });

  it("rejects an expired token", async () => {
    process.env.HOUNDSHIELD_OFFLINE_LICENSE = mintToken(
      validPayload({ expires_at: new Date(Date.now() - 1000).toISOString() })
    );
    await expectRejected();
  });

  it("rejects a token whose expiry is not a date", async () => {
    process.env.HOUNDSHIELD_OFFLINE_LICENSE = mintToken(validPayload({ expires_at: "forever" }));
    await expectRejected();
  });

  it("rejects a token when no public key is configured", async () => {
    // Verification must never be skipped just because the verifier is missing.
    delete process.env.HOUNDSHIELD_LICENSE_PUBLIC_KEY;
    process.env.HOUNDSHIELD_OFFLINE_LICENSE = mintToken(validPayload());
    await expectRejected();
  });

  it("rejects a token when the configured public key is unreadable", async () => {
    process.env.HOUNDSHIELD_LICENSE_PUBLIC_KEY = "not a pem";
    process.env.HOUNDSHIELD_OFFLINE_LICENSE = mintToken(validPayload());
    await expectRejected();
  });

  it("rejects a malformed token with no signature separator", async () => {
    process.env.HOUNDSHIELD_OFFLINE_LICENSE = "just-one-segment";
    await expectRejected();
  });

  it("rejects a token whose payload is not JSON", async () => {
    const payloadB64 = b64url("this is not json");
    const sig = b64url(sign(null, Buffer.from(payloadB64, "utf8"), signing.privateKey));
    process.env.HOUNDSHIELD_OFFLINE_LICENSE = `${payloadB64}.${sig}`;
    await expectRejected();
  });

  it("ignores an empty token rather than treating it as a claim", async () => {
    process.env.HOUNDSHIELD_OFFLINE_LICENSE = "   ";
    await expectRejected();
  });
});

describe("offline licence — the key still never leaves the process", () => {
  it("does not transmit or embed the raw licence key", async () => {
    // The token carries a HASH of the key, matching the online path's contract.
    const token = mintToken(validPayload());
    process.env.HOUNDSHIELD_OFFLINE_LICENSE = token;

    await validateLicense(KEY);

    expect(token).not.toContain(KEY);
    expect(Buffer.from(token.split(".")[0], "base64").toString("utf8")).toContain(keyHash(KEY));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
