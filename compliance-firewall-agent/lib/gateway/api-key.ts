import { createHash, randomBytes } from "crypto";
import { isSupabaseConfigured, createServiceClient } from "@/lib/supabase/client";

/**
 * Gateway API-key resolution.
 *
 * SECURITY (fixes audit C2): every gateway route must authenticate the caller
 * with a real API key that maps — server-side — to a specific user. The caller
 * MUST NOT be trusted to declare their own identity or tier via an `x-user-id`
 * header. This module is the single source of truth for that mapping.
 *
 * Fail-closed contract:
 *   - Supabase NOT configured  → demo mode. Accept any non-empty key, resolve to
 *     a synthetic "demo" user. No real customer data exists in this mode.
 *   - Supabase configured but the api_keys table is missing, or the key is
 *     unknown/inactive → REJECT (return null). Never fall back to "any string".
 */

const DEMO_USER_ID = "demo-user";

export type ResolvedKey = {
  userId: string;
  keyId: string | null;
  demo: boolean;
};

/** Hash a raw API key for storage/lookup. Never store the raw key. */
export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Generate a new raw API key + its storage record fields.
 * The raw key is returned once to the caller and never persisted in the clear.
 */
export function generateApiKey(): { rawKey: string; keyHash: string; keyPrefix: string } {
  const secret = randomBytes(24).toString("base64url");
  const rawKey = `hs_live_${secret}`;
  return {
    rawKey,
    keyHash: hashApiKey(rawKey),
    keyPrefix: `${rawKey.slice(0, 12)}…`,
  };
}

/**
 * Resolve an incoming API key to a user. Returns null when the key is invalid
 * or cannot be verified (fail closed). Callers should treat null as 401, and a
 * thrown DB-unavailable error as 503.
 */
export async function resolveApiKey(rawKey: string | null | undefined): Promise<ResolvedKey | null> {
  if (!rawKey || rawKey.length === 0) return null;

  // Demo mode: no real data, accept any non-empty key.
  if (!isSupabaseConfigured()) {
    return { userId: DEMO_USER_ID, keyId: null, demo: true };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, user_id")
    .eq("key_hash", hashApiKey(rawKey))
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    // 42P01 = undefined_table. In a CONFIGURED (production) environment this is
    // a deployment error, and we must fail CLOSED rather than accept any key.
    // Signal the caller to return 503.
    if (error.code === "42P01") {
      throw new ApiKeyBackendUnavailable(
        "api_keys table missing — run migrations. Refusing to accept keys."
      );
    }
    // Any other DB error: fail closed.
    return null;
  }

  if (!data) return null;

  // Best-effort last-used stamp; never block the request on it.
  void supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return { userId: data.user_id as string, keyId: data.id as string, demo: false };
}

/** Thrown when the key backend is unreachable/missing in a configured env. */
export class ApiKeyBackendUnavailable extends Error {}
