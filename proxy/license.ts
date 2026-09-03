/**
 * Hound Shield Proxy — license key validation.
 *
 * Validates the Hound Shield license key against houndshield.com/api/license/validate.
 * Sends: { key_hash } — SHA-256 hash of the license key. Never the raw key.
 * Receives: { valid, org_id, plan, expires_at }
 *
 * Caches a valid result for 1 hour to avoid repeated network calls.
 * Falls back to a stale cache for OFFLINE_GRACE_HOURS if houndshield.com is
 * unreachable, and to a SIGNED OFFLINE LICENCE beyond that.
 *
 * ─── The bypass this file used to contain ──────────────────────────────────
 *
 * A network failure with no usable cache returned
 * `{ valid: true, org_id: "offline", plan: "pro" }`. Entitlement was inferred
 * from unreachability, so blocking houndshield.com at DNS — one line in
 * /etc/hosts, one firewall rule, one `docker run --network none` — minted an
 * unlimited Pro licence that never expired and never re-checked.
 *
 * That branch existed for a real reason: Mode C (air-gapped) is a documented
 * deployment mode, and the proxy had no other offline-licensing path. Deleting
 * the branch without replacing the capability would have broken the one
 * deployment mode CUI customers actually need.
 *
 * So the capability is replaced rather than removed. `HOUNDSHIELD_OFFLINE_LICENSE`
 * carries an Ed25519-signed entitlement that an air-gapped install can verify
 * locally, with no network, against a public key it already holds. Offline
 * operation is now something you are GRANTED, not something you achieve by
 * unplugging a cable.
 *
 * ─── What did NOT change, deliberately ─────────────────────────────────────
 *
 * With no licence key configured at all, the proxy still runs. That is the
 * evaluation path and the free demo, and turning the open-source proxy into a
 * hard-gated product is a pricing decision, not a security fix — CLAUDE.md's
 * Stage 1 is "prove the $499 report sells", and the proxy is not the paid SKU.
 * What changed is that this state is now NAMED (`plan: "evaluation"`) instead
 * of being indistinguishable from a paid Pro licence.
 */

import { createHash, verify as verifySignature, createPublicKey, KeyObject } from "node:crypto";
import fetch from "node-fetch";

export type LicensePlan =
  | "pro"
  | "growth"
  | "enterprise"
  | "agency"
  | "trial"
  | "evaluation";

export interface LicenseInfo {
  valid: boolean;
  org_id: string;
  plan: LicensePlan;
  expires_at: string;
  /** How this entitlement was established. Reported by /health, never guessed. */
  source?: "online" | "cache" | "offline-token" | "evaluation" | "unverified";
}

interface CacheEntry {
  info: LicenseInfo;
  cached_at: number;
}

const VALIDATE_URL =
  process.env.HOUNDSHIELD_API_URL ?? "https://houndshield.com/api/license/validate";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const OFFLINE_GRACE_MS = 72 * 60 * 60 * 1000; // 72 hours

let _cache: CacheEntry | null = null;

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/** The shape returned when there is no entitlement. Never cached. */
function unlicensed(source: LicenseInfo["source"]): LicenseInfo {
  return { valid: false, org_id: "", plan: "trial", expires_at: "", source };
}

// ── Signed offline licence (Mode C) ─────────────────────────────────────────

/**
 * Payload of an offline licence token.
 *
 * `key_hash` binds the token to one licence key, so a token issued for customer
 * A cannot be lifted out of their compose file and used by customer B — the
 * holder would need A's licence key too, which is the thing they were trying
 * not to buy.
 */
interface OfflineLicensePayload {
  org_id: string;
  plan: LicensePlan;
  expires_at: string;
  key_hash: string;
}

/**
 * SPKI PEM of the Ed25519 public key offline tokens are signed with.
 *
 * There is deliberately NO baked-in default. A public key shipped in this file
 * would have to be one whose private half HoundShield actually controls;
 * inventing one here would produce a feature that looks enabled and can never
 * verify a real token. Generate the pair once with
 * `node scripts/issue-offline-license.mjs --new-keypair`, keep the private key
 * offline, and set this variable on every deployment that needs Mode C.
 */
function offlinePublicKey(): KeyObject | null {
  const pem = process.env.HOUNDSHIELD_LICENSE_PUBLIC_KEY?.trim();
  if (!pem) return null;
  try {
    return createPublicKey(pem.includes("\\n") ? pem.replace(/\\n/g, "\n") : pem);
  } catch {
    console.error(
      "[houndshield] HOUNDSHIELD_LICENSE_PUBLIC_KEY is not a readable SPKI public key — offline licensing is disabled"
    );
    return null;
  }
}

function b64urlToBuffer(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

/**
 * Verify `HOUNDSHIELD_OFFLINE_LICENSE`, if one is configured.
 *
 * Returns null — never a partial or "probably fine" licence — whenever the
 * token is absent, malformed, unsigned by the configured key, bound to a
 * different licence key, or expired. Every rejection is logged with the reason,
 * because an air-gapped operator has no other way to find out why the proxy
 * refused: there is no support call to make from inside the enclave.
 */
function readOfflineLicense(licenseKey: string): LicenseInfo | null {
  const token = process.env.HOUNDSHIELD_OFFLINE_LICENSE?.trim();
  if (!token) return null;

  const key = offlinePublicKey();
  if (!key) {
    console.error(
      "[houndshield] HOUNDSHIELD_OFFLINE_LICENSE is set but HOUNDSHIELD_LICENSE_PUBLIC_KEY is not — cannot verify the token"
    );
    return null;
  }

  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) {
    console.error("[houndshield] offline licence rejected: expected <payload>.<signature>");
    return null;
  }

  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);

  let signed: boolean;
  try {
    // Ed25519 takes the message directly; the algorithm argument must be null.
    signed = verifySignature(
      null,
      Buffer.from(payloadB64, "utf8"),
      key,
      b64urlToBuffer(sigB64)
    );
  } catch {
    console.error("[houndshield] offline licence rejected: signature could not be checked");
    return null;
  }

  if (!signed) {
    console.error("[houndshield] offline licence rejected: signature does not verify");
    return null;
  }

  let payload: OfflineLicensePayload;
  try {
    payload = JSON.parse(b64urlToBuffer(payloadB64).toString("utf8")) as OfflineLicensePayload;
  } catch {
    console.error("[houndshield] offline licence rejected: payload is not JSON");
    return null;
  }

  if (payload.key_hash !== hashKey(licenseKey)) {
    console.error(
      "[houndshield] offline licence rejected: issued for a different licence key"
    );
    return null;
  }

  const expiry = Date.parse(payload.expires_at);
  if (!Number.isFinite(expiry)) {
    console.error("[houndshield] offline licence rejected: expires_at is not a date");
    return null;
  }
  if (expiry <= Date.now()) {
    console.error(`[houndshield] offline licence rejected: expired ${payload.expires_at}`);
    return null;
  }

  return {
    valid: true,
    org_id: payload.org_id,
    plan: payload.plan,
    expires_at: payload.expires_at,
    source: "offline-token",
  };
}

// ── Validation ──────────────────────────────────────────────────────────────

/**
 * Validates the license key.
 * - No key at all → named evaluation mode (still runs; see the file header).
 * - A valid signed offline token wins outright and makes no network call.
 * - Returns cached result if fresh.
 * - Falls back to a stale cache while inside the 72h grace.
 * - Otherwise UNVERIFIED. Entitlement is never inferred from unreachability.
 */
export async function validateLicense(licenseKey: string): Promise<LicenseInfo> {
  if (!licenseKey) {
    return { valid: false, org_id: "", plan: "trial", expires_at: "", source: "evaluation" };
  }

  // Checked before the cache: an air-gapped install must never depend on a
  // network round-trip having succeeded at some earlier point in its life.
  const offline = readOfflineLicense(licenseKey);
  if (offline) return offline;

  // Return fresh cache
  if (_cache && Date.now() - _cache.cached_at < CACHE_TTL_MS) {
    return { ..._cache.info, source: "cache" };
  }

  const key_hash = hashKey(licenseKey);

  try {
    const res = await fetch(VALIDATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key_hash }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      // Server said key is invalid — don't cache
      return unlicensed("online");
    }

    const data = (await res.json()) as LicenseInfo;
    _cache = { info: data, cached_at: Date.now() };
    return { ...data, source: "online" };
  } catch {
    // Network unreachable — grace period using stale cache
    if (_cache && Date.now() - _cache.cached_at < OFFLINE_GRACE_MS) {
      return { ..._cache.info, source: "cache" };
    }

    /*
     * No cache, or a cache older than the documented grace window.
     *
     * This returned `{ valid: true, plan: "pro" }`. It no longer does. For a
     * genuinely disconnected deployment the supported path is a signed
     * HOUNDSHIELD_OFFLINE_LICENSE, checked at the top of this function — an
     * entitlement someone issued, rather than one the absence of a network
     * conjured.
     */
    console.error(
      "[houndshield] licence could not be verified and no usable cache remains. " +
        "For an air-gapped deployment set HOUNDSHIELD_OFFLINE_LICENSE and HOUNDSHIELD_LICENSE_PUBLIC_KEY."
    );
    return unlicensed("unverified");
  }
}

/** Clears cached license (for testing). */
export function clearLicenseCache(): void {
  _cache = null;
}
