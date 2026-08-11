/**
 * GET  /api/auth/sso?email=user@acme.com&redirectTo=/dashboard
 *   → Checks if SSO is configured for this domain
 *   → Returns { sso: true, provider: "okta" } or { sso: false }
 *
 * POST /api/auth/sso
 *   Body: { email, redirectTo }
 *   → Initiates SAML SSO redirect (302 to IdP)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { initiateSso, resolveSsoByDomain, getProviderLabel } from "@/lib/auth/saml";
import { enforceRateLimit, identifierFor, clientIp } from "@/lib/rate-limit-shared";

const SsoCheckSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().default("/dashboard"),
});

/**
 * Both handlers are unauthenticated BY NECESSITY — IdP discovery happens
 * before anyone can sign in, so a session gate would break the feature it is
 * meant to protect.
 *
 * The residual risk is org enumeration: a caller can ask "does acme.com use
 * SSO here?" and, for a compliance product, a yes is close to "acme.com is a
 * customer". That cannot be removed without removing the endpoint, so the fix
 * is to make it un-walkable rather than un-askable — one domain at a time is
 * inherent, a scripted sweep of thousands is not. 20/min per IP via the
 * shared Postgres limiter (migration 028).
 *
 * This was previously unbounded in production: the only limiter covering it
 * lived in middleware.ts, which does not execute on this deployment.
 */
const SSO_LOOKUP_LIMIT = { limit: 20, windowMs: 60_000 };

export async function GET(request: NextRequest) {
  const blocked = await enforceRateLimit(
    "auth:sso-lookup",
    identifierFor({ ip: clientIp(request) }),
    SSO_LOOKUP_LIMIT,
  );
  if (blocked) return blocked;

  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get("email") ?? "";
  const domain = email.split("@")[1]?.toLowerCase();

  if (!domain) {
    return NextResponse.json({ sso: false });
  }

  const config = await resolveSsoByDomain(domain);
  if (!config) {
    return NextResponse.json({ sso: false });
  }

  return NextResponse.json({
    sso: true,
    provider: config.provider,
    providerLabel: getProviderLabel(config.provider),
  });
}

export async function POST(request: NextRequest) {
  const blocked = await enforceRateLimit(
    "auth:sso-initiate",
    identifierFor({ ip: clientIp(request) }),
    SSO_LOOKUP_LIMIT,
  );
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const parsed = SsoCheckSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: "Invalid request" }, { status: 400 });
    }

    const { email, redirectTo } = parsed.data;
    const result = await initiateSso(email, redirectTo);

    if (!result) {
      return NextResponse.json(
        { data: null, error: "No SSO configured for this domain" },
        { status: 404 }
      );
    }

    // 302 redirect to IdP
    return NextResponse.redirect(result.redirectUrl, 302);
  } catch (err) {
    console.error("[sso/POST] unhandled:", err);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
