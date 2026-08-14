# Middleware does not execute in production

**Status:** **code half done and staged; still blocked on one Vercel dashboard
change that only the founder can make.** The repo-root `vercel.json` deletion is
committed on `claude/deploy-topology-middleware` and **must not be merged before**
the Root Directory setting changes — see "The fix" below for why the order is not
optional.
**Found:** 2026-07-29. **Severity:** medium on its own; it silently removed a layer
that other work assumed was present.

> **Since this was written (2026-08-14):** no security control depends on
> middleware executing any more. The last one that did — the request-rate ceiling
> on `/api/scan` — was moved into the route and now counts in shared Postgres, and
> the CSP directives were moved into `next.config.js` in #283. So this issue is now
> a correctness and cron problem, not a security exposure, and it can wait for a
> deploy the founder can watch.

---

## The finding, in one line

`compliance-firewall-agent/middleware.ts` compiles, deploys, and is present in the
production build output — and is never invoked for any request.

## How that was established

Two independent probes against `https://www.houndshield.com`, each looking for a
header that **only** middleware sets:

```
/command-center  → 307, and NO x-robots-tag      (middleware.ts:156 would set it)
/api/health      → 200, and NO x-ratelimit-*     (middleware.ts:185-187 would set it)
```

The security headers that *are* present on those responses (`strict-transport-security`,
`x-content-type-options`, `referrer-policy`, `permissions-policy`, CSP,
`x-frame-options`) come from `next.config.js`'s `headers()` block, not middleware.
That dual layer is deliberate and documented in `next.config.js` — which is exactly
why the absence was not obvious: the site *looks* correctly headered.

The middleware itself is genuinely deployed. `vercel inspect` on the current
production deployment lists it:

```
λ _middleware (226.52KB) [bom1, fra1, gru1, iad1, lhr1, sfo1, sin1, syd1]
```

So this is not a build failure. The function exists in eight regions and nothing
routes to it.

## Root cause

The Vercel project's **Root Directory is `.`** (confirmed via
`vercel project inspect compliance-firewall-agent`). Vercel therefore reads the
**repo-root `vercel.json`**, which is in the deprecated `version: 2` + `builds`
form:

```json
{
  "version": 2,
  "builds": [{ "src": "compliance-firewall-agent/package.json", "use": "@vercel/next" }],
  "routes": [{ "src": "/(.*)", "dest": "/compliance-firewall-agent/$1" }]
}
```

`builds` puts the deployment into the legacy builder pipeline. Middleware is a
framework feature of the modern zero-config Next.js build; in legacy mode the
`_middleware` lambda is emitted but no routing entry is generated to invoke it.

### What was ruled out

An earlier note in `tasks/todo.md` attributed this to the `routes` array replacing
the generated routing table. **That is not supported by the evidence.** If `routes`
were eating the routing table, these would also be dead — they are not:

```
/dashboard    → 308   (next.config.js redirect, works)
/shieldready  → 308   (next.config.js redirect, works)
/hermes       → 200   (next.config.js rewrite,  works)
```

Removing only the `routes` array was tested on a preview deployment. The build
output was **structurally identical** to production (`λ _middleware`, same item
count), and Vercel's preview protection (302 → `vercel.com/sso-api`) prevented a
runtime header check, so that change could not be verified and was **not shipped**.
`vercel.json` is unchanged by this PR.

## What this actually costs

| Affected | Consequence |
|---|---|
| Rate limiting on `/api/*` | Absent in production. See "Already mitigated" below. |
| `X-Robots-Tag` on private pages | Absent. Low impact — `/command-center` 307s to `/login`, so there is no content to index. |
| CORS handling for `/api/gateway/*` | Absent from the middleware layer. |
| Crons in `compliance-firewall-agent/vercel.json` | **Never registered.** Vercel reads only the root-directory `vercel.json`, and the root file has no `crons` key. `/api/cron/email-drip` has never fired — the day-3/7/14 onboarding drip has never sent. |

## Already mitigated (this PR)

The rate-limiting consequence is fixed independently of this deployment issue,
because the middleware limiter was **never a real limit anyway**: it counted in a
per-process `Map` (`middleware.ts:32`), so on Fluid Compute the effective ceiling
was `limit × live instances` and reset on every cold start. `lib/rate-limit.ts:6`
has the same flaw.

Money-spending routes now count in Postgres instead — shared across every instance.
See `lib/rate-limit-shared.ts` and `supabase/migrations/028_rate_limit_buckets.sql`.

**Fixing middleware execution would not have fixed the spend exposure.** These are
two separate bugs that looked like one.

## The fix — founder action, in this order

**Step 2 is already written and committed** (branch
`claude/deploy-topology-middleware`, held as a draft PR). Step 1 is yours, and it
has to land first.

1. **Project → Settings → Build & Deployment → Root Directory:** change `.` to
   `compliance-firewall-agent`.
   Confirmed still unset as of 2026-08-14: the Vercel bot's own PR comment on
   #287 reports `"rootDirectory":null`.
   The moment this changes, Vercel stops reading the repo-root `vercel.json`
   entirely and builds the app directory zero-config — so **this single setting
   is the actual fix**, and the deletion below is what stops it regressing.
2. **Merge the PR that deletes the repo-root `vercel.json`.**
   `compliance-firewall-agent/vercel.json` (the `crons` block) becomes the config
   Vercel reads — which is also what finally registers the email drip.
   `scripts/verify-structure.mjs` now fails if that file ever reappears, because a
   structure guard that only checks for presence cannot protect a deletion, and
   this is exactly the file someone re-adds in good faith.
3. Redeploy.

### The loop this PR had to defuse first

`docs/SECURITY-PHASE-2-AUDIT.md` warned that restoring framework routing could
produce an infinite redirect loop. Measured against production on 2026-08-14,
it was real and armed:

```
GET https://houndshield.com/api/health   ->  308  ->  https://www.houndshield.com/...
```

Vercel's domain configuration canonicalises **apex -> www**. `next.config.js`
carried a permanent redirect pointing **www -> apex**. Both live at once is
apex -> www -> apex, forever, on every URL of the site. It had never fired only
because the legacy repo-root `vercel.json` stops next.config redirects reaching
the edge — the exact condition step 2 removes. The rule is deleted, and
`app/__tests__/canonical-host.test.ts` fails if it ever returns.

**Do not reverse steps 1 and 2.** With Root Directory still `.`, the repo-root
`vercel.json` is the only thing telling Vercel where the app lives; deleting it
first makes Vercel zero-config-build the repository root, whose `package.json`
has no `next` dependency and no build script. That is a production outage, not a
failed build you notice in a preview.

### Verify after deploying

```bash
curl -sI https://www.houndshield.com/api/health | grep -i x-ratelimit
```

Any `x-ratelimit-*` header means middleware is executing. Also confirm the site
still serves at the apex (`curl -sI https://www.houndshield.com/` → 200) and that
Settings → Cron Jobs now lists `/api/cron/email-drip`.

### Risk and rollback

The risk is real: the root `vercel.json` is currently the only thing telling
Vercel where the app lives, so the two changes must land **together**. Doing
either alone breaks the build.

Rollback is a one-click **Instant Rollback** to the previous production
deployment in the Vercel dashboard, plus reverting the `vercel.json` deletion.
Do this when you can watch the deploy, not before stepping away.

### Also still unset

`/api/cron/email-drip` additionally needs `CRON_SECRET` set in Vercel, or it
refuses to run. Registering the cron without that env var changes nothing.
