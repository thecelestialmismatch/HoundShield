/**
 * Shared CORS policy for gateway route handlers (fixes audit H4).
 *
 * Previously these routes returned `Access-Control-Allow-Origin: *`, which —
 * combined with the (now-fixed) fail-open key check — let any website drive a
 * victim's browser into unauthenticated cross-origin calls. This mirrors the
 * allow-list logic already used by middleware.ts for `/api/gateway/*`.
 *
 * Demo/local (no NEXT_PUBLIC_APP_URL, or localhost) reflects the request origin
 * so local testing works. In production only the app's own origin is allowed.
 */

const BASE_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key, x-user-id, x-destination-url",
  Vary: "Origin",
};

export function gatewayCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim();
  // Audit findings #11b / #20d: demo mode reflected ANY origin and keyed that
  // decision on NEXT_PUBLIC_APP_URL alone. A public deployment that lost the
  // variable — an env var deleted, a preview built without it — silently became
  // allow-all, which is the failure this reflection was never meant to cover.
  // Requiring a non-production build as well means a missing variable can no
  // longer open it; the worst case is now a preview with no CORS header, which
  // fails closed in the browser.
  const isDemo =
    process.env.NODE_ENV !== "production" && (!appUrl || appUrl === "http://localhost:3000");
  const origin = requestOrigin ?? "";

  const headers: Record<string, string> = { ...BASE_HEADERS };

  if (isDemo) {
    headers["Access-Control-Allow-Origin"] = origin || "*";
  } else {
    const allowed = [appUrl, "http://localhost:3000", "http://127.0.0.1:3000"];
    if (allowed.includes(origin)) {
      headers["Access-Control-Allow-Origin"] = origin;
    }
    // If the origin isn't allowed, omit the header entirely — the browser
    // blocks the cross-origin read.
  }

  return headers;
}
