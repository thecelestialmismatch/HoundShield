/**
 * Gateway API keys — list, mint, revoke.
 *
 * WHY THIS EXISTS — the bug it closes:
 *
 * `generateApiKey()` has been implemented in `lib/gateway/api-key.ts` since the
 * audit-C2 fix, the `api_keys` table has existed since migration 019, and the
 * gateway has resolved keys against it fail-closed ever since. Nothing ever
 * called `generateApiKey()`. There was no route and no UI, so `api_keys` had
 * zero rows and no customer could obtain a working credential.
 *
 * Meanwhile Settings displayed a `kls_<user-id>` string with a Reveal button, a
 * Copy button and the instruction "include this key in the x-api-key header" —
 * a value that was never hashed into `api_keys` and that `resolveApiKey` would
 * therefore reject with 401. Following the product's own instructions could not
 * work. That is the first link in the chain that left the dashboard empty: no
 * usable key → no gateway traffic → no compliance events → no data.
 *
 * SECURITY:
 *   - Identity comes from the session (`requireUser`), never from the body.
 *     A caller cannot mint a key for another user because there is no input
 *     that names one.
 *   - The raw key is returned EXACTLY ONCE, from POST, and never persisted in
 *     the clear — only its SHA-256 hash and a non-secret display prefix are
 *     stored. GET can therefore never re-reveal it, by construction.
 *   - Revocation is scoped by `user_id` in the update itself, so a guessed key
 *     id belonging to someone else matches zero rows.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/api-guard";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { generateApiKey } from "@/lib/gateway/api-key";
import { enforceRateLimit, LLM_RATE_LIMITS } from "@/lib/rate-limit-shared";
import { getUserSubscription, canAccessGateway } from "@/lib/subscription/check";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Keys a single account may hold at once. Rotation needs two (mint the new
 *  one, move traffic, revoke the old), so the ceiling is well above that but
 *  still bounded — an unbounded mint endpoint is a storage amplifier. */
const MAX_ACTIVE_KEYS = 10;

const NAME_MAX = 60;

function notConfigured(): NextResponse {
  return NextResponse.json(
    {
      error:
        "Gateway keys require the database. This deployment is running without Supabase configured.",
    },
    { status: 503 }
  );
}

/** GET — the caller's own keys. Prefixes and metadata only; never a secret. */
export async function GET(): Promise<NextResponse> {
  const auth = await requireUser();
  if (!auth.user) return auth.response;
  if (!isSupabaseConfigured()) return notConfigured();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, key_prefix, name, is_active, created_at, last_used_at, revoked_at")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[gateway/keys] list failed:", error);
    return NextResponse.json({ error: "Could not load your keys." }, { status: 500 });
  }

  return NextResponse.json({ keys: data ?? [] });
}

/** POST — mint a key. The raw value is in this response and nowhere else, ever. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireUser();
  if (!auth.user) return auth.response;
  if (!isSupabaseConfigured()) return notConfigured();

  // MAX_ACTIVE_KEYS caps how many keys are live, but revoked rows stay so the
  // audit trail can still explain historical events — so mint/revoke/mint is a
  // storage amplifier without this. Keyed on the session id, which is the only
  // identity that can reach here.
  const limited = await enforceRateLimit(
    "gateway-keys-mint",
    auth.user.id,
    LLM_RATE_LIMITS.authenticated
  );
  if (limited) return limited;

  // The gateway itself rejects free-tier traffic with 402 (`canAccessGateway`
  // in app/api/v1/chat/completions/route.ts). Minting here without the same
  // check hands a free user a credential that is real, listed, and guaranteed
  // to fail — and the screen that issues it promises "the block lands on your
  // dashboard as a real event within seconds". That is the same defect this
  // route exists to close, one link further down: instructions the product
  // gives you that cannot work. Fail closed, and name the reason.
  const tier = await getUserSubscription(auth.user.id);
  if (!canAccessGateway(tier)) {
    return NextResponse.json(
      {
        error:
          "Gateway access requires a Pro plan or higher. A key minted on the free plan would be rejected by the gateway, so we don't issue one. Upgrade at /pricing.",
      },
      { status: 402 }
    );
  }

  // Optional label. Bad input degrades to the default rather than 400-ing —
  // the name is cosmetic and failing a key mint over it would be absurd.
  let name = "Default key";
  try {
    const body = (await req.json()) as { name?: unknown };
    if (typeof body?.name === "string" && body.name.trim()) {
      name = body.name.trim().slice(0, NAME_MAX);
    }
  } catch {
    /* no body — keep the default */
  }

  const supabase = createServiceClient();

  const { count, error: countError } = await supabase
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id)
    .eq("is_active", true);

  if (countError) {
    console.error("[gateway/keys] count failed:", countError);
    return NextResponse.json({ error: "Could not issue a key." }, { status: 500 });
  }

  if ((count ?? 0) >= MAX_ACTIVE_KEYS) {
    return NextResponse.json(
      {
        error: `You already have ${MAX_ACTIVE_KEYS} active keys. Revoke one before creating another.`,
      },
      { status: 409 }
    );
  }

  const { rawKey, keyHash, keyPrefix } = generateApiKey();

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      user_id: auth.user.id,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      name,
    })
    .select("id, key_prefix, name, is_active, created_at, last_used_at, revoked_at")
    .single();

  if (error) {
    console.error("[gateway/keys] insert failed:", error);
    return NextResponse.json({ error: "Could not issue a key." }, { status: 500 });
  }

  // `key` is present on this response only. There is no endpoint that can
  // return it again, because only its hash was stored.
  return NextResponse.json({ key: rawKey, record: data }, { status: 201 });
}

/** DELETE ?id=<uuid> — revoke. Soft: the row stays so the audit trail can still
 *  explain which key produced which historical events. */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const auth = await requireUser();
  if (!auth.user) return auth.response;
  if (!isSupabaseConfigured()) return notConfigured();

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing key id." }, { status: 400 });
  }

  const supabase = createServiceClient();
  // The user_id predicate is the tenant boundary — this runs through the
  // service-role client, which bypasses RLS by design.
  const { data, error } = await supabase
    .from("api_keys")
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[gateway/keys] revoke failed:", error);
    return NextResponse.json({ error: "Could not revoke that key." }, { status: 500 });
  }

  // No row matched: either the id does not exist or it belongs to someone else.
  // Same 404 for both — never confirm the existence of another tenant's key.
  if (!data) {
    return NextResponse.json({ error: "Key not found." }, { status: 404 });
  }

  return NextResponse.json({ revoked: id });
}
