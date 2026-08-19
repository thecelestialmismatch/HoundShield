<div align="center">

<img src="https://raw.githubusercontent.com/thecelestialmismatch/HoundShield/main/compliance-firewall-agent/public/logo.png" width="180" alt="HoundShield" />

# HoundShield

**Compliance evidence you can check yourself.**

Every AI prompt scanned on your own hardware — nothing leaves the building.
Every pattern, every number, readable in this repo before you spend a dollar.

<br/>

[![CI](https://github.com/thecelestialmismatch/HoundShield/actions/workflows/ci.yml/badge.svg)](https://github.com/thecelestialmismatch/HoundShield/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-0F172A?style=flat-square)](LICENSE)
![NIST 800-171](https://img.shields.io/badge/NIST_800--171-110_controls-C8A24B?style=flat-square)

[**Website**](https://www.houndshield.com) · [**Try the scanner**](https://www.houndshield.com/demo#snapshot) · [**Docs**](https://www.houndshield.com/docs) · [**Testing guide**](docs/TESTING-GUIDE.md) · [**Security**](SECURITY.md)

</div>

---

## Why HoundShield

Every cloud AI data-loss tool — Nightfall, Strac, Microsoft Purview — scans your prompts
by **first sending them to the vendor's servers.** In a regulated environment that
transmission is itself the disclosure you were trying to prevent: a DFARS 252.204-7012
CUI spill for a defense contractor, an undocumented PHI disclosure under the HIPAA
Privacy Rule for a clinic.

You cannot scan regulated data for compliance by violating compliance.

HoundShield scans locally. In self-hosted mode there is no "us" in the data path.

## How it works

One base-URL change puts the scanner between your team and every model. Detection
runs on your hardware; only prompts that pass ever reach a provider.

```mermaid
flowchart LR
    A["Your team<br/>ChatGPT · Copilot · Claude · Cursor"] --> B

    subgraph BOUNDARY ["Your network — nothing leaves during this step"]
        B["HoundShield proxy<br/>OpenAI-compatible"] --> C{"16 detection engines<br/>53 patterns · sub-ms"}
        C -->|clean| D["Forward upstream"]
        C -->|violation| E["Block or quarantine"]
        C --> F[("SHA-256<br/>hash-chained log")]
    end

    D --> G["AI provider"]
    F --> H["Audit PDF<br/>mapped to NIST 800-171"]
```

The proxy speaks the OpenAI API, so no client code changes — you set `baseURL`
and everything else stays the same.

### What the 16 engines look for

| Defense | Health | Credentials | Proprietary |
|---|---|---|---|
| CUI markings | PHI · MRN | API keys / secrets | Source code |
| CAGE codes | ICD / diagnosis | AWS / cloud keys | Trade-secret IP |
| Contract / DoDAAC # | SSN / PII | JWT / tokens | IP / network data |
| Clearance levels | | PCI / card data | |
| ITAR / EAR terms | | | |
| Export-control | | | |

Counts are computed from the shipped registry in `lib/detection/engines.ts`, so a
claim on the site cannot drift from the code. The patterns are plain regex in this
repository — read them before you trust them.

### A blocked request

Same call you already make. The block happens before the request leaves.

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{"model":"gpt-4o","messages":[
        {"role":"user","content":"Summarize our CAGE 1ABC2 contract"}]}'
```

```jsonc
{
  "houndshield": {
    "action": "BLOCKED",
    "risk_level": "CRITICAL",
    "detections": [
      { "engine": "CUI", "pattern": "CAGE code", "nist_control": "SC.L2-3.13.1" }
    ],
    "message": "Blocked before leaving your perimeter. Logged to the audit chain."
  }
}
```

A clean prompt returns the provider's normal response, unchanged.

## What it looks like

Captured from a production build of this repo (`npm run build` → standalone
server), not mockups — **captured 2026-08-15**, so the landing page may have moved
since. Regenerate at any time with the procedure in
[docs/assets/README.md](docs/assets/README.md).

<div align="center">

<img src="docs/assets/screenshots/home.png" width="820" alt="HoundShield homepage — local-only prompt scanning with a live AI monitor" />

</div>

| | |
|---|---|
| <img src="docs/assets/screenshots/pricing.png" width="400" alt="Pricing page" /> | <img src="docs/assets/screenshots/security.png" width="400" alt="Security page" /> |
| **Pricing** — one grid, $499 report as the lead | **Security** — how prompt data is handled |
| <img src="docs/assets/screenshots/how-it-works.png" width="400" alt="How it works page" /> | <img src="docs/assets/screenshots/partners.png" width="400" alt="Partner program page" /> |
| **How it works** — the interception path | **Partners** — the RPO / MSP program |

### Cookie consent

Analytics stay off until the visitor opts in — the banner blocks nothing and
sets no analytics cookie by default, and the choice is revocable from
[/cookies](https://www.houndshield.com/cookies).

<div align="center">

<img src="docs/assets/screenshots/cookie-consent.png" width="820" alt="Cookie consent banner offering Accept essential, Accept all, and Cookie settings" />

</div>

### Demo

**There is no recorded demo video in this repository yet** — the honest status,
rather than a broken link. What exists today:

- The live interactive scanner: [houndshield.com/demo](https://www.houndshield.com/demo#snapshot)
- The verbatim script a recording should follow: [docs/DEMO-SCRIPT.md](docs/DEMO-SCRIPT.md)

The demo ends on the generated PDF, every time. Recording it requires the proxy
running against a real assistant session, which cannot be produced from CI.

## Verified numbers

Not marketing figures — reproduce every one with the commands in
[docs/TESTING-GUIDE.md](docs/TESTING-GUIDE.md).

| Claim | Measured | Reproduce with |
|---|---|---|
| Scan latency | **p99 0.65–0.89 ms** across runs, budget 10 ms · 2,000 cold scans | `cd proxy && npm run bench` |
| Detection coverage | **53 patterns** across **16 engines** | `lib/detection/engines.ts` |
| App test suite | **2,993 passing** / 212 files | `cd compliance-firewall-agent && ./node_modules/.bin/vitest run` |
| Proxy test suite | **92 passing** / 4 files | `cd proxy && npx vitest run` |

Engine and pattern counts shown in the UI are **computed from the shipped registries**, so
a marketing claim cannot silently drift from the code.

## Deployment modes — read before claiming compliance

| Mode | Runs on | CUI/PHI-safe? | Use for |
|---|---|---|---|
| **A — Hosted** | Vercel | ❌ **No** — not FedRAMP-authorized | Demo, non-CUI evaluation |
| **B — Self-hosted** | Your infrastructure (Docker) | ✅ Data never leaves your boundary | CUI and PHI workloads |
| **C — Air-gapped** | Your isolated network | ✅ | IL-5+, enterprise |

**Only Modes B and C are CUI-safe.** The marketing and dashboard plane runs on Vercel —
fine for a website, not fine for a regulated data path. The site says so too.

## Compliance context

**CMMC Phase 2 enforcement was suspended on 13 July 2026** by the Department of War
pending a review. Phase 2 was not cancelled and the 10 November 2026 date has not been
replaced.

What is unchanged, and what this project maps to: **DFARS 252.204-7012**, all **110
NIST SP 800-171 Rev 2** controls, and the annual **SPRS self-assessment**. On the
health side, **HIPAA 45 CFR Part 164** and all 18 Safe Harbor identifiers.

HoundShield is engineered as a technical control against specific requirements — it is
not a certification, and this repository does not claim one. See
[/trust](https://www.houndshield.com/trust) for what is built-for versus attested.

## Quickstart

```bash
git clone https://github.com/thecelestialmismatch/HoundShield.git
cd HoundShield

# The product — the local scanning proxy
cd proxy && npm install && npm run dev

# The web plane — marketing, checkout, evidence export
cd ../compliance-firewall-agent && npm install && npm run dev
```

Point your AI client's base URL at the proxy and send a prompt; anything sensitive is
flagged before it leaves the machine.

> **Docker (Mode B):** `proxy/Dockerfile` builds today, but `houndshield/proxy:latest` is
> **not yet published**. Publishing needs the `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN`
> repo secrets plus a `proxy-v*` tag — `.github/workflows/docker-publish.yml` does the rest.

## Repository map

```
compliance-firewall-agent/   Next.js 15 · React 19 — marketing, checkout, dashboard
  app/                       App Router — public pages, /console, 66 API routes
  lib/classifier/            90 detection patterns (builtin · CMMC · HIPAA)
  lib/detection/engines.ts   Single source of truth for engine + pattern counts
  lib/reports/               PDF generation + SHA-256 evidence chain
  lib/billing/               Entitlements + PURCHASABLE_OFFER (what is actually for sale)

proxy/                       Node.js HTTPS intercept — THE PRODUCT
  patterns/index.ts          33 standalone patterns (extend, never replace)
  scanner.ts                 The hot path — benchmarked on every CI run
  ooda/                      Observe/orient/decide loop + SQLite audit store

docs/                        STRIPE-FIX · TESTING-GUIDE · ROADMAP-12-MONTH ·
                             SECURITY-ROTATION · OUTREACH-HEALTHCARE
```

## Tech stack

Versions are the installed majors; `compliance-firewall-agent/package.json` and
`proxy/package.json` are the source of truth if this table drifts.

### Web plane — `compliance-firewall-agent/`

| Layer | Choice | What it does here |
|---|---|---|
| Language | **TypeScript 5**, `strict: true` | The build does **not** gate on type errors (`next.config` sets `typescript.ignoreBuildErrors`), so `npx tsc --noEmit` is a separate, required check. |
| Framework | **Next.js 16** (App Router) | Server Components by default. Credential handling lives in server routes under `app/api/auth/` — that is what gives rate limiting, lockout and response-timing control somewhere to attach. |
| UI | **React 19**, **Tailwind CSS 3.4**, Framer Motion, Recharts, Lucide | Public pages are light-mode `hermes.css`; `/command-center` is dark. |
| Database | **Supabase Postgres** (`@supabase/supabase-js`, `@supabase/ssr`) | Row-level security. Schema changes are numbered files in `supabase/migrations/`, applied in order. |
| Auth | **Supabase Auth (GoTrue)** primary · **Better Auth 1.6** for SSO/2FA surfaces | Password hashing is GoTrue's **bcrypt**. The application never hashes a password itself — verified: no MD5/SHA-1 or raw-SHA-256 password path exists in `lib/` or `app/`. |
| Validation | **Zod 4** | Every credential route parses its body through a schema before the value is used. |
| Email | **Resend** | Reset and verification mail is generated and sent by us (`generateLink` + Resend), so the flow needs no Supabase-dashboard template config. |
| Payments | **Stripe 22** | The $499 one-time report. |
| Tests | **Vitest 4** | Counts and reproduce commands live in Verified numbers above. |
| Monitoring | **Sentry**, **PostHog** | PostHog is gated on cookie opt-in. |

### Proxy — `proxy/` (the shipped product)

**Node.js + Express 5**, **better-sqlite3** for the local append-only audit
store, **Zod** for config validation. No network dependency on HoundShield —
prompt content never leaves the customer's network.

### The auth flow, module by module

Server-side unless noted.

| Module | Responsibility |
|---|---|
| `lib/auth/credential-guard.ts` | Zod schemas plus the shared per-IP / per-address gate every credential route calls first. |
| `lib/auth/lockout.ts` | Consecutive-failure account lockout, keyed on a SHA-256 of the address so the lock itself cannot confirm an account exists. NIST 800-171 **3.1.8** / CMMC **AC.2.008**. |
| `lib/auth/timing.ts` | Equalizes response latency to a fixed floor plus jitter, closing the bcrypt-vs-no-bcrypt timing oracle. |
| `lib/auth/captcha.ts` | Turnstile verification, required after repeated failures. |
| `lib/auth/auth-error-message.ts` | The single neutral message every sign-in failure returns. |
| `lib/auth/signup-result.ts` | Same contract for sign-up — never echoes "already registered". |
| `lib/auth/server-auth-client.ts` | Browser caller; treats `501` as "feature off, use the legacy path". |
| `lib/rate-limit-shared.ts` | Postgres-backed counters shared across instances, with a local fail-open fallback. |
| `lib/auth/session.ts` | The one place the app asks "who is the caller?". Normalizes Supabase and Better Auth into a `SessionUser`, including `emailVerified`. Wrapped in React `cache()` — memoized per request, never across requests. |
| `lib/auth/api-guard.ts` | `requireUser()` / `requireRole()`. Fails closed: no session → `401`; session whose address is unproven → `403 email_unverified`. This is where "an account is not active until the email is verified" is actually enforced, rather than being a property of a Supabase dashboard toggle. |
| `lib/auth/audit-log.ts` | Append-only authentication audit trail (`auth_audit_events`, migration 032). NIST 800-171 **3.3.1 / 3.3.2**, CMMC **AU.2.041**. Keyed on an email hash and written whether or not the address resolves, so a row proves an *attempt*, never an account. Fails open (an audit outage must not become an auth outage) but logs at error level, because silence would make "no rows" look like "no attacks". |

### Supporting guards outside the credential routes

| Module | Responsibility |
|---|---|
| `lib/net/safe-fetch.ts` | SSRF bound for any URL that arrives in a request body. Resolves the hostname and judges every returned address against the private/reserved blocklist (IPv4, IPv6, and IPv4-mapped IPv6), re-validates each redirect hop, and caps response size and time. Resolution rather than hostname matching, because a name an attacker controls can point anywhere. |
| `lib/brain-ai/route-guard.ts` | `guardBrainAi()` — the shared authenticate-then-meter front half of every `/api/brain-ai/*` handler, plus `scopedSessionId()`, which namespaces a session id to its owner so a supplied `?id=` can only address the caller's own row. |
| `lib/brain-ai/allowed-models.ts` | Server-side allow-list for the caller-supplied `model` field, derived by filtering the existing pricing table on an output-price ceiling. A request field must never select what we are billed for. |

## Testing

```bash
cd compliance-firewall-agent && ./node_modules/.bin/vitest run   # app suite
cd proxy && npx vitest run                                       # proxy suite
cd proxy && npm run bench                                        # p99 < 10ms gate
cd compliance-firewall-agent && npm run build                    # must pass pre-deploy
curl -s https://www.houndshield.com/api/health                   # live smoke test
```

Two traps that cost real debugging time — **both exit 0 while failing**:

- Never pass `--reporter=basic` to vitest (fails with `ERR_LOAD_URL`).
- Never run `npx vitest` from the repo root — it loads the *parent* repo's config and
  tests nothing. Always `cd` into the package first.

**Read the last lines of output. Never trust an exit code from a piped command.**

Proxy tests failing with `NODE_MODULE_VERSION` is a stale native binary, not a code bug:

```bash
cd proxy && npm rebuild better-sqlite3
```

## Pricing

One offer: a **$499 one-time AI Risk Assessment Report** — no subscription, no per-seat
licence, no contract. The in-browser scanner at
[/demo](https://www.houndshield.com/demo) is free and needs no account. Full terms on
[the pricing page](https://www.houndshield.com/pricing).

## Project status

**Implemented and tested:** the scanning proxy and all 16 detection engines, the
SHA-256 hash-chained audit log, PDF evidence export mapped to NIST 800-171, the
in-browser scanner, authentication, and the 110-control assessment. Both test suites
and the production build gate every commit — the numbers in
[Verified numbers](#verified-numbers) are reproducible from a clean clone.

**Known limitations, stated plainly:**

- **`houndshield/proxy:latest` is not yet published to Docker Hub**, so Mode B is a
  build-it-yourself deployment today. `proxy/Dockerfile` builds; publishing needs the
  registry secrets and a `proxy-v*` tag, and `.github/workflows/docker-publish.yml`
  does the rest.
- **No SOC 2 report and no FedRAMP authorization.** Both are stated on
  [/trust](https://www.houndshield.com/trust) rather than implied away.
- The hosted trial is **not** a CUI or PHI environment. See
  [Deployment modes](#deployment-modes--read-before-claiming-compliance).

Runtime configuration health is reported by the service itself rather than tracked in
this file, so it cannot go stale:

```bash
curl -s https://www.houndshield.com/api/health
```

## Contributing

Both test suites and `npm run build` must pass before a commit. Never push to `main`
directly. See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

## License

MIT — see [LICENSE](LICENSE).
