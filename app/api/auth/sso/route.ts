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

const SsoCheckSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().default("/dashboard"),
});

export async function GET(request: NextRequest) {
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
