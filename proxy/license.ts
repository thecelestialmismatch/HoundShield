/**
 * Kaelus Proxy — license key validation.
 *
 * Validates the Kaelus license key against kaelus.online/api/license/validate.
 * Sends: { key_hash } — SHA-256 hash of the license key. Never the raw key.
 * Receives: { valid, org_id, plan, expires_at }
 *
 * Caches a valid result for 1 hour to avoid repeated network calls.
 * Falls back to OFFLINE_GRACE_HOURS if kaelus.online is unreachable.
 */

import { createHash } from "node:crypto";
import fetch from "node-fetch";

export interface LicenseInfo {
  valid: boolean;
  org_id: string;
  plan: "pro" | "growth" | "enterprise" | "agency" | "trial";
  expires_at: string;
}

interface CacheEntry {
  info: LicenseInfo;
  cached_at: number;
}

const VALIDATE_URL =
  process.env.KAELUS_API_URL ?? "https://kaelus.online/api/license/validate";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const OFFLINE_GRACE_MS = 72 * 60 * 60 * 1000; // 72 hours

let _cache: CacheEntry | null = null;

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Validates the license key.
 * - Returns cached result if fresh.
 * - Falls back to stale cache if API unreachable (grace period).
 * - Returns invalid if key is missing.
 */
export async function validateLicense(
  licenseKey: string
): Promise<LicenseInfo> {
  if (!licenseKey) {
    return { valid: false, org_id: "", plan: "trial", expires_at: "" };
  }

  // Return fresh cache
  if (_cache && Date.now() - _cache.cached_at < CACHE_TTL_MS) {
    return _cache.info;
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
      return { valid: false, org_id: "", plan: "trial", expires_at: "" };
    }

    const data = (await res.json()) as LicenseInfo;
    _cache = { info: data, cached_at: Date.now() };
    return data;
  } catch {
    // Network unreachable — grace period using stale cache
    if (_cache && Date.now() - _cache.cached_at < OFFLINE_GRACE_MS) {
      return _cache.info;
    }
    // No cache at all — allow with empty org_id so proxy still functions
    // (blocks CUI regardless — safety is never degraded by network failure)
    return {
      valid: true,
      org_id: "offline",
      plan: "pro",
      expires_at: "",
    };
  }
}

/** Clears cached license (for testing). */
export function clearLicenseCache(): void {
  _cache = null;
}
