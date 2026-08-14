/**
 * The site's own base URL — one constant, because it was twenty-nine copies of
 * a string that redirects.
 *
 * THE DEFECT. Every copy read
 * `process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com"`, and
 * `NEXT_PUBLIC_APP_URL` is **unset in production** (`/api/health` reports
 * `reset_app_url: "default"`). So every canonical tag, every Open Graph URL,
 * every `sitemap.xml` entry, `robots.txt`, and every link in every onboarding
 * email pointed at the apex host — which Vercel immediately redirects:
 *
 *   GET https://houndshield.com/api/health  ->  308  ->  https://www.houndshield.com/...
 *
 * Measured against production on 2026-08-14. A `<link rel="canonical">` whose
 * target 308s elsewhere is a self-contradiction: the page names an address, and
 * the address refuses to serve it. For a product whose acquisition channel is
 * organic and AI-answer traffic, that is not cosmetic.
 *
 * WHY WWW IS THE ANSWER, and not a coin flip:
 *
 *   Vercel domain config (measured, 308)  ->  www
 *   CLAUDE.md "Canonical URL"             ->  www
 *   lib/gateway/base-url.ts               ->  www  (printed to every customer)
 *   the twenty-nine copies                ->  apex  (the only dissenters)
 *
 * `next.config.js` used to hold a www -> apex redirect agreeing with those
 * copies. It was deleted, because with Vercel's apex -> www it is an infinite
 * loop the moment framework routing is restored.
 *
 * THE PATTERN IS NOT NEW HERE. `lib/gateway/base-url.ts` exists for exactly
 * this reason — eight copies of a gateway host that 404'd, across two dead
 * subdomains, so fixing one looked complete and was not. This is the same
 * failure on the marketing surface, with a redirect instead of a 404.
 *
 * An explicit `NEXT_PUBLIC_APP_URL` still wins, so a preview deployment or a
 * self-hosted instance can override it.
 */

/** The canonical origin, no trailing slash. */
export const SITE_URL: string =
  (process.env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/+$/, "") ||
  "https://www.houndshield.com";

/** `SITE_URL` joined with a path, e.g. `siteUrl("/pricing")`. */
export function siteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
