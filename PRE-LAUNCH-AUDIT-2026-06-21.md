# HoundShield — Pre-Launch Audit & Hardening · 2026-06-21

Branch: `claude/pre-launch-audit-6iieir` · App: `compliance-firewall-agent` (Next.js 15, React 19)
Gates after this work: **`npm run build` → exit 0** · **`npm test` → 503/503 passing** (was 492; +11 new).

This audit answers three questions: *what was lacking*, *what we shipped to fix it*, and *what
still genuinely needs the founder* (keys/DNS/dashboards that cannot be coded around).

---

## 1. State of the code (verified this session)

| Area | Status | Evidence |
|------|--------|----------|
| Production build | ✅ Green | `next build` exit 0, full route table |
| Test suite | ✅ 503/503 | `vitest run`, 32 files |
| Security headers | ✅ Strong | `middleware.ts`: HSTS, X-Frame DENY, nosniff, Referrer-Policy, Permissions-Policy + CSP in `next.config.js` |
| Image optimization | ✅ Fixed already | `next.config.js` uses AVIF/WebP (the old `unoptimized:true` is gone) |
| Custom 404 / error / loading | ✅ Present | `app/not-found.tsx`, `app/error.tsx`, `app/loading.tsx` |
| Rate limiting | ✅ Present | sliding-window limiter, per-route caps (scan 15, gateway 120) |
| SEO/AEO foundation | ✅ Strong | `robots.ts`, `sitemap.ts`, JSON-LD, `/answers/[slug]`, `llms.txt` |
| Auth route protection | ✅ Present | middleware guards `/command-center`, redirects unauth → `/login` |

The foundation is solid. The gaps were **legal/trust completeness and GDPR**, not core engine.

---

## 2. Shipped this session (code-only, no keys required)

| # | Gap (launch checklist) | Fix | Proof |
|---|------------------------|-----|-------|
| 1 | **No GDPR cookie consent** — PostHog initialized unconditionally | `lib/consent.ts` (SSR-safe consent store) + `components/CookieConsent.tsx` banner; `PostHogProvider` now gates `posthog.init()` on `hasAnalyticsConsent()`. Analytics is **off until opt-in**; "Reject" keeps the product fully functional. | 9 tests; banner renders only while undecided |
| 2 | **No `security.txt`** — table-stakes for a security vendor | `app/.well-known/security.txt/route.ts` (RFC 9116, self-renewing `Expires`, points at `/security`) | 2 tests; built as static route |
| 3 | **No Security & Trust page** | `app/security/page.tsx` — local-only boundary, encryption, audit chain, tenant isolation, framework alignment, vuln-disclosure | builds; linked in footer + sitemap |
| 4 | **No Data Processing Agreement** — blocks DoD/healthcare procurement | `app/dpa/page.tsx` — GDPR Art. 28 / HIPAA BAA / DFARS 7012 framing, sub-processor list, SCC reference | builds; in footer + sitemap |
| 5 | **No Acceptable Use Policy** | `app/acceptable-use/page.tsx` | builds; in footer + sitemap |
| 6 | **No public status page** | `app/status/page.tsx` — live `/api/health` poll (30s), per-service rows, auto-refresh | builds; in footer + sitemap |
| 7 | **Footer missing legal/trust nav** | `FooterV3.tsx` — new **Legal** column (Security, Status, Privacy, Terms, DPA, Acceptable Use); grid → 5 cols | shared across all public pages |
| 8 | **New pages undiscoverable** | `sitemap.ts` — added `/security`, `/status`, `/dpa`, `/acceptable-use` | sitemap build |

All eight propagate site-wide because the footer is shared.

---

## 3. Competitive position (why we win)

**The moat, in one sentence:** every cloud AI-DLP tool (Nightfall, Strac, Microsoft Purview)
sends your CUI to *their* servers to scan it — that transfer is itself a potential CUI spill under
DFARS 7012. HoundShield scans **locally**; nothing leaves the network. A cloud-native competitor
cannot copy this without rebuilding their entire architecture.

| | HoundShield | Cloud AI-DLP (Nightfall/Strac/Purview) | Vanta |
|---|---|---|---|
| Category | Runtime AI prompt firewall | Cloud DLP | Compliance automation |
| Data boundary | **Local-only / air-gappable** | Cloud SaaS (CUI leaves network) | Cloud SaaS |
| CMMC L2 / CUI wedge | **Primary** | Secondary | Not the focus |
| Relationship | — | **Direct, and structurally disadvantaged on DFARS** | **Complementary** — Vanta proves you *have* controls; HoundShield *is* the control |

Now reinforced on-page: the new `/security` page leads with this exact pitch, and the DPA makes
the local-only boundary a contractual fact, not just marketing.

---

## 4. What still needs the founder (cannot be coded around)

These are **config/secrets/DNS** — by policy I never commit keys, and I don't `vercel --prod`
without explicit go-ahead.

1. **`OPENROUTER_API_KEY`** in Vercel → Brain AI live (currently keyless FAQ fallback works).
2. **Supabase env vars** (`NEXT_PUBLIC_SUPABASE_URL`, `_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) → kills `demo_mode`.
3. **Supabase Auth → Redirect URLs**: add `https://houndshield.com` + `/**` (fixes signup "Failed to fetch").
4. **`STRIPE_WEBHOOK_SECRET`** in Vercel + webhook URL → `https://houndshield.com/api/stripe/webhook`; run one E2E `invoice.paid` test.
5. **DNS: SPF / DKIM / DMARC** for `houndshield.com` → email deliverability (Resend).
6. **Email aliases**: `security@`, `legal@`, `abuse@`, `support@` — the new pages reference these; confirm they route.
7. **Push migrations**: `npx supabase db push` for any pending migrations.
8. **Uptime monitor** pointed at `/api/health` (the `/status` page already surfaces it publicly).

---

## 5. Recommended next sprint (post-keys)

1. **Set keys → merge this PR → redeploy** → run the demo runbook (CUI paste → block → PDF).
2. PostHog **funnel events** (signup → activation → upgrade) — pageviews exist; conversion events don't.
3. In-app **subscription cancel** button (webhook already handles `subscription.deleted`).
4. **SEO/backlink sprint** — answer-gap map → publish `/answers/*` → earn G2/Reddit/CMMC-blog mentions.
5. **C3PAO outreach** (Sprint 2 prime objective) — the trust pages (DPA, Security) are now procurement-ready ammunition.
