# Hound Shield — Task Queue

## Active

### 2026-07-18 — Design Studio: live multi-design carousel + customizable console, free for everyone (this PR)
- [x] **Founder-directed follow-up to Aurora.** Pointed at the ghost cards behind the hero window and asked for a live "slider" that cycles the dashboard through several designs (light → dark → light, charts still moving), the SAME flexibility after login, and — explicitly — for it to be **free for everyone, not gated by the subscription**. Grounded the sections in real compliance-dashboard patterns via TinyFish (Vanta: framework-progress, continuous-monitoring, alerts, roadmap) so nothing is a gimmick.
- [x] **One extensible registry, both surfaces** (`lib/dashboard/design-themes.ts`): 6 designs (Aurora default · Midnight dark · Editorial · Sunset · Ocean · Forest), each with explicit CSS-var maps for the hero (`--a-*`) AND the console (`--bg/--panel/…`) + a `viz` block for the JS-painted canvas/donut. Adding one later = a single array entry → appears in the hero carousel and the console picker automatically. Aurora == the exact launch skin, so the default render is unchanged.
- [x] **Hero = live carousel** (`HeroDemoDashboard.tsx`): auto-advances every 4.6s, pauses on cursor-dwell, OFF under reduced-motion; ‹ › nav + dot rail; SVG marks retint via `var(--a-*)`; one-shot swap animation. Browser-verified Aurora → Midnight (full dark, charts/donut/bars recolored).
- [x] **Console = themeable + customizable, ungated** (`LiveCommandCenter.tsx` + `lccStyles.ts` + `use-dashboard-prefs.ts`): Appearance menu over the whole registry (retints the shell AND repaints canvas/donut/legend via `themeRef`); top bar/spine/brain-card var-ized so dark mode is genuinely correct; Customize mode reorders/hides the 7 Overview sections via CSS `order`+visibility (source JSX order untouched → all structure contracts still pass). Both prefs persist to localStorage with NO entitlement check. Browser-verified: 6 themes, real dark mode, reorder + hide, persisted across reload, 0 console errors.
- [x] **PDF export verified** (the "make sure the download buttons work, I want to test it" ask): Reports SSP/POA&M/Evidence + the public `/demo` snapshot all emit real jsPDF bytes → blob → download. Proven by unit tests (`%PDF-`, ≥4KB, ≥2 pages), the wiring component test, AND a live browser capture of the `/demo` snapshot download (valid 61 KB PDF). Console Reports stay Growth+/founder-gated by design; `/demo` is the no-account test path.
- [x] Guards +24 (**1347** total): design-themes registry contract, use-dashboard-prefs hook suite, design-studio wiring contract; aurora contract updated (donut now theme-driven, default still the pastel set). tsc + `next lint` + build all green. Doc: `docs/DASHBOARD-DESIGN-STUDIO.md`.
- [ ] ⚠️ **Honest gate (unchanged):** this is UX/personalization polish on the demo + console — it does not move revenue by itself, though a flexible, credible dashboard helps demos/close. The Guide/Plan/Assessment tabs (Tailwind `.cc-light` panels) stay light under a dark theme — a scoped cosmetic follow-up. `/api/health` money-path blockers are unchanged (Stripe key + webhook secret).

### 2026-07-18 — Aurora redesign: hero window + after-login console share one soft, clean skin (this PR)
- [x] **Founder-directed visual redesign** — pointed at a reference dashboard he loved (soft slate-blue→pale-sage gradient, glass panels, pastel lime/peach/periwinkle accents) and asked for BOTH the marketing hero window AND the `/console` after-login dashboard to wear it, so "before signup" and "after login" read as one product.
- [x] **One source of truth:** the Aurora token set (`--hs-aurora-bg`, glass, pastel accents, `--hs-action` CTA blue, `--hs-delta` green) lives ONCE in `app/globals.css :root`; the hero (`hermes.css`) and console (`lccStyles.ts`) both reference it → the two surfaces can't drift.
- [x] **Hero window rebuilt** (`HeroDemoDashboard.tsx`): retired the dark demo palette for the light Aurora window — glass ghost cards behind a floating light product window, blue brand badge, "Live AI Monitor" + blue "New scan", 4 KPI tiles with circular pastel icon badges + green deltas, pastel line/donut/bars/gauge/feed. Still a pure timer-driven demo, badged "Live demo".
- [x] **Console reskinned** (`lccStyles.ts` + `LiveCommandCenter.tsx`): shell on the same fixed gradient, glass sidebar, panels/KPIs/cards on the softer shared shadow, detection donut on the same pastel sweep as the hero, engine bars periwinkle→lime, SPRS ring lime.
- [x] **Accessibility line held:** the console's functional `OverviewCharts` bar/area marks keep their dataviz-validated categorical palette (pure pastels would drop non-text contrast below WCAG 3:1 on the real dashboard). Cohesion carried by the stage/glass/cards/donut/ring, not by making working marks low-contrast.
- [x] Guardrail: `aurora-redesign-contract.test.ts` (+10) pins tokens-once, hero-on-gradient, hero-window-not-dark, console-shares-gradient+pastel. All prior contract-locked structure preserved (spine, KPI provenance dialogs, CUI warning, captions, logo-hover tilt). tsc + lint + **1323 tests** + build green. Both surfaces browser-screenshotted and confirmed against the reference. Doc: `docs/DASHBOARD-REDESIGN-AURORA.md`.
- [ ] ⚠️ **Honest gate (unchanged):** this is a visual redesign — it does not move revenue by itself, though a soothing, credible dashboard helps demos/close. `/api/health` still reads `payments: malformed_key` + `payments_webhook: missing_secret`; the #1 blocker remains the founder re-pasting the real `sk_live_` secret key + webhook secret (`docs/GO-LIVE-STRIPE.md`).

### 2026-07-18 — Instant AI Risk Snapshot: self-serve /demo climax → warm counts-only lead (this PR)
- [x] **The demo finally ends on the PDF for every visitor.** New `/demo#snapshot` (`components/InstantSnapshot.tsx`): paste a prompt → HoundShield's **real** local engines (`BUILTIN + CMMC + HIPAA` regex patterns) scan it **in the browser** → on-screen severity + NIST 800-171 controls + estimated SPRS → **generate a branded preview gap-report PDF** → `$499` CTA + opt-in "email me + a human review". The pasted text never leaves the device — a live demonstration of the local-only moat, not just a claim.
- [x] **Privacy boundary, two enforced layers:** (1) findings on screen + in the PDF carry the pattern NAME + classification only, never the matched substring (`blockEventFromFinding` copies name/category/risk/action and nothing else) — browser-verified no raw SSN/AKIA/CAGE leaks; (2) `POST /api/report/snapshot-lead` takes **COUNTS ONLY** via a `.strict()` zod schema with no field for prompt text (smuggling attempt = 400). Cloud scanners (`risk-engine`/`gemini-scanner`) are never imported into the client path.
- [x] **Honesty per #205 doctrine:** `ReportData.snapshot:true` makes `buildComplianceDoc()` strip every claim a preview can't back — Merkle/SHA-256 audit chain → "no cryptographic audit chain", red **PREVIEW SNAPSHOT** band, SPRS score → "estimated exposure", "never transmitted to any server" attestation, "not tamper-evident" footer. On-screen copy: *"a preview, not the tamper-evident 14-day signed report an assessor accepts."* The signed sample report keeps full attestation.
- [x] Perf: `jsPDF` (~130 kB) lazy-loaded via dynamic `import()` only on generate → `/demo` First Load `190 kB` (was `332 kB`). Scan timed with `performance.now()`, surfaced as "Local scan Xms" (~8 ms live — proves <10 ms). Funnel loop: `/assessment` hero now cross-links "Prove it on your own prompt → free instant snapshot"; `docs/OUTREACH-PACK.md` send-process includes the self-serve link.
- [x] Tests +44 (**1313** total): category-nist-map, snapshot-from-scan, pdf-generator (signed-only vs snapshot-only claim sets), InstantSnapshot component (local-only copy, no raw substrings, generate→downloader `snapshot:true`, lead counts-only), snapshot-lead route (strict schema, 503+fallback, counts-only emails, `FOUNDER_EMAIL` routing). tsc + `next lint` + build green; structure guard PASS. Browser-verified live end-to-end (scan → findings → PDF on-device → CTA → lead form), 0 console errors. Doc: `docs/INSTANT-SNAPSHOT.md`.
- [ ] ⚠️ **Honest gate (unchanged):** this is top-of-funnel selling, not a taken payment. `/api/health` still reads `payments: malformed_key` + `payments_webhook: missing_secret`; the company has never taken a payment. The #1 blocker remains the founder re-pasting the real `sk_live_` secret key + setting the webhook secret (`docs/GO-LIVE-STRIPE.md`). The snapshot generates warm leads — closing them still needs working checkout or a manual invoice.

### 2026-07-17e — FAQ system leveled up: deep-linkable answers + a searchable /faq hub (this PR)
- [x] **Design research** (TinyFish web search + Stripe MCP): 2026 best-in-class FAQ patterns = deep-linkable/shareable answers, categorized search hub, actionable "learn more" links, accordion + "still need help". Verified the $499 report is live in Stripe (`price_1Tge3aQK7cyCnCHkfIfVDAGt` = `unit_amount 49900`) so pricing copy stays accurate.
- [x] `FaqAccordion` redesign (backward-compatible): every answer is deep-linkable (`/pricing#faq-<slug>` via `faqSlug()`), opens + scrolls on hash load/change, carries a one-click **Copy link** (share the exact answer), renders optional actionable `links[]` chips, `motion-reduce` transitions, a11y preserved. Scoped scroll to the component `ref` + retry — robust to React's hidden streaming buffer (`<div id="S:…">`) which duplicates ids on server-streamed pages.
- [x] New **`/faq` consolidated hub** (`app/faq/page.tsx` + `components/seo/FaqHub.tsx`): search across all 38 answers, sticky category jump-nav, deep links, empty state, the $499 `ReportOfferCard` band. **Emits NO FAQPage JSON-LD** — each Q&A already carries it on its origin page; a second copy = cross-URL duplication (advisor catch, guard-locked).
- [x] `FaqItem` gained optional `links[]`/hub `faqGroups`; sharpened 9 high-intent answers with internal cross-links (no new questions, no reworded prose — AEO word-band + cross-set uniqueness preserved). Wired `/faq` into nav (Docs dropdown), footer (Company), sitemap.
- [x] Tests +42 (1269 total): `faq-hub-contract` (coverage, unique slugs, **no FAQPage schema on /faq**), `FaqHub` component (search/empty/clear/open-reset/chips), `faqs` (links internal + no self-link, `faqSlug` unique/url-safe), extended site-chrome footer set. tsc + `next lint` + build green; `/faq` prerenders static. Browser-verified on `next start` (desktop+mobile): hub, search filter, deep-link open, chips, copy-link, 0 console errors. Doc: `docs/FAQ-SYSTEM.md`.
- [ ] ⚠️ **Honest gate (unchanged):** this is AEO/UX polish on an existing surface — it does **not** move revenue. `/api/health` still reads `payments: malformed_key` + `payments_webhook: missing_secret`; the company has never taken a payment. The #1 blocker remains the founder re-pasting the real `sk_live_` secret key + setting the webhook secret (`docs/GO-LIVE-STRIPE.md`).

### 2026-07-17d — Checkout can no longer be taken down by a bad key paste: payment-link fallback rail (this PR)
- [x] Ground truth re-checked at the source: the "expired" backup payment link (07-12 note) is **active again** — live API read shows `plink_1Tge3jQK7cyCnCHkqWpUnmze` active, selling `price_1Tge3aQK7cyCnCHkfIfVDAGt` ($499 one-time). Also confirmed: with the current `pk_` paste in `STRIPE_SECRET_KEY`, buyers were getting a raw **500** ("Failed to create checkout session") — not even the 503→/contact deflection, because the sanitized key is truthy and the Stripe call just dies.
- [x] `/api/stripe/report-checkout` now fails **toward the sale**: missing key, unusable paste (`pk_`/`whsec_` — skips the doomed API call), or a failing Stripe call all return the Stripe-hosted Payment Link for retail buyers (200 + `rail: 'payment_link'`), which no Vercel env var can take down. Verified wholesale ($299) is never downgraded to the $499 link — stays an honest 503/500. Button code unchanged (it already redirects to whatever `url` returns); /contact remains the final net.
- [x] Vertical attribution survives the static link: fallback URLs carry `?client_reference_id=report-<vertical>`; the webhook now recovers the vertical from `client_reference_id` when metadata is absent (payment-link sales carry none). Single-sourced `REPORT_VERTICALS` in `lib/stripe/report-payment-link.ts` (route + webhook both import it). `STRIPE_REPORT_PAYMENT_LINK` env override for link rotation — validated shape, degrades to the known-good link, never a broken redirect.
- [x] Tests: +14 (module round-trip/override-rejection suite, route fallback contract incl. both no-downgrade guards, webhook payment-link-sale attribution). Docs: GO-LIVE-STRIPE.md + OUTREACH-PACK.md now carry the direct buy URL sellers can email.
- [ ] 🔴 **FOUNDER — unchanged, still required:** Step 1 (re-paste the real `sk_live_` key — restores promo codes, thank-you flow, wholesale) and Step 2 (webhook secret — **until it lands, sales on EITHER rail are charged but never recorded and no sale alert is sent**; watch the Stripe dashboard for payments meanwhile). `docs/GO-LIVE-STRIPE.md` top to bottom.
- [ ] **FOUNDER:** the outreach emails can now include a working buy link even while the site key is broken — send the 10 healthcare emails (`docs/OUTREACH-PACK.md`).

### 2026-07-17b — Money-path ground truth from the live APIs + paste-proof key diagnostics (this PR)
- [x] **Ground truth, checked at the source (Stripe/Vercel/Supabase MCP access is now available in remote sessions):** the Stripe account (Houndshield.com, live mode) has **ZERO charges ever** — no customer has ever managed to pay. The $499 report price IS live and active (`price_1Tge3aQK7cyCnCHkfIfVDAGt` on `prod_Ug034JhG2q2AA7`). `report_orders` in prod Supabase: 0 rows. Vercel prod deploy pipeline healthy (latest deployment READY, 2026-07-17). Live health: `payments: malformed_key` (107-char `pk_` value) + `payments_webhook: missing_secret` — the two env vars are the entire gap between the company and revenue.
- [x] Health diagnostics now name the EXACT paste mistake instead of a generic shape error: `pk_` in `STRIPE_SECRET_KEY` → "this is your PUBLISHABLE key; the Secret key is behind the Reveal button"; `whsec_` in the key slot → swap callout; `sk_test_` → connected-but-LOUD "real cards will be declined" warning; API key pasted into `STRIPE_WEBHOOK_SECRET` → named as the wrong kind of secret. All value-free (prefix/length only), each branch unit-tested including no-leak assertions.
- [x] Deleted dead `app/api/stripe/prices/route.ts` (zero consumers, 8 hardcoded test-mode price IDs that fail live lookup — the 07-14e tech-debt item).
- [x] `docs/GO-LIVE-STRIPE.md` re-led with the 2026-07-17 reality (regression + pk-vs-sk Reveal walkthrough + "check the first 8 characters before saving"); stale "STEP 1 IS DONE" banner replaced.
- [x] Outreach pack REBUILT into the repo as `docs/OUTREACH-PACK.md` (the 07-12c original lived in a session scratchpad and was lost; the runbook pointed at the dead path). Direct cold emails for Rachel/Marcus/Jordan + follow-up/breakup + subject bank + $499 blurb + send process, doctrine-clean.
- [ ] 🔴 **FOUNDER — the same 5-minute fix, now with the exact key named:** Stripe → Developers → API keys → **Secret key → Reveal** → copy → Vercel `compliance-firewall-agent` → `STRIPE_SECRET_KEY` (Production ticked) — **verify it starts `sk_live_` before saving** → redeploy → health reads `payments: connected`. Then Step 2: webhook endpoint + `STRIPE_WEBHOOK_SECRET` (GO-LIVE-STRIPE.md). Zero charges ever on the account — every day this stays broken is a day the company cannot take money.
- [ ] **FOUNDER:** send 10 healthcare emails from `docs/OUTREACH-PACK.md` (the process section takes ~45 min). A yes closes via manual invoice even while Stripe is down.

### 2026-07-17c — PR #207 closed as superseded; its one good idea salvaged (this PR)
- [x] Founder asked "what's wrong with #207?" — answer: nothing in content, it was the LOSING twin of two competing repairs of the 07-16 dependabot breakage (#209 merged first; every fix in #207 verified already on main), left open and now conflicting (`dirty`; merging would have REVERTED main's Stripe apiVersion to the older clover release). Closed with an explanatory comment.
- [x] Salvaged its one net-new idea: `lib/stripe/api-version.ts` — the ONE place the Stripe API version is pinned; all 5 `new Stripe(` sites now import `STRIPE_API_VERSION` instead of hardcoding `'2026-06-24.dahlia'` five times. Next stripe SDK major fails tsc in exactly one file.
- [x] Contract test (`api-version-contract.test.ts`): version-shape check + no quoted `apiVersion:` outside the canonical file + every `new Stripe(` site references the constant (≥5 sites sanity floor). Negative-tested: injected a hardcoded pin → guard failed → reverted.

### 2026-07-17 — Console data provenance: click any number → see where it comes from (MERGED #208, live in prod)
- [x] Founder: "when we click on anything it should show the data where it is fetching from, not just numbers." Shipped: every figure on /console is now clickable and opens a provenance dialog — What this is · Where it comes from (named demo seed / this device's localStorage / subscription entitlements / product fact) · How it updates · How it becomes your data (with an Open Settings · Proxy URL CTA while simulated).
- [x] Surfaces wired (19 registry entries): 4 KPI tiles (now real buttons with ⓘ), hero capability chips, status strip, evidence-chain spine ("Simulated preview" pill now opens the audit-chain provenance instead of silently jumping tabs), throughput, donut, engine bars, threat feed (header chip + any row via delegated listener), SPRS ring, all 4 overview charts, assessment snapshot + board header, Settings usage meters, Brain budget.
- [x] Honesty mechanics: `resolveProvenance(id, live)` — signed-in viewers get the account/on-device variants ("nothing is simulated for your account"); simulated entries MUST name a go-live path (unit-enforced); `SourceChip` without a handler degrades to a plain span (never a dead button).
- [x] A11y: dialog is role=dialog + aria-modal + labelled, Escape/backdrop/button close, focus moved in and restored; chips carry aria-haspopup.
- [x] Guards: +40 tests (1227 total) — registry contract (no dead dialogs, no orphan entries, no cloud-scanning copy), dialog suite, click-flow integration tests, and a "data provenance" block in console-dashboard-contract. Browser-verified on `next start`: KPI dialog, spine dialog, Escape, Settings CTA, meter chip — 0 console errors. Doc: docs/DASHBOARD-DATA-PROVENANCE.md.

### 2026-07-16 — Console made honest for real customers + a11y overhaul (PR pending)
- [ ] 🔴 **FOUNDER — payments REGRESSED `connected` → `malformed_key`.** `/api/health` now reads: key is set (107 chars) but doesn't start with `sk_` — that's the **publishable `pk_live_` key pasted into `STRIPE_SECRET_KEY`** (both are ~107 chars). Re-paste the SECRET key (Stripe → Developers → API keys → "Secret key") into Vercel Production scope → redeploy → health must read `payments: connected` again. `payments_webhook: missing_secret` also still open (GO-LIVE-STRIPE.md Step 2). Checkout was LIVE on 07-14; it is dead again until this is fixed.
- [x] Multi-agent audit of /console (a11y + data-honesty finders; 4 finders + all verifies lost to session limit — findings verified by hand instead). 17 findings confirmed, all fixed:
- [x] **Data honesty (the big one):** Brain AI answered signed-in customers with the sample org's fabricated numbers ("your SPRS is +78", "you closed 3.5.10 this week", and an invented "No spill occurred; no reportable event" incident determination) while the guide tab showed their real localStorage score. Now: `BrainContext.own` — signed-in asks compute from the operator's real assessment (lazy import, recomputed per ask); not-assessed gets an honest nudge; incident answers NEVER emit a spill determination on any path; demo answers are source-tagged `· sample data`.
- [x] Simulated-telemetry labeling: persistent "Simulated preview" pill in the evidence spine (opens Settings), "demo/sample" wording on every live-tag, feed, donut, engines, KPI deltas; OverviewCharts de-possessived + sample-tagged. Replaces the untrue "on your hardware" spine claim.
- [x] Fake-success chrome KILLED structurally: Settings "Reveal→Revealed"/"Edit→Saved" stubs + fabricated `hs_live_…`/`sk-or-…` masked keys replaced with honest not-provisioned/keyless rows; CopyRow is now Copy-only. Usage meters: real customers see 0 scans / 1 seat (never the fabricated 57%-used seeds — those are demo-only); first-run checklist no longer pre-checks steps 1-2 for real accounts.
- [x] Assessment tab: hardcoded "+78 ring / AI-ranked wins" replaced by `AssessSnapshot` — computes ring + impact-ranked fastest wins from the operator's own answers, live-updates via new `hs-assessment-updated` event dispatched by the storage layer; sample-labeled on the public demo.
- [x] Counter drift fixed at the source: KPI seeds now import `SCANS_24H`/`BLOCKED_TODAY` from OverviewCharts (SSR text == effect seeds == chart sums); quarantine seed unified (was: markup 15, counter 6 → snapped 15→7 on first event).
- [x] **Sign-out existed NOWHERE in the console** — new provider-agnostic `SignOutButton` (Better Auth flag or Supabase; honest failed-retry state, no redirect on failure) in the sidebar for signed-in operators.
- [x] A11y: aria-current on tabs; Brain input labeled + transcript is a polite live-region (typing bubble aria-hidden); closed mobile drawer leaves tab order (visibility transition — transform alone left ~11 invisible focusable controls); scrim out of tab order; burger aria-expanded; canvas chart alt; ticking clock/p50/spine decor aria-hidden; reduced-motion now silences KPI bump/feed flash/pulse dots; PDF success announced (role=status). Contrast: new `--ok/bad/warn/orange-text` AA tokens on all small status text — worst offender was the MANDATED "Do not enter CUI" warning at ~2.5:1.
- [x] Guards: +32 tests (1187 total) — honesty contracts (no spill determination, sample tags, seed single-source, no fake-success chrome, sign-out present) + a11y contracts in console-dashboard-contract; SignOutButton + AssessSnapshot suites.
- [x] Supabase MCP added to .mcp.json (project scope) + agent skills installed. **FOUNDER:** run `claude` → `/mcp` → authenticate supabase (OAuth needs an interactive terminal).

### 2026-07-15c — Mono → Geist Mono, third-party font CDN eliminated (same PR #204)
- [x] "Evolve further": found the mono face was loaded via a runtime `@import` from the Google Fonts CDN — every visitor's browser called Google (IP leak; the basis of real GDPR rulings) on a site whose footer promises zero data exfiltration, AND Tailwind's `font-mono` never referenced it, so the site rendered two different monos. Now: **Geist Mono** self-hosted via next/font (`--font-mono` on the root html), all five stack definitions unified (globals, hermes, tailwind, lccStyles, HeroDemoDashboard — the last still had a stray serif fallback), CDN `@import` + preconnects deleted.
- [x] Guard extended (font-brand-contract): fonts.ts must load Geist_Mono; six stack files may not reference old families, serif fallbacks, or ANY font CDN (googleapis/gstatic/typekit/bunny). Browser-verified: computed mono = "Geist Mono", external font requests across /, /pricing, /console = **zero**.

### 2026-07-15b — Brand typeface → Geist everywhere (founder call, same PR #204)
- [x] Founder shared a base44.app ad ("I love this font, use it everywhere"). The ad face is a commercial-class neo-grotesque; closest open-licensed (OFL) production match is **Geist**, self-hosted at build time via next/font (zero external font requests, GDPR-clean). Swapped in ONE place — `app/fonts.ts` now loads Geist into both `--font-display` and `--font-body` — so hermes pages, v3 pages, dashboard, and command center all switch together (no split-brain). Fallback stacks de-serifed in globals.css, hermes.css, tailwind.config.js (font-editorial), lccStyles.ts.
- [x] Guard: `app/__tests__/font-brand-contract.test.ts` — fonts.ts must load Geist for both roles; the four stack-definition files may not reference the old families or any serif fallback. It caught a stale comment on first run. `public/hermes-demo.html` + `_bootstrap.html` are byte-equality archives and stay untouched by design.

### 2026-07-15 — FAQ system rebuilt sitewide + $499 offer card (PR pending)
- [x] Founder: "improve the FAQ section of every page… and the $499 thing, make it a proper button." Rebuilt the shared `FaqAccordion` (card-per-question, readable type — questions were 14px, now 16–17px; answers 15px/1.7 — steel open-state, a11y ring, aria-controls) and `FaqSection` (eyebrow + display heading + "Still have questions?" contact row + coupled FAQPage JSON-LD). All 5 hand-rolled FAQ implementations (contact, answers/[slug], partners/kit, products/[industry], pricing/features inline blocks) replaced with the one shared system.
- [x] FAQs ADDED where missing: homepage (new `homeFaqs`), /how-it-works (orphaned `howItWorksFaqs` finally rendered), /assessment (new `reportFaqs`). Contact FAQ content moved to `contactFaqs` with two factual fixes (free tier = 110 controls read-only + 1,000 prompts/mo, not "25 controls"; PDF exports = Growth+, not "PDF and CSV on all plans").
- [x] pricingFaqs rewritten: now leads with the $499 one-time report, kills the "$499 report vs $499/mo Growth" collision with an explicit Q&A, and removes the banned "Federal at $2,499/month" tier claim (NEVER-DO).
- [x] $499 CTA: new `ReportOfferCard` (pitch + included checklist + trust row | big $499 panel + full-width buy button + "talk to us first" + sample-report link) — now the hero of /pricing AND a band on the homepage before the CTA band. `.section.alt` (used but never defined) now styles a real alternate band.
- [x] Guards: `app/__tests__/faq-surface-contract.test.ts` (FAQPage JSON-LD ⇒ visible FAQ UI; core pages must carry a FAQ; home+pricing must carry the offer card) + new datasets added to the AEO faqs test (uniqueness/snippet-length enforced). 1151/1151 tests, tsc, lint, build green; 20 prod-server screenshots (10 pages × desktop+mobile), 0 console errors.
- [x] Checkout note (corrected in the #204 merge): `payments: connected` went LIVE in #187/#202 (see 2026-07-14e below) — the new $499 buy buttons open real Stripe Checkout, not the /contact deflection. The remaining founder action is the webhook secret, tracked below.

### 2026-07-14e — STRIPE IS LIVE: paste-proof key handling + first live checkout verified (MERGED #187 + #202, live in prod)
- [x] Founder: "every paste comes out empty — fix it or recreate the placeholder." Shipped `lib/stripe/env.ts` (auto-cleans quotes/newlines/zero-width chars/whole-line `NAME=value` pastes; ALL six Stripe routes now read through it) + `/api/health` diagnostics: `payments: connected|malformed_key|missing_key` and now `payments_webhook: configured|malformed_secret|missing_secret`, each with a value-free `*_hint` naming the exact fix. Leak-proof by tested contract.
- [x] **`payments: connected` on prod — the 2-week #1 blocker is CLEARED.** Verified beyond the health check: drove the real buyer flow in a browser → `/pricing` → $499 CTA → **live Stripe Checkout (`cs_live_…`) showing "CMMC AI Risk Assessment Report — $499.00"**. A customer can pay today.
- [ ] **FOUNDER — new #1 (5 min): the webhook.** Prod reads `payments_webhook: missing_secret` → a card can be CHARGED but the order is never recorded and no sale alert is sent. Do `docs/GO-LIVE-STRIPE.md` Step 2: Stripe → Developers → Webhooks → endpoint `https://houndshield.com/api/stripe/webhook` → copy `whsec_…` → Vercel (project compliance-firewall-agent, Production ticked) as `STRIPE_WEBHOOK_SECRET` → redeploy → health shows `payments_webhook: configured`. Then the Step 4 test-card dry run.
- [x] Tech-debt CLOSED 2026-07-17b: dead `app/api/stripe/prices/route.ts` deleted (zero in-app consumers, 8 hardcoded price IDs failing live-mode lookup).

### 2026-07-14d — Deep-dive audit of the session's work (PR pending)
- [x] Reviewed the cumulative #183–#185 diff + click-drove every flow. Found & fixed: Settings "Copy" button was ANOTHER fake-success stub (now really writes the clipboard, only confirms on success — regression-tested); hour-axis labels clipped at the chart edges (inward anchors); duplicate React keys possible on rapid re-exports (monotonic id). Browser-verified: guide→"Begin assessment" opens the inline board in place with the hash cleared; clipboard actually contains the proxy URL.
- [x] Data polish (no deploy): founder profiles get company='HoundShield' → PDFs now read SSP_HoundShield_… and the sidebar shows the org, not the first name.

### 2026-07-14c — Dashboards made diverse + self-explanatory (MERGED #185, live in prod)
- [x] Founder: "more graphs, more colours, small explanations, consistent data — console AND the hero-page dashboard." Console Overview gains 4 dataviz-validated panels (`OverviewCharts`): Activity by hour (stacked, blocked share), Where prompts go (ChatGPT/Copilot/Claude/Other), SPRS 30-day trend vs the L2 target line, Risk mix (severity stack with counts). Every panel carries plain-English microcopy + accessible labels. Homepage hero gains a "Where prompts go" panel + captions on every chart.
- [x] Consistency is now a TEST: chart sums must equal the KPI seeds (142,690 scans / 2,233 blocked) or the build fails — the contract caught its first mismatch immediately.

### 2026-07-14b — Report PDFs made REAL + founder account live (MERGED #184, live in prod)
- [x] Founder: "generate PDF was not working." Root cause: the console Reports tab's three buttons were stubs (label flip, no file — the fake-success anti-pattern again). Built `lib/reports/artifact-pdfs.ts` (SSP / POA&M / C3PAO Evidence Pack — three DISTINCT jsPDF artifacts from the user's own local assessment) + `ReportsPanel` (real download, true SHA-256 in Recent exports, visible errors, honest empty state). Growth+ gated with the priced restriction routing to Plan & Unlocks; **founder always free**.
- [x] Founder account made real: created `gaurav@houndshield.com` in prod Supabase auth (pre-confirmed) + agency profile/subscription grants for it, `gauravbt10@gmail.com`, `info@houndshield.com` (demo account left Free). Browser-verified live sign-in → "Founder · full access", nothing locked.
- [ ] **FOUNDER:** change the temp password after first sign-in (chat-transmitted); create the `gaurav@houndshield.com` mailbox in Hostinger so password reset emails can ever work.

### 2026-07-14 — Console redesign: dashboard-first + founder full access (PR pending)
- [x] Founder feedback on the 07-13 console: the "buy this / do this" stack above the dashboard is gone. `/console` = the Live Command Center alone; the guide (CustomerStatusPanel) and the paywall (PlanUnlocksBoard, ex-ConsoleDashboard) moved into SIDEBAR buttons ("Your Guide", "Plan & Unlocks"). Locked tiles now price the restriction ("Available on Growth — $499/mo"). Assessment = mid-list tab, runs INLINE (lazy board, `#assessment` hash opens it); the bounce link to /command-center/shield/assessment removed.
- [x] Founder access: `gaurav@houndshield.com` (lib/billing/founder-access.ts, env-extendable) → top-tier entitlements with NO payment across ALL gates: console viewer, /api/me, /api/customer/status, getUserSubscription (PDF 402 + gateway). Session-email keyed, fail-closed, unit-tested.
- [x] Fixed 2 latent rendering bugs the browser pass caught: `.hs-lcc *` reset was nuking Tailwind spacing inside embedded panels (now zero-specificity `:where()`); cc-light lacked text-white/45/55/65 remaps (white-on-white text). Screenshot-verified desktop+mobile, 0 console errors. 1087/1087 tests, build+lint+tsc green.
- [ ] **FOUNDER:** after merge, sign in on houndshield.com with `gaurav@houndshield.com` and verify: sidebar shows "Founder · full access", Plan & Unlocks all unlocked, PDF export works without paying. (The account must EXIST via sign-up first — founder access keys on the login email.)
- [ ] **FOUNDER — still the #1 revenue blocker (unchanged):** `STRIPE_SECRET_KEY` Production scope in Vercel → `/api/health` must read `payments: connected`.

### 2026-07-13 — Tier-gated after-login console + inline assessment (PR pending)
- [x] Founder asked (looking at live site): don't bounce "Begin assessment" to a deep link — put it on the same after-login dashboard; and build a restricted dashboard for free users / everything for paid, per the plan. Ran the HERMES CHALLENGE first (this is Stage-2 subscription plumbing, gates tiers nobody can buy while `payments:missing_key`, on a console ~nobody reaches). Founder: **"you decide" + boil-the-ocean** → informed override. Chose the on-plan version: build it, but every upgrade CTA funnels to `/pricing` (which leads with the live $499 report).
- [x] Reused the existing single source of truth `lib/billing/entitlements.ts` — did NOT build a new entitlements model. New pure projection `lib/billing/console-sections.ts` → `buildConsoleSections(tier)` = `{isPaid, unlocked[], locked[]}`; locked tiles carry a truthful "Available on <tier>" (via `tierThatUnlocks`) + Upgrade→/pricing.
- [x] Extracted the 110-control board into `components/dashboard/AssessmentBoard.tsx` (one source; `embedded` prop). Route `shield/assessment/page.tsx` is now a thin wrapper. Console mounts it INLINE (lazy `next/dynamic`, opens on `#assessment`) — themed correctly because it renders inside the same `.cc-light` scope the command-center already uses. Core assessment logic untouched (advisor's blast-radius warning).
- [x] `CustomerStatusPanel` "Begin/Continue assessment" CTA now targets `#assessment` (opens the inline board) instead of the standalone route — fixes the exact bounce the founder pointed at. `lib/customer/status.ts` left canonical.
- [x] Tests: `console-sections.test.ts` (11 gating-contract) + `ConsoleDashboard.test.tsx` (5 render/gating). tsc + targeted suite green. Docs: `docs/CONSOLE-TIERS.md`.
- [ ] **FOUNDER — this ships a dashboard, it connects NO revenue.** Still the only money blockers: (1) fix `STRIPE_SECRET_KEY` Production scope → `payments: connected`; (2) send the first outreach email. The console reaches ~0 users until login + payments are live.

### 2026-07-12d — Founder gets alerted when a report sells + go-live runbook (PR pending)
- [x] Traced the full $499 money path end-to-end (button → checkout → thank-you → webhook → order row → emails). All links exist EXCEPT: on a sale the webhook emailed only the **buyer**, never the founder. The report is manually fulfilled → founder needs an actionable "go deploy for X, start their 14-day assessment" alert (Stripe's default receipt only says "you got $499"). Added `reportOrderEmail.founderAlert(...)` (HTML-escaped buyer input) + wired it into `handleReportOrder` (best-effort, never blocks billing) → `FOUNDER_EMAIL || contact@houndshield.com`. Retail/$499 vs wholesale/$299 aware.
- [x] Tests: 8 template unit tests + 3 webhook integration tests (buyer+founder both emailed, FOUNDER_EMAIL fallback, email-throw never fails the webhook). `vi.hoisted` resend mock. Local suite green.
- [x] Wrote `docs/GO-LIVE-STRIPE.md` — founder runbook to actually take money. Leads with the REAL blocker: `payments:missing_key` persisted AFTER a redeploy, so it's not a missing redeploy — it's Production-scope / name-typo / stray-quotes on `STRIPE_SECRET_KEY`. Then webhook registration, FOUNDER_EMAIL, test-card dry run, manual-invoice fallback.
- [ ] **FOUNDER:** work `docs/GO-LIVE-STRIPE.md` Step 1 first (fix the env-var scope) → `/api/health` must read `payments: connected`. Merging PRs alone will NOT fix Stripe.

### 2026-07-12c — Outreach pack produced (removes "I don't know how to sell")
- [x] Wrote ready-to-send outreach: 4 cold emails (healthcare/legal/defense direct + RPO co-sell), follow-up, subject bank, $499 offer blurb, and a step-by-step "how to send" (find contacts → 10/day → book call → invoice manually while Stripe is off). Saved: scratchpad/outreach-pack.md.
- [ ] FOUNDER: pick Healthcare or Legal (fastest, no FedRAMP blocker), send 10 today. First "yes" → manual invoice (don't wait for Stripe key).

### 2026-07-12b — Stop losing leads (houndshield session, PR pending)
- [x] Freshness re-check: CMMC Phase 2 still **Nov 10 2026** (no slip) → CONTINUE verdict holds. Idea validation NOT re-run (merged #177 12h earlier).
- [x] **Contact form was FAKE** — `handleSubmit` did `setTimeout → "Message sent"` and delivered NOTHING. Every lead (incl. $499 buyers deflected from dead Stripe checkout) was silently dropped. Fixed: real `POST /api/contact` (new route, Resend → founder inbox, mirrors `/api/partners/apply`). Honest 503 fallback (shows direct email) when Resend unset — never a fake success. Browser-verified: real POST, honest fallback shown, 0 console errors.
- [x] Removed banned false claim on /contact ("hosted on FedRAMP-authorized cloud services") — NEVER-DO violation; replaced with the honest Mode-B / non-CUI-trial wording.
- [x] /pricing: $499 one-time report is now the **hero h1** (doctrine: lead product first); subscription grid reframed "Ongoing monitoring" → kills the "$499/mo Growth vs $499 one-time" collision. Guard test (direction-a-port) green.
- [x] Guards added: `app/api/contact/__tests__/route.test.ts` + `app/contact/__tests__/contact-delivery-contract.test.ts` (fake-form + FedRAMP-claim can't silently return). Full suite 1026/1026, build+lint+tsc green.
- [ ] **FOUNDER, 5 min — STILL THE #1 BLOCKER:** set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` in Vercel, point webhook at `https://houndshield.com/api/stripe/webhook`, redeploy, verify `/api/health` shows `payments: connected`. Until then checkout 503s (but leads now survive via the fixed /contact form).

### 2026-07-12 — Idea validation + houndshield skill upgrade (this session)
- [x] 7-axis market validation (TinyFish web research + adversarial verify). VERDICT: **CONTINUE** — product is done, market real, CMMC timing intact; the gap is checkout + distribution, not product. Full writeup: `docs/VALIDATION-2026-07-12.md`
- [x] `houndshield` skill upgraded — now self-orients (reads todo/lessons/primer/health → real briefing, not placeholders), keeps all 12 personas, logs each session for continuity
- [x] Confirmed BOTH payment paths dead: `/api/health` → payments:missing_key (checkout 503) AND backup link buy.stripe.com/aFa00lgzIgJx3Aqb7qgUM00 → **EXPIRED** (2026-07-12). Company cannot take a dollar until fixed.
- [ ] **FOUNDER, 5 min — THE #1 BLOCKER:** set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` in Vercel, point webhook at `https://houndshield.com/api/stripe/webhook`, redeploy, verify `/api/health` shows `payments: connected`. (Backup Stripe payment link is expired — must create a fresh one OR set the key.)
- [x] DONE 2026-07-12b: /pricing now leads with the $499 one-time report (hero h1); "$499/mo Growth" vs "$499 one-time" collision fixed by reframing the grid as "Ongoing monitoring". Didn't wait for payments-green — clarity fix needs no live checkout, and the report CTA safely deflects to the now-working /contact form.
- [ ] FOUNDER: send the 10 RPO/MSP emails as a **referral/co-sell pilot** (not white-label — RPOs gate white-label on SOC 2 + insurance + references); land 1 design-partner testimonial (free/half-price $499 report for a case study).

### 2026-07-11 — Vertical-balance tranche
- [x] Legal cluster opened (Marcus had ZERO articles): /blog/ai-attorney-client-privilege-what-bar-opinions-mean
- [x] /answers/does-vanta-or-drata-cover-ai-usage — complementary-tool traffic capture, honest "we don't replace them" framing
- [x] Verified Stage-1 gates already live: Brain AI CUI warning (GlobalChat) + RFC 9116 security.txt (tested)

### 2026-07-10 — Evidence-moat tranche (PR #175, after competitive deep-dive)
- [x] Gaps page: "AI-relevant gaps / SPRS points at stake" banner (honest scope, uses the contract-tested relevance set)
- [x] Changelog 2.7.0 — real shipped features only (control library, partner kit, console links, latency CI gate)
- [x] docs/EMAIL-SEQUENCES.md — RPO outreach 3-touch (arms the 10 drafts) + $499 buyer onboarding day 1/3/7 (manual send until wired)
- [x] /answers/what-evidence-does-a-c3pao-accept-for-ai-usage — the pre-purchase Jordan question, four-artifact table
- [ ] **FOUNDER:** approve the weekly competitive-watch Routine + TinyFish MCP in an interactive session (both blocked on approval here)

### 2026-07-10 — Second tranche (founder said "go"; fresh branch off merged #159)
- [x] /controls — 110 programmatic NIST 800-171 pages + index, honest AI-relevance verdicts, contract-tested
- [x] Commercial answers (nightfall-alternatives · cmmc-ai-monitoring-cost) + C3PAO checklist article + /partners/kit (RPO/MSP)
- [x] CI: scanner latency bench (<10ms p99 gate; measured 0.565ms) · security-audit (report-only) · Dependabot · Lighthouse CI (informational)
- [ ] **FOUNDER, 5 min:** STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET in Vercel — still THE revenue blocker
- [ ] **FOUNDER, 5 min:** DOCKERHUB_USERNAME/TOKEN secrets + push tag `proxy-v2.0.0` → publishes houndshield/proxy:latest
- [ ] **FOUNDER:** send the 10 RPO/MSP emails (now with /partners/kit to land on); Y/N on the two frozen-content flags (llms.txt "C3PAO partner program", "Kaelus" in old post)

### 2026-07-10 — Tier-1 SEO content sprint (same branch/PR #159, additive-only per founder freeze)
- [x] 5 Tier-1 blog articles shipped (GCC High cost math · HIPAA Privacy Officer 2026 · CUI incident-response playbook · NIST 800-171 AI mapping · AI policy template)
- [x] 3 AEO answers (is-chatgpt-hipaa-compliant · can-law-firms-use-chatgpt · what-happens-if-you-paste-cui-into-chatgpt)
- [x] 2 comparisons (/compare/strac · /compare/witnessai) — pass the honest-editorial guard
- [x] llms.txt: insert-only additions (new articles + answers + compare list); blog SEO contract test added to CI
- [ ] **FOUNDER FLAG:** llms.txt still says "C3PAO partner program" (channel-identity framing — the barred kind per 2026-06-23 lesson) and the frozen blog post "how-to-protect-cui…" says "your Kaelus endpoint" (stale brand). Both left untouched per the don't-touch-existing-SEO freeze — approve fixes and they're one-line edits.

### 2026-07-10 — Unseen-issues sweep (branch claude/project-unseen-issues-206sz6)
- [x] Proxy test suite un-broken (root postcss.config.mjs leak) + proxy added to CI (it had ZERO CI coverage)
- [x] docker-publish.yml: publish steps could never run (step env invisible to its own `if:`) — fixed with `secrets` context; `houndshield/proxy:latest` can now actually publish once DOCKERHUB_* secrets are set
- [x] `npm run verify:structure` failing since PR #146 — manifest + PROJECT-STRUCTURE.md synced, added as CI Structure Guard job
- [x] ESLint 153→0 warnings (eslint-plugin-unused-imports + `^_` pattern); pre-commit `--max-warnings 0` no longer landmined
- [x] SecurityAdvisor system prompts were never sent to the model (JSON parse always fell back) — wired via ReasoningLoop `systemPrompt`
- [x] /auth sign-up now shows a confirmation banner (was silent after success); fake "Live Scanning" counters relabeled "Demo — Simulated Traffic"

### 2026-07-08 — Reality check (HERMES session: direct GitHub push restored)
- [ ] **FOUNDER, 5 min — THE revenue blocker:** set `STRIPE_SECRET_KEY` in Vercel.
      Live `/api/health` says `payments: missing_key` — ALL checkout (subscriptions + the $499 report) is dead until this lands.
      While there: set `STRIPE_WEBHOOK_SECRET` + point the Stripe webhook at `https://houndshield.com/api/stripe/webhook`, then re-verify `/api/health`.
      (`database` and `ai_router` show ✅ connected — those 06-10 env items are done.)
- [ ] Merge PR #151 — /pricing $499 report CTA now uses the ReportCheckoutButton rail (503-safe while the key is missing). Merge = auto prod deploy from main.
- [ ] **FOUNDER, ~20 min:** send the 10 C3PAO partner emails sitting in Gmail drafts (from 06-10 — status unknown; still the highest-leverage GTM action if unsent).
- [x] `hermes/redesign-demos` pushed (503e114 — HERMES site Direction A); Vercel preview build READY (2026-07-08)
- [x] 06-10 "push feature/beast-ui-v3" task CLOSED as obsolete — main independently shipped the CTA / testimonial / og-image fixes via PRs #103–#149; the one surviving gap (direct $499 CTA on /pricing) is PR #151 (2026-07-08)

### Superseded 2026-06-10 audit items (kept for trail)
- [~] Push `feature/beast-ui-v3` — obsolete; superseded by main (see above)
- [x] Supabase + OpenRouter env vars — verified `connected` via live /api/health (2026-07-08); Stripe keys remain the open item
- [x] Gap Report $499 payment link LIVE → https://buy.stripe.com/aFa00lgzIgJx3Aqb7qgUM00 (`prod_Ug034JhG2q2AA7`)

## Sprint 1 (Week of 2026-04-28) — Jordan deploys in 10 minutes, exports a PDF ✅ MERGED PR #62

**Sprint goal:** One customer deploys HoundShield and exports a PDF audit report for her C3PAO.

- [x] Complete `proxy/install.sh` — curl pipe bash, starts Docker, configures proxy URL + `--uninstall` + `--verify` flags
- [x] Wire PDF generation in `app/api/reports/generate/` — jsPDF, 5-page C3PAO report, tier gating, demo mode
- [x] E2E test: proxy intercepts ChatGPT traffic -> CUI flagged -> PDF exported (105/105 passing)
- [x] Landing page: Jordan pain copy ("Your engineers are using ChatGPT. Your assessor is 6 months away."), Anthropic/Claude coral palette, `/docs/quickstart` page
- [x] Push Supabase migrations to production — 010 (RLS fix + AI observability) + 011 (partner portal) applied 2026-05-13
- [ ] Set `OPENROUTER_API_KEY` in Vercel — Brain AI shows "trouble connecting" on live site (manual step)

## Sprint 2 (Week of 2026-05-05) — First C3PAO partner, first paying customer

- [ ] Contact 10 C3PAOs from marketplace.cmmcab.org (use /browser-harness to scrape the list)
- [ ] Record 3-minute demo: CUI paste -> ChatGPT block -> PDF report export
- [ ] Set `STRIPE_WEBHOOK_SECRET` in Vercel dashboard
- [ ] Build `/partner` landing page — C3PAO referral program with commission structure
- [ ] Publish one technical blog post: "Why cloud-based AI DLP violates DFARS 7012"

## Sprint 3 (Week of 2026-05-12) — Brain AI queryable

- [ ] Wire `brain-query.ts` to Brain AI API route (`app/api/brain/query/route.ts`)
- [ ] Ingest CMMC framework docs via /firecrawl-ingest skill
- [ ] Ingest competitor profiles (Nightfall, Strac, Purview) via /firecrawl-ingest
- [ ] Add `GET /api/brain/ask?q=...` endpoint for founder + agent queries
- [ ] Verify: 20 test questions return correct answers before marking complete

## Sprint 4 (Week of 2026-05-19) — 5 paying customers, $1K MRR

- [ ] Onboarding email sequence (3 emails: day 1/3/7)
- [x] In-app CMMC control coverage map — shows Jordan which controls HoundShield covers (shipped PR #77)
- [ ] SPRS improvement estimate shown in dashboard (+15 to +30 points)
- [ ] C3PAO white-label dashboard MVP (rebrandable)

## Backlog (post $10K MRR)

- [ ] Azure Sentinel connector
- [ ] Splunk HEC integration
- [ ] Blockchain-anchored audit trail
- [ ] SIEM integration suite
- [ ] Multi-tenant C3PAO portal
- [ ] HITL review workflow improvements
- [ ] Mobile app
- [ ] OWASP Top 10 full security review + automated dependency scanning
- [ ] Load testing: verify <10ms latency at 1,000 req/sec (k6 or autocannon)
- [ ] Gemini Flash as secondary scanner for speed-sensitive paths (sub-5ms deterministic)
- [ ] CI/CD GitHub Actions: lint + tsc + jest gates on every PR (see `.github/workflows/`)

## Backlog — REPO_INTEGRATION_MAP (external repos, post $10K MRR)

> See `docs/REPO_INTEGRATION_MAP.md` for full context on each repo.

- [ ] browser-use — browser automation for Jordan's proxy setup walkthrough
- [ ] firecrawl — ingest CMMC/NIST docs into Brain AI knowledge graph
- [ ] ai-website-cloner — competitive intelligence ingestion
- [ ] space-agent — multi-agent orchestration for compliance audit flows
- [ ] swarm-forge — swarm-style agent patterns for parallel compliance checks
- [ ] OpenMythos / OpenHarness — agent harness patterns for proxy pipeline
- [ ] anywhere-agents — cross-platform agent deployment (Windows/Mac/Linux support)
- [ ] little-coder — lightweight in-browser coding agent for C3PAO portal
- [ ] ruflo — workflow automation for onboarding email sequences

## Done
- [x] **Pre-launch polish sweep (2026-06-11)** — Doberman logo everywhere + favicons/OG; 21 public pages migrated to v3 light-steel (NavV3/FooterV3); pricing invisible-price fix + $/mo annual presentation; Brain AI identity FAQ (works keyless); /sign-up 404 CTA fix; /roadmap page; sitemap fixes; "Hound Shield"→"HoundShield" in 110+ files; 409/409 tests
- [x] **OODA loop — full behavioral DLP engine** (`proxy/ooda/`) — commit `984c3b36`
  - 10 source files: types, db, rate-tracker, baseline, observe, orient, decide, act, loop, server migration
  - 49 vitest tests, real SQLite temp dirs, zero mocks — all green
  - `npm run build` clean, `npm test` 49/49
  - New endpoints: `/v1/quarantine`, `/v1/baselines/:entityId`, `/v1/policy/:orgId`
- [x] OODA Phase 1-5 strategic analysis — verdict: BUILD, PG would fund this
- [x] PRD v2 — `docs/HOUNDSHIELD-PRD-v2.md` with manager mode + sprint plan
- [x] Brain AI knowledge graph — `lib/brain-ai/knowledge-graph.ts` (BM25, seed knowledge, TTL-aware)
- [x] Brain AI query interface — `lib/brain-ai/brain-query.ts` (ask, addKnowledge, marketCheck)
- [x] CLAUDE.md — manager mode added
- [x] `.claude/settings.json` — model, autoMemoryEnabled, code-review-graph hooks
- [x] `.claude/agents/` — all 8 agents with memory: project and maxTurns: 20
- [x] `.claude/skills/` — all 8 skills including browser-harness, firecrawl-ingest, swarm-orchestrate, anywhere-guard
- [x] `.claude/hooks/pre-commit.sh` — tsc + eslint + npm test gates
- [x] Sprint 1 complete — PR #62 merged 2026-05-03: install.sh, PDF generation + tests, E2E proxy→CUI→PDF, Jordan landing page, /docs/quickstart, Anthropic coral palette, 105/105 tests passing
