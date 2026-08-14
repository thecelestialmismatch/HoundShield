/**
 * Origin assertion for cookie-authenticated routes (audit finding #1, CSRF).
 *
 * There was no CSRF token, no double-submit cookie, and no Origin/Referer check
 * anywhere in the application. Two accidental defences held the line, and both
 * are inherited library defaults rather than decisions this codebase records:
 *
 *   1. every state-changing route requires `Content-Type: application/json`,
 *      which an HTML <form> cannot set, so a cross-origin POST is preflighted
 *      and `lib/gateway/cors.ts` refuses the preflight; and
 *   2. the session cookie is `SameSite=Lax`, which blocks cross-site POST.
 *
 * Nothing stops a future route from accepting `application/x-www-form-urlencoded`,
 * and #2 is a default in `@supabase/ssr` that a dependency bump could change.
 * This is the check that does not depend on either.
 *
 * THE RULE
 *
 *   • No `Origin` header        → allow. Same-origin GET/HEAD, server-to-server
 *     calls and API-key clients do not send one; requiring it would break every
 *     non-browser caller to defend against a threat that only exists in browsers.
 *   • `Origin` host === `Host`  → allow. This IS same-origin, by definition, and
 *     it needs no configuration — so preview deployments, the apex/www pair, and
 *     localhost all work without an env var listing them.
 *   • `Origin` matches the configured app URL (or its www/apex sibling) → allow.
 *   • anything else             → reject.
 *
 * ON TRUSTING `Host`. A caller can forge both `Origin` and `Host`, so this is
 * not an authenticity check — and it does not need to be. CSRF is an attack in
 * which a *browser* is driven to send its own cookies to us from someone else's
 * page, and a browser sets both headers honestly and refuses to let script
 * override them. An attacker crafting headers directly is not performing CSRF:
 * they would still need the victim's session cookie, which they cannot obtain
 * this way. Host-comparison is therefore sound for exactly the threat it is
 * here to stop.
 */

/** Lowercased host:port of a URL or origin string, or null if unparseable. */
function hostOf(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  // "null" is what a browser sends for sandboxed/opaque origins. It is never
  // ours, so it must not be normalised into a match.
  if (!trimmed || trimmed === "null") return null;
  try {
    return new URL(trimmed).host.toLowerCase();
  } catch {
    return null;
  }
}

/** `example.com` and `www.example.com` are the same site for this purpose. */
function withoutWww(host: string): string {
  return host.startsWith("www.") ? host.slice(4) : host;
}

export interface OriginCheckInput {
  /** The request's `Origin` header, if any. */
  origin: string | null | undefined;
  /** The request's `Host` header, if any. */
  host: string | null | undefined;
  /** `NEXT_PUBLIC_APP_URL`, if configured. */
  appUrl?: string | null;
}

/**
 * Should this request be allowed through on origin grounds?
 *
 * Deliberately permissive about an ABSENT origin and strict about a PRESENT
 * one that does not match — that asymmetry is the whole design.
 */
export function isAllowedOrigin({ origin, host, appUrl }: OriginCheckInput): boolean {
  const originHost = hostOf(origin);

  // No Origin header at all — not a browser cross-site request.
  if (!originHost) {
    // An Origin that was PRESENT but unparseable (including the literal "null"
    // sent by sandboxed iframes and some redirect flows) must not be treated
    // the same as an absent one.
    const sent = typeof origin === "string" && origin.trim().length > 0;
    return !sent;
  }

  const requestHost = host?.trim().toLowerCase() ?? null;
  if (requestHost && withoutWww(originHost) === withoutWww(requestHost)) return true;

  const configuredHost = hostOf(appUrl);
  if (configuredHost && withoutWww(originHost) === withoutWww(configuredHost)) return true;

  return false;
}
