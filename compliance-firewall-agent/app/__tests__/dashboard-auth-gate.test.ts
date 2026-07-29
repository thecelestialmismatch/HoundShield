import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "fs";
import path from "path";

/**
 * ONE dashboard, behind login.
 *
 * Context (2026-07-29). Production served the whole dashboard to anonymous
 * visitors: `curl https://www.houndshield.com/command-center` → **200** with
 * `x-nextjs-prerender: 1` and `x-vercel-cache: HIT`. The middleware that was
 * supposed to stop that had compiled (`ƒ Proxy (Middleware)` in the build log)
 * and was not running — no `X-Robots-Tag`, no `X-RateLimit-*`, `/auth/signup`
 * 404ing instead of redirecting — because the repo-root `vercel.json` still
 * declares the legacy `builds` + `routes` keys, which replace the routing table
 * Vercel generates from the build.
 *
 * So the gate cannot live in middleware alone. These tests pin the properties
 * that make the door hold with the platform routing layer switched off:
 *
 *  1. A SERVER layout at the top of /command-center resolves the session per
 *     request and fails closed. Being async + session-reading is also what
 *     makes the subtree dynamic, so it can never be prerendered to the CDN.
 *  2. /command-center is the ONE canonical dashboard URL; /console redirects.
 *  3. The tool shell sits in the (tools) route group so the index can render
 *     the Live Command Center without stacking two sidebars.
 *  4. Redirects that the platform config demonstrably cannot serve are declared
 *     as routes inside the app instead.
 */

const CFA = path.resolve(__dirname, "../..");
const read = (rel: string) => readFileSync(path.join(CFA, rel), "utf8");

const GATE = "app/command-center/layout.tsx";
const TOOLS_SHELL = "app/command-center/(tools)/layout.tsx";

describe("the authorization boundary is a fail-closed server layout", () => {
  const gate = read(GATE);

  it("is a server component — a client layout cannot gate anything", () => {
    expect(gate).not.toMatch(/^\s*['"]use client['"]/m);
  });

  it("resolves the session through the provider-agnostic server helper", () => {
    expect(gate).toMatch(/import \{ getSessionUser \} from ['"]@\/lib\/auth\/session['"]/);
    expect(gate).toMatch(/await getSessionUser\(\)/);
  });

  it("redirects to login when there is no session", () => {
    expect(gate).toMatch(/import \{ redirect \} from ['"]next\/navigation['"]/);
    expect(gate).toMatch(/if \(!user\) redirect\(['"]\/login\?redirect=/);
  });

  it("FAILS CLOSED — it never swallows an auth error into a render", () => {
    // getSessionUser() already returns null on every throw/misconfiguration, so
    // the gate must not add a try/catch that turns "auth is broken" into
    // "render the dashboard". If this ever needs a try, the catch must redirect.
    expect(gate).not.toMatch(/\btry\s*\{/);
    expect(gate).not.toMatch(/\bcatch\b/);
  });

  it("renders per request, so the subtree can never be prerendered to the CDN", () => {
    // The 200 in production came from a statically prerendered page served by
    // Vercel's cache. force-dynamic is what moves the whole subtree to ƒ.
    expect(gate).toMatch(/export const dynamic = ['"]force-dynamic['"]/);
    expect(gate).not.toMatch(/force-static/);
    expect(gate).not.toMatch(/export const revalidate/);
  });

  it("keeps the subtree out of search indexes", () => {
    expect(gate).toMatch(/robots: \{ index: false, follow: false \}/);
  });
});

describe("nothing may put the app back into a streaming context", () => {
  // MEASURED, not theoretical. With a root `app/loading.tsx`, the entire app
  // sits inside one Suspense boundary, and Next.js delivers `redirect()` from a
  // streaming render as a meta tag with HTTP **200** instead of a 307. On
  // 2026-07-29 that made this very gate answer 200 (body empty — the render
  // still stopped — but 200 to curl, crawlers, and any non-JS client). Moving
  // the boundary below the gate is what produced a real 307.
  it("there is no root loading.tsx", () => {
    expect(
      existsSync(path.join(CFA, "app/loading.tsx")),
      "app/loading.tsx forces every route to stream — the auth gate then answers 200, not 307",
    ).toBe(false);
  });

  it("the loading UI lives under the gate, where it cannot affect the status code", () => {
    expect(existsSync(path.join(CFA, "app/command-center/loading.tsx"))).toBe(true);
  });

  it("/login declares its own Suspense boundary for useSearchParams", () => {
    // The root loading.tsx was silently satisfying the CSR-bailout requirement
    // for every page at once; removing it broke the /login prerender until the
    // real consumer got its own boundary.
    const login = read("app/login/page.tsx");
    expect(login).toMatch(/import \{ Suspense[^}]*\} from ['"]react['"]/);
    expect(login).toMatch(/<Suspense fallback=\{<LoginFallback \/>\}>[\s\S]{0,80}<LoginForm \/>/);
  });
});

describe("/command-center is the ONE canonical dashboard", () => {
  it("its index renders the Live Command Center — the after-login beast", () => {
    const page = read("app/command-center/page.tsx");
    expect(page).toMatch(/import \{ LiveCommandCenter \} from ['"]@\/components\/dashboard\/LiveCommandCenter['"]/);
    expect(page).toMatch(/<LiveCommandCenter viewer=\{viewer\} \/>/);
  });

  it("/console permanently redirects instead of rendering a second dashboard", () => {
    const consolePage = read("app/console/page.tsx");
    expect(consolePage).toMatch(/permanentRedirect\(['"]\/command-center['"]\)/);
    expect(consolePage).not.toMatch(/LiveCommandCenter/);
  });

  it("account security moved under the gate, and its old URL still resolves", () => {
    expect(existsSync(path.join(CFA, "app/command-center/(tools)/account-security/page.tsx"))).toBe(true);
    expect(read("app/console/security/page.tsx")).toMatch(
      /permanentRedirect\(['"]\/command-center\/account-security['"]\)/,
    );
  });

  it("every post-login landing points at the canonical dashboard, not /console", () => {
    const landings = [
      "app/auth/callback/route.ts",
      "app/auth/page.tsx",
      "app/login/page.tsx",
      "app/signup/page.tsx",
      "lib/auth/confirm-redirect.ts",
      "lib/auth/signup-result.ts",
      "middleware.ts",
    ];
    for (const rel of landings) {
      const src = read(rel);
      // `pathname.startsWith('/console')` in the middleware noindex list is a
      // deliberate survivor — it must keep tagging the redirect stub. Anything
      // that *sends a user* to /console is not.
      const landingRefs = src
        .split("\n")
        .filter((l) => /['"]\/console(\?|['"])/.test(l) && !/startsWith/.test(l));
      expect(landingRefs, `${rel} still lands users on /console`).toEqual([]);
    }
  });
});

describe("the (tools) route group — one shell, never two sidebars", () => {
  it("(tools) is the only route segment beside the gate — no sibling escapes the shell", () => {
    // A directory added here becomes a route that renders WITHOUT the tool
    // shell, next to the Live Command Center. (It is still gated — the layout
    // covers the whole subtree — but it loses its chrome, which is the exact
    // double-sidebar/no-sidebar mess the route group exists to prevent.)
    const entries = readdirSync(path.join(CFA, "app/command-center"), { withFileTypes: true });
    const segments = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    expect(segments).toEqual(["(tools)"]);

    // Loose files must stay Next.js convention files, never a stray route.
    const allowed = new Set(["layout.tsx", "page.tsx", "loading.tsx", "error.tsx", "not-found.tsx"]);
    const files = entries.filter((e) => e.isFile()).map((e) => e.name);
    expect(files.filter((f) => !allowed.has(f))).toEqual([]);
    expect(files).toContain("layout.tsx");
    expect(files).toContain("page.tsx");
  });

  it("the tool shell is the client component that was there before the merge", () => {
    const shell = read(TOOLS_SHELL);
    expect(shell).toMatch(/^["']use client["'];/);
    expect(shell).toMatch(/className="cc-light/);
  });

  it("the 800-line overview kept its content at its own URL", () => {
    const overview = read("app/command-center/(tools)/overview/page.tsx");
    expect(overview).toMatch(/SPRSDashboardWidget/);
    expect(read(TOOLS_SHELL)).toMatch(/href: "\/command-center\/overview"/);
  });

  it("the shell links back to the merged dashboard home", () => {
    expect(read(TOOLS_SHELL)).toMatch(/label: "Dashboard Home"[^}]*href: "\/command-center"/);
  });

  it("the shell can be left — a dashboard with no sign-out is a trust smell", () => {
    expect(read(TOOLS_SHELL)).toMatch(/<SignOutButton/);
  });
});

describe("the Live Command Center is no longer an island", () => {
  const lcc = read("components/dashboard/LiveCommandCenter.tsx");

  it("its sidebar links out to the deep tool pages", () => {
    expect(lcc).toMatch(/const TOOL_LINKS/);
    for (const href of [
      "/command-center/getting-started",
      "/command-center/rules",
      "/command-center/quarantine",
      "/command-center/events",
      "/command-center/shield",
      "/command-center/overview",
    ]) {
      expect(lcc).toContain(`href: '${href}'`);
    }
  });

  it("every tool it links to actually exists", () => {
    const hrefs = [...lcc.matchAll(/href: '\/command-center\/([a-z-]+)'/g)].map((m) => m[1]);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const seg of hrefs) {
      expect(
        existsSync(path.join(CFA, `app/command-center/(tools)/${seg}/page.tsx`)),
        `sidebar links /command-center/${seg} but that page does not exist`,
      ).toBe(true);
    }
  });
});

describe("redirects the deployment's routing layer cannot serve are declared in-app", () => {
  // /dashboard and /shieldready are declared in next.config.js redirects() and
  // BOTH returned 404 in production on 2026-07-29 — that config never reaches
  // the edge while the legacy vercel.json `routes` key is in place.
  it("/dashboard resolves without depending on next.config redirects", () => {
    expect(read("app/dashboard/page.tsx")).toMatch(/permanentRedirect\(['"]\/command-center['"]\)/);
  });

  it("/shieldready mirrors the config's bare-vs-subpath split", () => {
    const src = read("app/shieldready/[[...slug]]/page.tsx");
    expect(src).toMatch(/\/command-center\/shield\$\{rest\}/);
    expect(src).toMatch(/: ['"]\/command-center['"]/);
  });

  it("every redirect stub renders per request — prerendered, they answer 200", () => {
    // Measured against the production build on 2026-07-29: as `○ (Static)`,
    // /console returned 200 with a client-side hop instead of a 308. A redirect
    // that needs JS is not a redirect for curl, a crawler, or a POST.
    for (const rel of [
      "app/console/page.tsx",
      "app/console/security/page.tsx",
      "app/dashboard/page.tsx",
      "app/shieldready/[[...slug]]/page.tsx",
    ]) {
      expect(read(rel), `${rel} must be force-dynamic`).toMatch(
        /export const dynamic = ['"]force-dynamic['"]/,
      );
    }
  });

  it("the next.config entries stay too — they are the faster path once fixed", () => {
    const cfg = read("next.config.js");
    expect(cfg).toMatch(/source: '\/dashboard', destination: '\/command-center'/);
    expect(cfg).toMatch(/source: '\/shieldready'/);
  });
});
