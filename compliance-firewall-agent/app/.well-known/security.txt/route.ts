import { NextResponse } from "next/server";

/**
 * GET /.well-known/security.txt  (RFC 9116)
 *
 * A machine-readable disclosure policy is table-stakes for a security vendor —
 * researchers, automated scanners, and procurement security reviews look for it.
 * Served dynamically so the `Expires` field always stays ~12 months ahead.
 */
export const dynamic = "force-static";
export const revalidate = 86400; // re-evaluate Expires daily

export function GET() {
  const expires = new Date();
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);

  const body = [
    "# HoundShield — Security Disclosure Policy (RFC 9116)",
    "Contact: mailto:security@houndshield.com",
    "Contact: https://houndshield.com/security",
    `Expires: ${expires.toISOString()}`,
    "Preferred-Languages: en",
    "Canonical: https://houndshield.com/.well-known/security.txt",
    "Policy: https://houndshield.com/security",
    "",
    "# Local-only by design: customer prompt content never leaves their network,",
    "# so it is out of scope for any vulnerability report to HoundShield.",
    "",
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
