# The dashboard was public — root cause, fix, and the one founder action left

**Date:** 2026-07-29 · **Severity:** the entire after-login dashboard was reachable by anyone

---

## 1. What was broken

```bash
curl -sI https://www.houndshield.com/command-center
# HTTP/2 200
# x-nextjs-prerender: 1
# x-vercel-cache: HIT
```

`200`. Not a redirect to `/login`. The full Command Center — 20 tool pages, the
SPRS dashboard, the assessment, the audit-log export — served to an anonymous
visitor, from Vercel's CDN, with a 14,156-second-old cached copy.

`middleware.ts` was written to prevent exactly this:

```ts
if (pathname.startsWith('/command-center') && !user) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}
```

It compiled. The production build log for `dpl_CXEJkT5AssRWFAzD7osiXs8Vei45`
ends with `ƒ Proxy (Middleware)`. **It never ran.**

---

## 2. How we know it never ran

The middleware has four observable side effects. Every one was absent in
production:

| Middleware behaviour | Expected | Production, 2026-07-29 |
|---|---|---|
| `X-Robots-Tag: noindex` on `/login` | header present | **absent** |
| `X-RateLimit-*` on `/api/*` | headers present | **absent** |
| `/auth/signup` → `/signup` | 307 | **404** |
| `/command-center` unauthenticated → `/login` | 307 | **200 + full dashboard** |

Four independent signals, one conclusion. Not a logic bug — the file was not
being executed at all.

---

## 3. Root cause: the repo-root `vercel.json` is a legacy config

```json
{
  "version": 2,
  "builds": [{ "src": "compliance-firewall-agent/package.json", "use": "@vercel/next" }],
  "routes": [{ "src": "/(.*)", "dest": "/compliance-firewall-agent/$1" }]
}
```

The build log says it outright:

```
WARNING! Due to `builds` existing in your configuration file, the Build and
Development Settings defined in your Project Settings will not apply.
```

`builds` + `routes` are the pre-2021 Vercel configuration format. The `routes`
array **replaces** the routing table Vercel generates from the framework build —
and the middleware route lives in that generated table. Next.js emits the
middleware function; Vercel then never wires up a route that invokes it.

This is not limited to auth. Everything the platform routing layer owns is dead,
and everything the Next.js server itself owns still works:

| Feature | Owner | Production status |
|---|---|---|
| `middleware.ts` (auth, rate limit, CSP, noindex, CORS) | platform routing | ❌ **dead** |
| `next.config.js` `redirects()` | platform routing | ❌ **dead** — `/dashboard` and `/shieldready` both 404 |
| `compliance-firewall-agent/vercel.json` `crons` | platform | ❌ **ignored** — `/api/cron/email-drip` has never fired |
| `next.config.js` `rewrites()` | Next server | ✅ works (`/hermes` → 200) |
| `next.config.js` `headers()` | Next server | ✅ works (CSP, HSTS, X-Frame-Options all present) |

Two consequences worth stating plainly:

- **The canonical-host redirect is inverted.** `next.config.js` declares
  www → non-www. Production does the opposite: `https://houndshield.com/…`
  308s to `https://www.houndshield.com/…`, from a domain-level redirect
  configured in the Vercel dashboard. The `next.config.js` rule is dead code,
  so the *dashboard setting* is the only thing deciding the canonical host.
  Check that `app/sitemap.ts` and the canonical `<link>` tags emit the host
  that actually serves, or every canonical URL costs a redirect hop.
- **The email drip has never sent.** The cron is declared in a `vercel.json`
  that the deployment does not read.

---

## 4. What this PR fixes (no deployment change required)

### The gate moved to where it cannot be bypassed

`app/command-center/layout.tsx` is now a server component that resolves the
session per request and **fails closed**:

```ts
export const dynamic = 'force-dynamic'

export default async function CommandCenterAuthLayout({ children }) {
  const user = await getSessionUser()
  if (!user) redirect('/login?redirect=%2Fcommand-center')
  return <>{children}</>
}
```

Why this holds where middleware did not:

- It is part of the Next.js render, not the platform routing layer. No
  `vercel.json` key can drop it.
- `getSessionUser()` returns `null` for *every* failure path — no session, auth
  unreachable, Supabase unconfigured, thrown exception — so an outage redirects
  to login instead of exposing the dashboard.
- Reading the session per request makes the whole subtree dynamic. The pages
  can no longer be prerendered, so there is no static HTML for the CDN to serve.
  In the build route table `/command-center` moves from `○ (Static)` to
  `ƒ (Dynamic)`. **That line is the proof.**

Middleware is kept as the fast path in front of it — it saves a render and
preserves the exact deep path in `?redirect=` — but it is explicitly no longer
the boundary.

### A root `loading.tsx` was turning every redirect into a 200

The gate did not work on the first try, and the reason is worth writing down.

With middleware disabled to simulate production, `/command-center` answered
**200**, not 307. The body was harmless — `hs-lcc` (the dashboard root) appeared
zero times and `NEXT_REDIRECT` twice, so the render really had stopped — but the
status line was wrong, and `/console` behaved the same way.

Cause: `app/loading.tsx`, an untouched scaffold leftover from the initial
commit, wrapped the **entire application** in a single Suspense boundary. Next's
own documentation: *"in a streaming context, it inserts a meta tag for
client-side redirection; … in other cases, it sends a 307."* Once the shell has
flushed, the status code is already sent — the redirect can only be delivered as
markup. So no server redirect anywhere in this app could emit a real status
code, including the pre-existing gate on the old `/console/security`.

That file moved to `app/command-center/loading.tsx` — below the gate, where the
same branded loader still covers the dashboard's per-request render but cannot
affect the response status. Removing it from the root also exposed a genuine
latent bug it had been masking: `/login` calls `useSearchParams()` with no
Suspense boundary of its own, and the root boundary had been quietly satisfying
the client-side-rendering bailout for every page at once. `/login` now declares
its own boundary, which is the fix Next.js documents and keeps the page
prerendered.

Both invariants are pinned in `app/__tests__/dashboard-auth-gate.test.ts`. **Do
not reintroduce `app/loading.tsx`** — it silently downgrades every redirect in
the app, auth gate included, from a status code to a meta tag.

### Redirects the platform can't serve are now routes in the app

`/console`, `/console/security`, `/dashboard`, and `/shieldready/*` are declared
as pages calling `permanentRedirect()`. They work regardless of how the platform
config lands. The `next.config.js` entries stay — once §5 is done those win at
the edge, which is faster and equally correct.

### One dashboard instead of two

`/command-center` is the single canonical dashboard URL and renders the Live
Command Center. The 20 deep tools moved into a `(tools)` route group — same
URLs, one segment of nesting — so the index can render the console's own shell
without stacking two sidebars. `/console` redirects. Every post-login landing
(login, signup, OAuth callback, email confirm) now points at `/command-center`.

---

## 5. The one action left — founder only, in the Vercel dashboard

This PR does **not** touch `vercel.json`. Removing `builds` while the project's
Root Directory is unset makes Vercel build the repo root (`../package.json`) —
a broken or wrong build on the revenue site. Do these in order:

1. **Vercel → project `compliance-firewall-agent` → Settings → Build and
   Deployment → Root Directory → `compliance-firewall-agent`.**
   Safe to do first: while `builds` exists this setting is ignored, so it
   changes nothing until step 2.
2. **Delete the repo-root `vercel.json`.** (Keep
   `compliance-firewall-agent/vercel.json` — that is where the cron belongs, and
   it starts being read once the root directory is correct.)
   `scripts/verify-structure.mjs` currently requires the root `vercel.json` to
   exist; drop that entry in the same commit.
3. **Redeploy, then verify all four signals are back:**

```bash
curl -sI https://www.houndshield.com/login | grep -i x-robots-tag
curl -sI https://www.houndshield.com/api/health | grep -i x-ratelimit
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://www.houndshield.com/auth/signup
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://www.houndshield.com/dashboard
```

Expected: a `noindex` header, `X-RateLimit-Limit`, and two 307/308s. Also
re-check the canonical host and confirm the email-drip cron appears under
Vercel → Settings → Cron Jobs.

**The dashboard is closed either way.** Step 5 restores rate limiting, the
noindex headers, the gateway CORS policy, the config redirects, and the cron —
it is not what is holding the door.

---

## 6. Verifying the gate itself

```bash
cd compliance-firewall-agent
npm run build      # /command-center must read ƒ (Dynamic), not ○ (Static)
npm start
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/command-center
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/command-center/shield
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/console
```

All three must be `307 …/login?redirect=%2Fcommand-center` with no session
cookie. `app/__tests__/dashboard-auth-gate.test.ts` pins the properties that
make that true so they cannot regress silently.

The decisive check is the **Vercel preview URL** for this PR: it inherits the
same broken `vercel.json`, so a 307 there proves the gate holds with the
middleware still dead.
