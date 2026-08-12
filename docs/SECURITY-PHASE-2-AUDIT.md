# Phase 2 — Codebase Security Audit (20-Issue Checklist)

**Branch:** `HoundShield/houndshield-security-phase-1-6f8056` @ `5e19fcd`
**Production:** `https://www.houndshield.com` · Supabase project `qifynzuyrdxmxlumpsrq`
**Date:** 2026-08-11
**Status when written:** AUDIT ONLY — no code modified. Recommendations were proposals.

Companion: [`SECURITY-PHASE-1-AUTH-REPORT.md`](./SECURITY-PHASE-1-AUTH-REPORT.md)

---

## Remediation status (updated 2026-08-12)

The audit below is preserved **as written on 2026-08-11**, including its
severities and its "Present/Absent" calls, so the record of what was found is
not quietly rewritten by what was later fixed. This section is the only part
that changes.

Fixes were applied after the founder reviewed Phase 1 and approved a combined
scope ("Phase 1 and 2 with brain-ai fix"). Everything landed on
`HoundShield/houndshield-security-phase-1-6f8056`.

| # | Issue | Audit call | Now | Where |
|---|---|---|---|---|
| 2 | Insecure session management | 🔴 MEDIUM | ⚠️ **Partly fixed** — `requireUser()` now refuses an unverified session. The `@supabase/ssr` cookie remains `httpOnly: false` with a 400-day `maxAge`; that is a library default, not a one-line flip, and is still open. | `lib/auth/api-guard.ts` |
| 3 | Broken access control | 🔴 HIGH | ✅ **Fixed** — all eight `/api/brain-ai/*` routes now authenticate and meter; `GET /api/gateway/metrics` now requires a session. | `lib/brain-ai/route-guard.ts` |
| 5 | Missing input validation (SSRF) | 🔴 HIGH | ✅ **Fixed** — caller-supplied URLs resolved and judged against a private/reserved blocklist, redirects re-validated, size and time capped. | `lib/net/safe-fetch.ts` |
| 6 | Sensitive data in logs | 🔴 MEDIUM | ✅ **Fixed** — the Stripe webhook masked a buyer's raw email. | `app/api/stripe/webhook/route.ts` |
| 7 | IDOR | 🔴 HIGH | ✅ **Fixed** — session ids namespaced to the owner; the list-everything branch deleted; `/transcript` scoped the same way. | `lib/brain-ai/route-guard.ts` |
| 8 | Weak security headers | ⚠️ MEDIUM | ✅ **Fixed** — `base-uri` and `form-action` added to the layer that actually ships. | `next.config.js` |
| 14 | No audit logging on sensitive actions | 🔴 HIGH | ✅ **Fixed and live** — append-only `auth_audit_events` table plus a writer wired into login, signup and reset. Migration **032 applied to production 2026-08-12** (verified: table + RLS with no read policy + append-only trigger that rejects UPDATE and DELETE). | `lib/auth/audit-log.ts`, `supabase/migrations/032_auth_audit_events.sql` |
| 19 | Denial-of-service vectors | 🔴 HIGH | ⚠️ **Partly fixed** — the unauthenticated, unmetered LLM path is closed (auth + rate limit + a model allow-list, so a caller can no longer pin the most expensive model). Other unthrottled expensive operations named below are unchanged. | `lib/brain-ai/allowed-models.ts` |

**Correction to this report.** Issue #14 originally recommended emitting auth
events into `compliance_events`. That was wrong and the recommendation is
withdrawn: migration 001 constrains that table's `action_taken` to
`('ALLOWED','BLOCKED','QUARANTINED')`, and `lib/dashboard/gateway-traffic.ts`
reads it to render operator telemetry — so auth rows would either violate the
CHECK or inflate a customer's "prompts scanned" figures with rows that were
never prompts. Authentication events were given their own table instead.

**Migrations now applied (2026-08-12).** Migrations **028** (rate-limit buckets),
**031** (auth lockouts) and **032** (auth audit trail) were applied to the
production Supabase project (`qifynzuyrdxmxlumpsrq`) via the Supabase MCP, after
the latest prior migration `027`. Each was verified after apply: all three
tables exist with RLS enabled, the four RPCs (`consume_rate_limit`,
`sweep_rate_limit_buckets`, `register_auth_failure`, `sweep_auth_lockouts`) are
present, `auth_audit_events` has zero read policies (RLS-on + no-policy = anon
and authenticated read nothing), and its append-only trigger was proven to
reject both UPDATE and DELETE with a probe that rolled itself back (no bogus
audit row persisted). Shared rate limiting, account lockout, CAPTCHA escalation
and the authentication audit trail are therefore **live in production**, not
merely present in code.

Migrations **029** (seed-anchor chain integrity) and **030** (seed-anchor
content) remain unapplied — a separate subsystem, out of scope for this
security work, and flagged here only so the numbering gap is visible.

**Still owned by the founder rather than by code** (dashboard/config, not
schema): turn Supabase **"Confirm email" ON** (makes requirement 3 hold at the
provider as well as at the guard), enable **leaked-password protection**, and
set the environment variables that make the reset-email path and the Stripe
webhook fire (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`,
`STRIPE_WEBHOOK_SECRET`).

---

## Summary

| # | Issue | Status | Severity |
|---|---|---|---|
| 1 | Missing CSRF protection on state-changing endpoints | ⚠️ Partial | MEDIUM |
| 2 | Insecure session management | 🔴 **Present** | **MEDIUM** |
| 3 | Broken access control on API routes | 🔴 **Present** | **HIGH** |
| 4 | SQL injection / unsafe query construction | ✅ Absent | — |
| 5 | Missing input validation on user-supplied data | 🔴 **Present** | **HIGH** (SSRF) |
| 6 | Sensitive data exposure in logs / errors | 🔴 Present | MEDIUM |
| 7 | Insecure direct object references (IDOR) | 🔴 **Present** | **HIGH** |
| 8 | Missing or weak security headers | ⚠️ Partial | MEDIUM |
| 9 | Hardcoded secrets in source | ✅ Absent | — |
| 10 | Outdated / vulnerable dependencies | ⚠️ Partial | LOW |
| 11 | Insecure CORS configuration | ⚠️ Partial | LOW |
| 12 | Missing server-side validation of client data | ✅ Absent | — |
| 13 | Improper error handling leaking internals | ⚠️ Minor | LOW |
| 14 | Lack of audit logging on sensitive actions | 🔴 **Present** | **HIGH** (business-critical) |
| 15 | Insecure file upload handling | ✅ N/A | — |
| 16 | Missing encryption for sensitive data at rest | ⚠️ Partial | MEDIUM |
| 17 | Weak or missing TLS enforcement | ✅ Absent | — |
| 18 | Business logic flaws (price / plan tampering) | ✅ Absent | — |
| 19 | Denial-of-service vectors | 🔴 **Present** | **HIGH** |
| 20 | Insecure default configurations | ⚠️ Partial | MEDIUM |

**Seven issues present, four of them HIGH.** They cluster tightly: the `app/api/brain-ai/*` route
family accounts for #3, #5, #7, and #19 on its own. It is the one part of the codebase that did
not receive the hardening the rest of `app/api/` clearly did.

---

## The headline finding

`app/api/brain-ai/*` is a cluster of **five unauthenticated, unrated, unvalidated routes that are
live in production right now.** Verified by direct request:

```
GET https://www.houndshield.com/api/brain-ai/session  → 200 {"sessionIds":[],"count":0}
GET https://www.houndshield.com/api/brain-ai/ingest   → 200 {"indexStats":{...}}
GET https://www.houndshield.com/api/gateway/metrics   → 200 {"health":...,"budgets":...}
```

This is worth stating plainly because the rest of the API is genuinely well guarded.
`lib/auth/api-guard.ts` is a good abstraction, it fails closed (`:44-45`), it resolves role
server-side and never from the client (`:52-60`), and `/api/rules`, `/api/policy`,
`/api/quarantine`, `/api/gateway/keys`, `/api/dashboard`, and `/api/compliance` all use it
correctly. `/api/v1/chat/completions` correctly returns 401 without a key — confirmed live. The
Brain AI cluster looks like it predates that work and was never brought forward.

---

## 1. Missing CSRF protection on state-changing endpoints

**Status: ⚠️ PARTIAL** · **MEDIUM**

**Finding.** There is no CSRF token, double-submit cookie, or `Origin`/`Referer` check anywhere in
the application. A repo-wide grep for `csrf`, `checkOrigin`, or origin validation returns only
CORS logic (`lib/gateway/cors.ts:33`, `middleware.ts:195`) and one unrelated regex.

**Why it is only partial, not open.** Two accidental defences hold:

1. Every state-changing route requires `Content-Type: application/json`
   (`lib/auth/server-auth-client.ts:30` and all `req.json()` parsers). A cross-origin `POST` with
   that content type is **not** a CORS-simple request and triggers a preflight, which
   `lib/gateway/cors.ts:28-35` refuses for unknown origins. An HTML `<form>` cannot set it.
2. The session cookie is `SameSite=Lax`, which blocks cross-site `POST`. **Verified**, not
   assumed: `node_modules/@supabase/ssr/dist/main/utils/constants.js:6` sets `sameSite: "lax"` in
   `DEFAULT_COOKIE_OPTIONS`, and the application passes no `cookieOptions` override anywhere.

**Residual risk.** Both are defaults inherited from libraries, not decisions this codebase records
or tests. Nothing stops a future route from accepting `application/x-www-form-urlencoded`, and
the `SameSite` value is never asserted anywhere.

**Recommended fix.** Add an `Origin`-header assertion to the shared guard —
`lib/auth/api-guard.ts:40` `requireUser()` is the natural chokepoint, since every cookie-authed
state-changing route already calls it. Reject when `Origin` is present and not
`NEXT_PUBLIC_APP_URL`. ~10 lines, one test, covers every current and future caller.

---

## 2. Insecure session management

**Status: 🔴 PRESENT** · **MEDIUM**

**Session IDs are fine.** Tokens are GoTrue-issued JWTs, not predictable identifiers. Nothing in
this codebase mints a session id.

**The cookie flags are not.** `lib/supabase/server.ts:19-29` passes the cookie `options` from
`@supabase/ssr` through to `cookieStore.set()` unmodified, and the application supplies **no**
`cookieOptions` override anywhere (verified by grep). So the session cookie takes the library
defaults verbatim — `node_modules/@supabase/ssr/dist/main/utils/constants.js:4-11`:

```js
exports.DEFAULT_COOKIE_OPTIONS = {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 400 * 24 * 60 * 60,
};
```

| Flag | Value | Assessment |
|---|---|---|
| `SameSite` | `lax` | ✅ Correct. Blocks cross-site `POST` (this is the property #1 leans on). |
| `HttpOnly` | **`false`** | 🔴 **The session cookie is readable by JavaScript.** |
| `Secure` | **absent** | 🔴 The string `secure` does not appear anywhere in `@supabase/ssr/dist`. The flag is never set. |
| `Max-Age` | **400 days** | ⚠️ A ~13-month session lifetime. |

**Exploit.** `httpOnly: false` means any XSS becomes immediate session theft — `document.cookie`
hands over the access token, no exfiltration cleverness required. That chains directly with
**#8b**: the production CSP allows both `'unsafe-inline'` and `'unsafe-eval'` in `script-src`
(`next.config.js:97`), so the XSS defence and the token-containment defence are weak at the same
time. Either alone would be tolerable; together they are one injection away from account takeover.

The missing `Secure` flag is largely covered in practice by HSTS (`max-age=31536000;
includeSubDomains`, live) plus the edge HTTP→HTTPS redirect, so a plaintext transmission is
unlikely — but the flag is the defence-in-depth that does not depend on either of those holding.

**Important caveat, stated plainly.** `httpOnly: false` is a **deliberate design decision by
`@supabase/ssr`**, not a misconfiguration by this codebase: the browser-side `supabase-js` client
reads the session from the cookie, and setting `httpOnly: true` breaks client-side auth for any
component that calls `createClient()` from `lib/supabase/browser.ts` — which `app/login/page.tsx`
and `app/signup/page.tsx` both do. Flipping the flag is therefore **not** a one-line fix, and this
finding should not be actioned as one.

**Recommended fix**, in increasing order of effort:
1. Set `maxAge` to something proportionate — 7–30 days with refresh — via `cookieOptions` on `createServerClient`. Independent of the `httpOnly` problem and safe to do now.
2. Add `secure: true` (in production) via the same `cookieOptions`. No functional impact.
3. Treat `httpOnly` as a **reason to harden the CSP** rather than a flag to flip: removing `'unsafe-eval'`, and moving toward nonce-based `script-src`, is what actually reduces this risk while the token stays JS-readable.
4. Longer term, migrating fully to server-only session reads (no `createClient()` in browser components) would allow `httpOnly: true`. That is an architecture change, not a config change.

**Also worth a test.** Because every one of these flags is inherited rather than asserted, a
future `@supabase/ssr` upgrade could change them silently in either direction. One test pinning
the four values would make the property visible in CI.

---

## 3. Broken access control on API routes

**Status: 🔴 PRESENT** · **HIGH**

Of 64 route files under `app/api/`, these have **no authentication and no API-key check** while
performing more than public reads:

| Route | File | Exposure |
|---|---|---|
| `POST /api/brain-ai/execute` | `app/api/brain-ai/execute/route.ts:17` | Runs a full LLM turn. Client controls `model` (`:28,55-57`). Unauthenticated **spend**. |
| `GET/POST/DELETE /api/brain-ai/session` | `app/api/brain-ai/session/route.ts:21,38,55` | Lists, reads, **and deletes** any session. See #7. |
| `POST /api/brain-ai/ingest` | `app/api/brain-ai/ingest/route.ts:35` | Fetches arbitrary URLs server-side. See #5. |
| `GET /api/gateway/metrics` | `app/api/gateway/metrics/route.ts` | Internal latency budgets + p50/p95/p99. Confirmed 200 unauthenticated in prod. |
| `POST /api/agents/list` | `app/api/agents/list/route.ts:34` | Task classification with unbounded `task` string. |
| `POST /api/brain-ai/{audit,init,manifest,skills,transcript}` | — | Same cluster, same absence. |

**Exploit.** `curl -X POST https://www.houndshield.com/api/brain-ai/execute -d
'{"sessionId":"x","message":"...","model":"<most expensive model on OpenRouter>"}'` in a loop.
No account, no key, no rate limit. Direct, unbounded billing against `OPENROUTER_API_KEY`.

**Contrast — this is not systemic.** `app/api/rules/route.ts:47,85`,
`app/api/policy/update/route.ts:39,136`, `app/api/quarantine/review/route.ts:29,74`,
`app/api/dashboard/overview/route.ts:61`, and `app/api/compliance/events/route.ts:42` all call
`requireUser()` / `requireRole()` correctly. `app/api/dashboard/overview/route.ts:11` states the
rule explicitly: *the id is taken from the SESSION*. The guard is right; the Brain AI cluster just
never adopted it.

**Recommended fix.** Add `requireUser()` at the top of every `brain-ai/*` handler, plus
`enforceRateLimit(..., LLM_RATE_LIMITS.authenticated)` on `execute` — the exact pattern already
used at `app/api/brain/v3/route.ts:55-58` and `app/api/agent/execute/route.ts:43-46`. Restrict
`model` to a server-side allow-list instead of accepting it from the body. `/api/gateway/metrics`
should require a session or be reduced to a boolean health field.

---

## 4. SQL injection / unsafe query construction

**Status: ✅ ABSENT**

Every database access goes through the Supabase JS client's parameterized builder
(`.from().select().eq()`) or a typed RPC. The only two `.rpc()` calls pass named parameters:
`lib/rate-limit-shared.ts:128-132` and `lib/auth/lockout.ts:134-138`. No string-concatenated SQL,
no template-literal SQL, no `execute_sql`-style passthrough anywhere in `app/` or `lib/`.

Server-side SQL functions are correctly hardened: `migrations/031_auth_lockouts.sql:80` sets
`search_path = public` on the `security definer` function, and `:167-168` revokes `execute` from
`public`, `anon`, and `authenticated`. That is the right pattern and it is applied consistently
(migration 021 does the same repo-wide).

---

## 5. Missing input validation / sanitization

**Status: 🔴 PRESENT** · **HIGH — server-side request forgery**

**Finding.** `lib/brain-ai/ingestion.ts:121-126`:

```ts
async function fetchContent(url: string): Promise<string> {
  ...
  const res = await fetch(url, { ... });
```

No scheme check, no host allow-list, no private-IP / link-local block. It is reached from
`POST /api/brain-ai/ingest` (`app/api/brain-ai/ingest/route.ts:35`, then `:272` in the ingestion
module), which is **unauthenticated and live in production**.

**Exploit.** `POST /api/brain-ai/ingest` with `{"url":"http://169.254.169.254/..."}` or any
internal address. The Vercel function performs the request from inside its own network boundary
and the fetched content is stored in the index and readable back through the same unauthenticated
`GET`. That is a full read-SSRF with an exfiltration channel attached.

**Also missing validation** (lower severity):
- `app/api/brain-ai/execute/route.ts:37-42` — `message` is checked for type only, no length bound. `model` (`:28`) is passed straight to `updateConfig()`.
- `app/api/agents/list/route.ts:43` — `task` has no maximum length.

**Contrast.** Validation elsewhere is strong. `app/api/scan/route.ts:6-8,27-32` bounds text to
100 KB *and* enforces a 512 KB body limit. `app/api/events/ingest/route.ts:31-44` uses a strict
Zod schema that deliberately rejects free-text fields so prompt content can never be stored.
`lib/auth/credential-guard.ts:34-44` bounds every credential field. The pattern exists — the
Brain AI cluster is outside it.

**Recommended fix.** Put a URL validator in front of `fetchContent`: `https:` only, resolve the
hostname and reject RFC 1918 / loopback / link-local / IPv6 ULA, cap redirects, cap response size.
Then gate the route behind `requireUser()`.

---

## 6. Sensitive data exposure in logs or error messages

**Status: 🔴 PRESENT** · **MEDIUM**

**Primary finding — customer email in production logs.**
`app/api/stripe/webhook/route.ts:126`:

```ts
console.log(`[Stripe Webhook] report order recorded: ${session.id} email=${email} wholesale=${isWholesale}`);
```

Every $499 buyer's email address is written in plaintext to Vercel runtime logs, which are
retained, searchable, and readable by anyone with project access. For a product sold on the
promise that regulated data stays inside the customer's boundary, buyer PII sitting in a
third-party log store is the wrong shape of finding to have.

**Secondary — user IDs in cron logs.** `app/api/cron/email-drip/route.ts:121,133,139` log
`user=${row.user_id}`. Opaque UUIDs, so materially lower risk, but they build a correlatable
activity trail.

**Contrast.** The auth surface gets this right and is worth using as the model: every
`reset-password` log line (`route.ts:73,87,90,94`) records an *outcome* and never the address or
the token. `lib/secrets-manager.ts` logs presence, never values.

**Recommended fix.** Replace the address with a masked form or a hash at
`app/api/stripe/webhook/route.ts:126` — `buildOrderView` (`lib/reports/order-view.ts`) already
masks emails for the API response, so the helper exists. Reuse it.

---

## 7. Insecure direct object references (IDOR)

**Status: 🔴 PRESENT** · **HIGH**

`app/api/brain-ai/session/route.ts`:

| Line | Handler | Problem |
|---|---|---|
| `:21-27` | `GET` with no `id` | Returns `listSessionIds()` — **every session id in the store**. No auth. You do not even need to guess. |
| `:29-34` | `GET ?id=<any>` | Returns the full `StoredSession`, including conversation history. No ownership check. |
| `:55-63` | `DELETE ?id=<any>` | Deletes any session. No auth, no ownership check. |

Session ids are generated as `brain-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
(`:47-48`) — weakly random — but that is beside the point when `:21` enumerates them for you.

**Currently low-impact, structurally high-risk.** `lib/brain-ai/session-store.ts:17,20-28` falls
back to an in-process `Map` on serverless, so today each instance holds only its own sessions and
production returns `{"sessionIds":[],"count":0}` on a cold instance. The moment Brain AI moves to
shared storage — which is the natural next step — this becomes a full cross-tenant conversation
read. **It is graded HIGH on the code as written, not on today's accidental containment.**

**Contrast.** The rest of the codebase is careful here.
`lib/blockchain/anchor-service.ts:116-138` scopes every query with
`.eq("compliance_events.user_id", userId)`, and `app/api/reports/order/route.ts:38` requires a
`cs_`-shaped ~66-character unguessable Stripe session id and verifies payment status server-side
(`:57-61`) before returning a **sanitized** view (`:100`).

**Recommended fix.** Remove the list-all branch at `:21-27`. Bind sessions to `requireUser().id`
at creation and check ownership on read and delete. Mint ids with `crypto.randomUUID()`.

---

## 8. Missing or weak security headers

**Status: ⚠️ PARTIAL** · **MEDIUM**

**Live on production** (verified via `curl -D -` on `https://www.houndshield.com/`), served by
`next.config.js:75-108`:

`Strict-Transport-Security: max-age=31536000; includeSubDomains` · `X-Frame-Options: DENY` ·
`X-Content-Type-Options: nosniff` · `Referrer-Policy: strict-origin-when-cross-origin` ·
`Permissions-Policy` · `Content-Security-Policy` with `frame-ancestors 'none'`.

**Two gaps:**

**8a — `base-uri` and `form-action` are missing in production.** Both directives exist only in
`middleware.ts:137-138`, and the middleware does not execute (Phase 1 G6). Confirmed against the
live CSP header, which contains neither. Without `base-uri 'self'`, an injected `<base>` tag can
repoint every relative URL on the page; without `form-action 'self'`, an injected form can post
credentials off-site. Both are exactly the directives that turn a contained HTML injection into
credential theft.

**8b — CSP allows `'unsafe-inline'` and `'unsafe-eval'` in `script-src`** (`next.config.js:97`).
This substantially weakens XSS defence. `'unsafe-inline'` is a genuine Next.js App Router
constraint without nonce plumbing; `'unsafe-eval'` usually is not, and is worth testing for
removal.

> **This compounds with #2.** The session cookie is `httpOnly: false`, so it is readable by
> JavaScript. A weak `script-src` and a JS-readable session token are the two halves of the same
> attack: any XSS that lands is an immediate account takeover rather than a contained defacement.
> Of the two, tightening the CSP is the tractable side — see #2 for why flipping `httpOnly` is
> not a one-line change.

**Also missing:** `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`. Not required, but
cheap.

**Recommended fix.** Move `base-uri 'self'` and `form-action 'self'` into the `next.config.js`
CSP — that is a **one-line change that does not depend on the `vercel.json` fix** and closes 8a
today. Then attempt `'unsafe-eval'` removal behind a report-only CSP.

---

## 9. Hardcoded secrets, API keys, or credentials in source

**Status: ✅ ABSENT**

Scanned `.ts`, `.tsx`, `.js`, `.json`, `.md` (excluding `node_modules`) for `sk_live`, `whsec_`,
JWT prefixes, `AKIA[0-9A-Z]{16}`, and PEM private-key headers. Every hit is either a test fixture
(`process.env.STRIPE_SECRET_KEY = "sk_test"` in `__tests__/`) or a **deliberate demo string**:
`app/demo/page.tsx:118` contains `AKIAIOSFODNN7EXAMPLE`, which is AWS's published documentation
placeholder used here as sample content for the detection engine to find. Correct as written.

`lib/secrets-manager.ts` centralizes every accessor, reads only from `process.env`, and logs
presence rather than values (`:113-114`).

**Standing item from `docs/SECURITY-ROTATION.md`:** four credentials remain in git history. That
is a repository-history issue, not a source issue, and rotation must happen **before** any history
rewrite.

---

## 10. Outdated or vulnerable dependencies

**Status: ⚠️ PARTIAL** · **LOW**

| Package | Severity | Where | Production impact |
|---|---|---|---|
| `brace-expansion` | HIGH (DoS) | app, **dev tree** (`@typescript-eslint`) | None — not in the runtime bundle. |
| `js-yaml` 4.0.0-4.3.0 | HIGH (quadratic CPU) | app, **dev tree** | None. |
| `nanoid` | HIGH | `proxy/` | Reachable if used for id generation. |
| `postcss` | MODERATE | `proxy/` | Build-time only. |

`npm audit --omit=dev` in `compliance-firewall-agent/` reports **0 vulnerabilities across 393
production dependencies.** That is a good result and worth keeping.

**Recommended fix.** `npm audit fix` in both workspaces. Add `npm audit --omit=dev` as a CI gate
so production regressions fail the build while dev-tree noise does not.

---

## 11. Insecure CORS configuration

**Status: ⚠️ PARTIAL** · **LOW**

`lib/gateway/cors.ts` is written correctly: production allows only `NEXT_PUBLIC_APP_URL`, and when
the origin does not match it **omits the header entirely** (`:33-35`) rather than echoing it. The
comment records that this fixed a prior audit finding (H4) where these routes returned `*`.

**Two caveats:**

**11a — the middleware CORS layer does not run.** `middleware.ts:191-216`, including the `OPTIONS`
preflight responder at `:213-215`, is dead in production (Phase 1 G6). Any `/api/gateway/*` route
relying on the middleware rather than `lib/gateway/cors.ts` sends no ACAO header and answers no
preflight. This **fails closed** — browsers block the request — so it is a functionality bug more
than a security hole. Report it accurately: gateway CORS is *not configured* in production, it is
*absent*.

**11b — demo mode reflects any origin.** `lib/gateway/cors.ts:26-27` sets
`Access-Control-Allow-Origin: <request origin>` when `NEXT_PUBLIC_APP_URL` is unset or localhost.
Correct for local development; if that variable is ever unset on a public deployment, it
silently becomes allow-all.

**Recommended fix.** Make demo-mode reflection conditional on `NODE_ENV !== 'production'` as well,
so a missing env var cannot open it.

---

## 12. Missing server-side validation of client-provided data

**Status: ✅ ABSENT** (as a systemic issue)

The codebase gets the important case right. `app/api/dashboard/overview/route.ts:11` states the
rule in a comment — *the id is taken from the SESSION via `requireUser()`* — and
`lib/auth/api-guard.ts:52-60` resolves `role` from the `profiles` table with the service client,
**never** from a request body or header. `app/api/gateway/keys/route.ts:20` records the same
principle.

Business-critical inputs are re-validated server-side: `app/api/stripe/report-checkout/route.ts:89`
verifies a `partner_ref` against the database before honouring the wholesale price (see #18).

The unbounded-string cases are covered under #5 rather than duplicated here.

---

## 13. Improper error handling leaking stack traces or internals

**Status: ⚠️ MINOR** · **LOW**

One instance: `app/api/email/welcome/route.ts:122` returns `{ sent: false, error: error.message }`
— a raw upstream (Resend) error message reaching the client. Low value to an attacker, but it is
the one place the pattern is broken.

Everything else handles this correctly, and the auth surface is exemplary: `login/route.ts:99-104`,
`signup/route.ts:141-147`, and `otp/route.ts:165-171` all log `error.message` server-side and
return a fixed neutral string. `app/auth/confirm/route.ts:50-54` deliberately swallows a
misconfiguration so a user with a merely-expired link gets a graceful redirect instead of a 500.

**Recommended fix.** Return a fixed string at `app/api/email/welcome/route.ts:122`; keep the
detail in the server log.

---

## 14. Lack of audit logging on sensitive actions

**Status: 🔴 PRESENT** · **HIGH — the finding with the most business weight**

**Finding.** **No authentication event is recorded in the audit trail.** A grep across
`app/api/auth/` and `lib/auth/` for `compliance_events`, `auditLog`, or any audit write returns
**zero** hits. Not one of these produces an audit record:

- successful sign-in
- failed sign-in
- account lockout tripping
- password-reset request
- password-reset token consumption
- account creation
- email confirmation

Failures are written to `console.*` only (`login/route.ts:99`, `lockout.ts:118,147`), which is
operational logging, not tamper-evident evidence.

**Why this is graded HIGH for HoundShield specifically.** The product sells SHA-256 hash-chained
audit logs as C3PAO-facing evidence, and grades customers on NIST 800-171 **3.3.1/3.3.2** (audit
records) and **3.1.8** (unsuccessful logon attempts). An assessor who asks *"show me your own
authentication audit trail"* currently gets `console.log`. The infrastructure to do this properly
already exists — `lib/audit/record-decision.ts` and the `compliance_events` table — it just was
never wired to the auth plane.

The gap is also operational: with no failed-login record, a credential-stuffing campaign against
HoundShield's own customers leaves no queryable trace.

**Recommended fix.** Emit a `compliance_events` row from `lib/auth/lockout.ts` (on
`registerFailure` and lock trip) and from the three credential routes on success and failure.
Metadata only — email **hash**, outcome, timestamp, hashed IP — never the address or the password,
matching the privacy posture already established in `migrations/031_auth_lockouts.sql:42-44`.

---

## 15. Insecure file upload handling

**Status: ✅ NOT APPLICABLE**

No `multipart/form-data` parsing, no `formData()` upload handler, no user-controlled file writes.
The only `writeFile` is `lib/brain-ai/session-store.ts:50-51`, which writes application-generated
JSON to a fixed directory. Its path is sanitized — `sessionPath()` (`:41-42`) strips everything
outside `[a-zA-Z0-9-_]`, so path traversal via `sessionId` is blocked. Correct as written.

---

## 16. Missing encryption for sensitive data at rest

**Status: ⚠️ PARTIAL** · **MEDIUM**

**What is protected:** Supabase Postgres is encrypted at rest at the platform level. Gateway API
keys are stored as SHA-256 hashes with a non-secret display prefix
(`migrations/019_api_keys.sql:15-18`) — the raw key is shown once. Auth lockout rows store only a
hash (`031:50`). Passwords are bcrypt, held by GoTrue.

**Gap 16a — application-level encryption is optional and silently disabled.**
`lib/secrets-manager.ts:60-67`: `getEncryptionKey()` returns `null` when `ENCRYPTION_KEY` is
absent or under 64 hex chars, logging a warning. Quarantined payloads — which by definition are
the prompts that *tripped a CUI/PHI detector* — therefore fall back to unencrypted storage if the
key is unset. This is the highest-sensitivity data in the system, and its protection depends on an
environment variable whose absence produces a `console.warn` and nothing else.

**Gap 16b — Better Auth tables have RLS enabled with no policies.** The Supabase advisor reports
`rls_enabled_no_policy` on `public.user`, `public.session`, `public.account`, and
`public.verification`. `account` holds password hashes and OAuth tokens. RLS-with-no-policy denies
all `anon`/`authenticated` access, so this is **fail-closed and currently correct** — but it is
correct by omission rather than by an explicit deny policy, and `migrations/024_better_auth_core.sql:18`
shows the sensitivity was understood. Worth making explicit.

**Recommended fix.** Make `ENCRYPTION_KEY` a hard requirement for the quarantine path — refuse to
store rather than store in the clear — and surface its absence in `/api/health`. Add explicit
deny-all policies to the four Better Auth tables so the intent is recorded in schema.

---

## 17. Weak or missing TLS enforcement

**Status: ✅ ABSENT**

HSTS is live with `max-age=31536000; includeSubDomains` (verified on the production response).
`next.config.js:62-67` redirects `x-forwarded-proto: http` → `https`, and Vercel terminates TLS
and redirects HTTP at the edge regardless. HTTP/2 confirmed.

**Two observations (INFO):**
- No `preload` directive on HSTS. Adding it (and submitting to the preload list) closes the first-visit window. Irreversible in practice — a deliberate choice, not an oversight.
- The apex serves `strict-transport-security: max-age=63072000` (Vercel default) while `www` serves `31536000` (from `next.config.js`). Harmless inconsistency; the longer value wins where it applies.

---

## 18. Business logic flaws (price/plan tampering, bypassing the $499 gate)

**Status: ✅ ABSENT** — this is well done and worth saying so

`app/api/stripe/report-checkout/route.ts`:

- Prices are **server-side constants** (`:35-36`), never read from the request body.
- The `wholesale: true` flag alone does nothing. `:89` requires `isApprovedPartner(partner_ref)` to also return true, and that function (`:56-75`) validates UUID shape, then queries `partner_applications` for `status in ('approved','active')`. A client cannot self-serve the $299 price by passing an arbitrary `partner_ref`. The code cites this as audit finding H3 — the fix held.
- `vertical` is checked against an allow-list (`:92-93`) before reaching Stripe metadata.
- The fallback rail is asymmetric on purpose (`:100-112`, `:161-170`): retail falls back to the Payment Link; wholesale keeps an honest error rather than silently upcharging $299 → $499. That is the right trade in both directions.

`app/api/reports/order/route.ts` requires `session.payment_status === 'paid'` (`:57-61`) before
confirming an order — entitlement is derived from Stripe, not from a client claim.

**One standing operational gap, already tracked outside this audit:** `STRIPE_WEBHOOK_SECRET` is
unset in production, so a completed purchase records no order row and sends no receipt. That is a
revenue-integrity problem, not a tampering vulnerability, and it is already on the founder's
blocker list.

---

## 19. Denial-of-service vectors

**Status: 🔴 PRESENT** · **HIGH**

**19a — Unauthenticated LLM spend.** `app/api/brain-ai/execute/route.ts` has no auth and **no rate
limiter of any kind**. Each call runs `runTurnLoop` against OpenRouter, and the caller chooses the
model (`:55-57`). This is a direct, unbounded path to a billing incident. The correct pattern is
two files away — `app/api/brain/v3/route.ts:55-58` applies
`enforceRateLimit(..., LLM_RATE_LIMITS.authenticated)`.

**19b — Unauthenticated outbound fetch.** `POST /api/brain-ai/ingest` (see #5) makes the server
issue arbitrary HTTP requests with no cap on count or response size.

**19c — Every rate limit in the app is degraded.** `rate_limit_buckets` (migration 028) does not
exist in production — verified directly against the database. `lib/rate-limit-shared.ts:149-157`
therefore falls back to the in-process limiter on **every** call, for every route that uses it:
`/api/v1/chat/completions`, `/api/brain/*`, `/api/agent/execute`, `/api/auth/*`. Real ceiling is
`limit × concurrent Fluid Compute instances`, reset on every cold start. The module's own header
comment (`:9-15`) describes this precisely as the defect migration 028 was written to fix.

**19d — Middleware's global 60 req/min limiter does not run** (Phase 1 G6). Every route not using
`rate-limit-shared` — including `/api/scan`, which runs the full regex + AI classifier — has no
request-rate ceiling at all in production. `/api/scan` does bound body size to 512 KB
(`route.ts:11,27-32`), which limits per-request cost but not request count.

**Recommended fix.** Apply migration 028 (founder). Add `requireUser()` + `enforceRateLimit` to
the Brain AI cluster. Bound `message` and `task` lengths.

---

## 20. Insecure default configurations

**Status: ⚠️ PARTIAL** · **MEDIUM**

**20a — TypeScript errors do not block the build.** `next.config.js:35-37` sets
`typescript.ignoreBuildErrors: true`. A type error that would catch a real bug ships. The
mitigation is that CI runs `npx tsc --noEmit` separately — genuinely load-bearing, and the README
correctly flags it. Keep the CI step; treat the config as debt.

**20b — `allowedDevOrigins` includes wildcards.** `next.config.js:12-17` allows
`http://127.0.0.1:*` and `http://localhost:*`. Development-only in Next.js, so not a production
exposure, but broader than necessary.

**20c — Fail-open defaults are correct but silent.** Three modules degrade quietly when
misconfigured: `lib/rate-limit-shared.ts:149` (no shared store), `lib/auth/lockout.ts:117,146`
(no lockout table), `lib/auth/captcha.ts:51` (no Turnstile key → verification returns `true`).
Each choice is individually defensible — availability of a paid endpoint outranks perfect
accounting during an outage — but together they mean **three security controls can be entirely
absent while every health check stays green.** That is precisely what happened, and it is why the
Phase 1 report grades it CRITICAL.

**20d — Demo-mode CORS reflection** keys off `NEXT_PUBLIC_APP_URL` alone, not `NODE_ENV`
(`lib/gateway/cors.ts:21`). See #11b.

**Recommended fix.** Add the state of all three degradable controls to `/api/health` and alert on
degradation. A control that fails open must be loud, or it is not a control.

---

## Recommended remediation order

| Priority | Item | Issues closed | Owner |
|---|---|---|---|
| 1 | Apply migrations **028** + **031** to production | #19c, Phase 1 G5 | Founder (DDL) |
| 2 | `requireUser()` + rate limit on all `app/api/brain-ai/*` | #3, #7, #19a | Code |
| 3 | URL allow-list + private-IP block in `lib/brain-ai/ingestion.ts` | #5, #19b | Code |
| 4 | Audit-log auth events to `compliance_events` | #14 | Code |
| 5 | Add `base-uri` + `form-action` to the `next.config.js` CSP | #8a | Code (1 line) |
| 6 | Mask the email at `stripe/webhook/route.ts:126` | #6 | Code (1 line) |
| 7 | Enable leaked-password protection (Supabase dashboard) | Phase 1 G8 | Founder |
| 8 | Surface degraded controls in `/api/health` | #20c | Code |
| 9 | Session cookie `secure: true` + `maxAge` 400 days → 7–30 days | #2 | Code (config) |
| 10 | `npm audit fix` in both workspaces + CI gate | #10 | Code |
| 11 | `Origin` assertion in `requireUser()` | #1 | Code |
| 12 | Remove `'unsafe-eval'` from `script-src` (report-only CSP first) | #8b, #2 | Code + verify |
| 13 | Fix domain redirect config, **then** the legacy root `vercel.json` | #8a, #11a, #19d | Founder + code |

Item 13 last, and carefully: `next.config.js:55-61` redirects `www → apex` while Vercel's domain
config 308s `apex → www`. Restoring the framework routing table before fixing the domain config
produces an infinite redirect loop on every URL.

---

## Method

- Static review of all 64 `app/api/**/route.ts` handlers, `lib/auth/*`, `lib/rate-limit*`, `middleware.ts`, `next.config.js`, both `vercel.json` files, and all 31 migrations.
- Live unauthenticated probes against `https://www.houndshield.com` (read-only `GET`, plus one unauthenticated `POST` to `/api/v1/chat/completions` that correctly returned 401). No account was created, no state was written.
- Production database queried read-only via Supabase MCP: migration list, security advisors, and one aggregate count over `auth.users` returning no personal data.
- `npm audit` in `compliance-firewall-agent/` and `proxy/`.
- Full Vitest suite executed: **2,497 tests across 186 files, all passing** (17.4 s).
- Library defaults read from `node_modules` rather than assumed — `@supabase/ssr` cookie options and `better-auth`'s password hasher were both verified against installed source.

**Not covered:** the `proxy/` scanner internals, the browser extension, `sdk/`, penetration testing, and authenticated-session testing (no test credentials were used).
