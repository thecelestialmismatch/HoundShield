# Middleware does not execute in production

**Status:** open — needs one Vercel dashboard change that only the founder can make.
**Found:** 2026-07-29. **Severity:** medium on its own; it silently removed a layer
that other work assumed was present.

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

## The fix — founder action

Two changes, both in the Vercel dashboard, then one commit.

1. **Project → Settings → Build & Deployment → Root Directory:** change `.` to
   `compliance-firewall-agent`.
2. **Delete the repo-root `vercel.json`.** Once Root Directory points at the app,
   the `builds`/`routes` indirection is what the setting now does natively.
   `compliance-firewall-agent/vercel.json` (the `crons` block) becomes the config
   Vercel reads — which is also what finally registers the email drip.
3. Redeploy.

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
