import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { clientIp, enforceRateLimit, identifierFor } from "@/lib/rate-limit-shared";

/**
 * POST /api/license/validate
 *
 * The endpoint every Mode B proxy has been calling since it shipped.
 *
 * `proxy/license.ts` has always pointed at
 * `https://houndshield.com/api/license/validate`. That route did not exist, so
 * every deployed container got a 404 on every licence check, fell into the
 * catch branch, and — until the proxy fix landed alongside this — minted itself
 * an unlimited Pro licence. A licence system whose server was never built is
 * not a lax licence system; it is an absent one.
 *
 * ── The privacy boundary, which is the whole design ────────────────────────
 *
 * The proxy sends a SHA-256 HASH of the licence key and nothing else. This
 * route therefore never sees, stores or logs a raw credential, and a request
 * carrying anything other than 64 hex characters is REJECTED rather than
 * helpfully hashed for the caller: silently accepting a raw key would train
 * clients to send one, and the next leak would be in a request log.
 *
 * Nothing about the customer's prompts, traffic volume or environment is
 * transmitted or returned. The response is entitlement only.
 *
 * ── Fail closed ───────────────────────────────────────────────────────────
 *
 * Any database error returns `valid: false`. The proxy's job on a false is not
 * to fall over — it refuses new traffic and tells the operator to configure a
 * signed offline licence — so failing closed here costs an air-gapped customer
 * nothing and costs an unlicensed one everything, which is the correct way
 * round.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Unauthenticated and database-backed, and every proxy in the field polls it
 * hourly. Shared Postgres buckets, deliberately not dependent on middleware —
 * the same reasoning `/api/scan` and `/api/report/snapshot-lead` record.
 * Generous relative to those two because a legitimate fleet of containers
 * behind one NAT is a normal customer, not an attack.
 */
const LICENSE_RATE_LIMIT = { limit: 60, windowMs: 60_000 };

/** Exactly one SHA-256 digest, lowercase hex. Nothing else is a licence claim. */
const ValidateSchema = z
  .object({ key_hash: z.string().regex(/^[a-f0-9]{64}$/, "key_hash must be a SHA-256 hex digest") })
  .strict();

/** Entitlement shape the proxy's `LicenseInfo` expects, field for field. */
interface LicenseResponse {
  valid: boolean;
  org_id: string;
  plan: "pro" | "growth" | "enterprise" | "agency" | "trial";
  expires_at: string;
}

const DENIED: LicenseResponse = { valid: false, org_id: "", plan: "trial", expires_at: "" };

/**
 * `organizations.subscription_tier` → the proxy's plan vocabulary.
 *
 * Two vocabularies exist because they were written for different products
 * (ShieldReady tiers vs proxy plans) and renaming a billing column that Stripe
 * webhooks write to is a migration, not a mapping. An unrecognised tier maps to
 * `trial` rather than defaulting generously — an unknown value is a reason to
 * grant less, never more.
 */
const TIER_TO_PLAN: Record<string, LicenseResponse["plan"]> = {
  free: "trial",
  starter: "pro",
  professional: "growth",
  enterprise: "enterprise",
  consultant: "agency",
};

function deny(): NextResponse {
  return NextResponse.json(DENIED, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const blocked = await enforceRateLimit(
    identifierFor("license-validate", clientIp(request)),
    LICENSE_RATE_LIMIT
  );
  if (blocked) return blocked;

  let parsed: z.infer<typeof ValidateSchema>;
  try {
    parsed = ValidateSchema.parse(await request.json());
  } catch {
    // Deliberately not 400-with-details: an unauthenticated caller learns only
    // that the request was not a valid licence claim.
    return NextResponse.json(
      { error: "key_hash must be a SHA-256 hex digest" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Not configured is not "allow everything". A deployment with no database
  // cannot establish entitlement, and says so.
  if (!isSupabaseConfigured()) return deny();

  try {
    const supabase = createServiceClient();

    const { data: keyRow, error: keyError } = await supabase
      .from("api_keys")
      .select("id, user_id")
      .eq("key_hash", parsed.key_hash)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (keyError || !keyRow) return deny();

    const { data: membership, error: memberError } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", keyRow.user_id)
      .limit(1)
      .maybeSingle();

    if (memberError || !membership) return deny();

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, subscription_tier")
      .eq("id", membership.org_id)
      .limit(1)
      .maybeSingle();

    if (orgError || !org) return deny();

    const plan = TIER_TO_PLAN[org.subscription_tier as string] ?? "trial";

    // A free-tier organisation is a real org with a real key and no
    // entitlement. Returning valid:true with plan:"trial" would hand it the
    // product; the tier IS the answer to "are they paying".
    if (plan === "trial") return deny();

    // Best-effort last-used stamp, mirroring resolveApiKey. Never block on it.
    void supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", keyRow.id);

    /*
     * `expires_at` is the proxy's cache horizon, not a billing date. It is
     * deliberately short: the proxy re-checks hourly anyway, and a revoked key
     * must stop working within the documented 72h grace rather than whenever a
     * subscription period happened to end.
     */
    const response: LicenseResponse = {
      valid: true,
      org_id: org.id as string,
      plan,
      expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    };

    return NextResponse.json(response, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Fail closed. No error detail reaches an unauthenticated caller.
    return deny();
  }
}
